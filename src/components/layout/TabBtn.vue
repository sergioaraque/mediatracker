<template>
  <button
    @click="$emit('click')"
    class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
    :class="active
      ? 'bg-white/10 text-white shadow-sm'
      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ active: boolean }>()
defineEmits<{ click: [] }>()
</script>
