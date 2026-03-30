<template>
  <Transition name="pwa">
    <div
      v-if="showBanner"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900 border border-white/15 shadow-2xl shadow-black/60 backdrop-blur-xl w-[calc(100%-2rem)] max-w-sm"
    >
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/40">
        <Download class="w-4 h-4 text-white" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-white">Instalar MediaLog</p>
        <p class="text-xs text-gray-400">Acceso rápido desde tu pantalla de inicio</p>
      </div>
      <button @click="install" class="btn-primary text-xs px-3 py-1.5 rounded-lg shrink-0">
        Instalar
      </button>
      <button @click="dismiss" class="btn-ghost p-1.5 rounded-lg shrink-0 -mr-1">
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Download, X }   from 'lucide-vue-next'

const showBanner = ref(false)
let deferredPrompt: any = null

function onBeforeInstall(e: Event) {
  e.preventDefault()
  deferredPrompt   = e
  showBanner.value = true
}
function onAppInstalled() {
  showBanner.value = false
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('appinstalled', onAppInstalled)
})
onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  window.removeEventListener('appinstalled', onAppInstalled)
})

async function install() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  await deferredPrompt.userChoice
  deferredPrompt   = null
  showBanner.value = false
}

function dismiss() {
  showBanner.value = false
}
</script>

<style scoped>
.pwa-enter-active { transition: all .35s cubic-bezier(.34,1.56,.64,1); }
.pwa-leave-active { transition: all .2s ease-in; }
.pwa-enter-from, .pwa-leave-to { opacity: 0; transform: translateX(-50%) translateY(24px) scale(.9); }
</style>
