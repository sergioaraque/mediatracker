<template>
  <div v-if="hasError" class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="rounded-2xl border border-red-500/25 bg-red-500/5 p-8 text-center">
        <div class="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-8 h-8 text-red-400" />
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
        <p class="text-gray-400 text-sm mb-4">
          Parece que encontramos un error inesperado. Por favor, intenta recargar la página.
        </p>
        <p v-if="isDev && error" class="text-xs text-red-400/70 bg-red-500/10 rounded p-2 mb-4 font-mono text-left overflow-auto max-h-20">
          {{ error.message }}
        </p>
        <button
          @click="reset"
          class="btn-primary w-full"
        >
          Recargar página
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

const hasError = ref(false)
const error = ref<Error | null>(null)
const isDev = import.meta.env.DEV

onErrorCaptured((err) => {
  console.error('[ErrorBoundary] Caught error:', err)
  error.value = err as Error
  hasError.value = true
  // Return false to prevent propagation
  return false
})

function reset() {
  hasError.value = false
  error.value = null
  window.location.reload()
}
</script>
