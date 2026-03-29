<template>
  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" :class="cls">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MediaType } from '@/types'

const props = defineProps<{ type: MediaType }>()

const label = computed(() => ({ movie: '🎬 Película', series: '📺 Serie', book: '📚 Libro' }[props.type]))
const cls   = computed(() => ({
  movie:  'bg-blue-500/20 text-blue-300 border-blue-500/40',
  series: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  book:   'bg-amber-500/20 text-amber-300 border-amber-500/40',
}[props.type]))
</script>
