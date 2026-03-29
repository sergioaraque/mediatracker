<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup lang="ts">
import { onMounted }    from 'vue'
import { useAuthStore } from '@/stores/auth'
import ToastContainer   from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
onMounted(() => auth.init())
</script>
