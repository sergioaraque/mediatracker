<template>
  <div class="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium" :class="color">
    <span class="font-bold">{{ count }}</span>
    <span class="opacity-70">{{ label }}</span>
    <template v-if="avg">
      <span class="opacity-30">·</span>
      <span class="opacity-80">⭐ {{ avg }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count: number; label: string; color: string; avg?: string | null }>()
</script>
