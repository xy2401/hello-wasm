<script setup lang="ts">
import { ref } from 'vue'
import { languageContainerRuntimes, type LanguageRuntimeId } from '../data/languageContainerRuntimes'

const available = languageContainerRuntimes.filter((runtime) => runtime.supported)
const selected = ref<LanguageRuntimeId>('java')
</script>

<template>
  <div class="wasm-runtime-picker" aria-label="选择运行时">
    <button
      v-for="runtime in available"
      :key="runtime.id"
      type="button"
      :aria-pressed="selected === runtime.id"
      @click="selected = runtime.id"
    >{{ runtime.name }}</button>
  </div>
  <LanguageContainerWorkbench :key="selected" :runtime-id="selected" />
</template>

