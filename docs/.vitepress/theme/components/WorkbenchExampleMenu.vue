<template>
  <div
    ref="menuRoot"
    class="workbench-example-menu"
    :class="{ open, available: !disabled, compact }"
    :title="hint"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @focusout="onFocusOut"
    @keydown="onMenuKeydown"
  >
    <button
      ref="trigger"
      type="button"
      class="workbench-button"
      aria-haspopup="menu"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
    >运行示例 <span aria-hidden="true">▾</span></button>
    <div v-show="open" class="workbench-example-options" role="menu">
      <button
        v-for="example in examples"
        :key="example.id"
        type="button"
        class="workbench-button"
        role="menuitem"
        @click="select(example.source)"
      >
        <strong>{{ example.title }}<template v-if="compact">：</template></strong>
        <small>{{ example.summary }}</small>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

export interface WorkbenchExample {
  id: string
  title: string
  summary: string
  source: string
}

const props = defineProps<{
  examples: readonly WorkbenchExample[]
  disabled?: boolean
  compact?: boolean
  hint?: string
}>()

const emit = defineEmits<{ select: [source: string] }>()
const open = ref(false)
const menuRoot = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
let openedByHover = false

function close() { open.value = false; openedByHover = false }
function toggle() {
  if (props.disabled) return
  if (openedByHover) openedByHover = false
  else open.value = !open.value
}
function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse' && !props.disabled && !open.value) {
    open.value = true
    openedByHover = true
  }
}
function onPointerLeave() {
  if (!menuRoot.value?.contains(document.activeElement)) close()
}
function onFocusOut(event: FocusEvent) {
  if (!menuRoot.value?.contains(event.relatedTarget as Node | null)) close()
}
async function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    event.stopPropagation()
    close()
    trigger.value?.focus()
    return
  }
  if (props.disabled || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  event.stopPropagation()
  open.value = true
  openedByHover = false
  await nextTick()
  const items = Array.from(menuRoot.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
  if (!items.length) return
  const current = items.indexOf(document.activeElement as HTMLButtonElement)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
    : event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length
  items[current < 0 && event.key === 'ArrowUp' ? items.length - 1 : next]?.focus()
}
function select(source: string) { close(); trigger.value?.focus(); emit('select', source) }
watch(() => props.disabled, disabled => { if (disabled) close() })
</script>
