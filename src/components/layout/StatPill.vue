<template>
  <div class="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium" :class="color">
    <span class="font-bold">{{ count }}</span>
    <span class="opacity-70">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count: number; label: string; color: string }>()
</script>
