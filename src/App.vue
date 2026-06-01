<template>
  <ErrorBoundary>
    <RouterView />
    <ToastContainer />
    <PwaInstallBanner />
    <PwaUpdateBanner />
    <RatingDialog />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useMediaStore }   from '@/stores/media'
import ErrorBoundary       from '@/components/ErrorBoundary.vue'
import ToastContainer      from '@/components/ui/ToastContainer.vue'
import PwaInstallBanner    from '@/components/ui/PwaInstallBanner.vue'
import PwaUpdateBanner     from '@/components/ui/PwaUpdateBanner.vue'
import RatingDialog        from '@/components/ui/RatingDialog.vue'

const media = useMediaStore()
let reminderTimer: ReturnType<typeof setInterval> | undefined

function onVisibilityChange() {
  if (document.visibilityState === 'visible') media.checkReminders()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  void media.checkReminders()
  reminderTimer = setInterval(() => {
    void media.checkReminders()
  }, 30 * 60 * 1000)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (reminderTimer) clearInterval(reminderTimer)
})
</script>
