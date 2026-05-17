<template>
  <Transition name="fade">
    <div
      v-if="syncing"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25"
    >
      <div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      <span class="text-xs font-semibold text-cyan-300">Sincronizando...</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import { storeToRefs } from 'pinia'

const media = useMediaStore()
const { syncing } = storeToRefs(media)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
