<template>
  <Teleport to="body">
    <div class="fixed inset-x-4 bottom-4 md:inset-x-auto md:bottom-6 md:right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in ui.toasts"
          :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm backdrop-blur-md border"
          :class="t.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
            : 'bg-red-950/90 text-red-200 border-red-700/50'"
          @click="ui.dismiss(t.id)"
        >
          <CheckCircle2 v-if="t.type === 'success'" class="w-4 h-4 shrink-0 text-emerald-400" />
          <XCircle v-else class="w-4 h-4 shrink-0 text-red-400" />
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { CheckCircle2, XCircle } from 'lucide-vue-next'

const ui = useUiStore()
</script>

<style scoped>
.toast-enter-active  { transition: all .25s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active  { transition: all .2s ease-in; }
.toast-enter-from    { opacity: 0; transform: translateX(2rem) scale(.9); }
.toast-leave-to      { opacity: 0; transform: translateX(2rem) scale(.9); }
.toast-move          { transition: transform .25s ease; }
</style>
