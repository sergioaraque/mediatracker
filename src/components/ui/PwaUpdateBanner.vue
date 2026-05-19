<template>
  <Transition name="pwa-update">
    <div
      v-if="showBanner"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900 border border-amber-500/20 shadow-2xl shadow-black/60 backdrop-blur-xl w-[calc(100%-2rem)] max-w-md"
    >
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-900/40">
        <RefreshCw class="w-4 h-4 text-white" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-white">Nueva versión disponible</p>
        <p class="text-xs text-gray-400">Recarga para aplicar mejoras y correcciones</p>
      </div>
      <button @click="updateNow" class="btn-primary text-xs px-3 py-1.5 rounded-lg shrink-0">
        Actualizar
      </button>
      <button @click="dismiss" class="btn-ghost p-1.5 rounded-lg shrink-0 -mr-1">
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RefreshCw, X } from 'lucide-vue-next'

type UpdateEventDetail = {
  registration: ServiceWorkerRegistration
}

const showBanner = ref(false)
let registration: ServiceWorkerRegistration | null = null
let pendingReload = false

function onUpdateAvailable(event: Event) {
  const customEvent = event as CustomEvent<UpdateEventDetail>
  if (!customEvent.detail?.registration) return
  registration = customEvent.detail.registration
  showBanner.value = true
}

function onControllerChange() {
  if (!pendingReload) return
  window.location.reload()
}

onMounted(() => {
  window.addEventListener('pwa-update-available', onUpdateAvailable as EventListener)
  navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange)
})

onUnmounted(() => {
  window.removeEventListener('pwa-update-available', onUpdateAvailable as EventListener)
  navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange)
})

function dismiss() {
  showBanner.value = false
}

function updateNow() {
  if (!registration?.waiting) return
  pendingReload = true
  showBanner.value = false
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}
</script>

<style scoped>
.pwa-update-enter-active { transition: all .35s cubic-bezier(.34,1.56,.64,1); }
.pwa-update-leave-active { transition: all .2s ease-in; }
.pwa-update-enter-from, .pwa-update-leave-to { opacity: 0; transform: translateX(-50%) translateY(24px) scale(.9); }
</style>