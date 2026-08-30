<template>
  <div
    class="workbench-example-menu"
    :class="{ open, available: !disabled, compact }"
    :title="hint"
    @mouseleave="close"
    @keydown.esc="close"
  >
    <button
      type="button"
      class="workbench-button"
      aria-haspopup="menu"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
    >运行示例 <span aria-hidden="true">▾</span></button>
    <div class="workbench-example-options" role="menu">
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
import { ref } from 'vue'

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

function close() { open.value = false }
function toggle() { if (!props.disabled) open.value = !open.value }
function select(source: string) { close(); emit('select', source) }
</script>
