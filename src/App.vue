<template>
  <RouterView />
  <ToastContainer />
  <PwaInstallBanner />
  <RatingDialog />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useMediaStore }   from '@/stores/media'
import ToastContainer      from '@/components/ui/ToastContainer.vue'
import PwaInstallBanner    from '@/components/ui/PwaInstallBanner.vue'
import RatingDialog        from '@/components/ui/RatingDialog.vue'

const auth  = useAuthStore()
const media = useMediaStore()

function onVisibilityChange() {
  if (document.visibilityState === 'visible') media.checkReminders()
}

onMounted(() => {
  auth.init()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>
