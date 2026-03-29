<template>
  <RouterView />
  <ToastContainer />
  <PwaInstallBanner />
</template>

<script setup lang="ts">
import { onMounted }      from 'vue'
import { useAuthStore }   from '@/stores/auth'
import ToastContainer     from '@/components/ui/ToastContainer.vue'
import PwaInstallBanner   from '@/components/ui/PwaInstallBanner.vue'

const auth = useAuthStore()
onMounted(() => auth.init())
</script>
