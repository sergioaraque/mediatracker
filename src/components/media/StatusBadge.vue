<template>
  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" :class="cls">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MediaStatus } from '@/types'

const props = defineProps<{ status: MediaStatus }>()

const label = computed(() => ({ watching: 'Viendo', pending: 'Pendiente', watched: 'Visto' }[props.status]))
const cls   = computed(() => ({
  watching: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  pending:  'bg-amber-500/20 text-amber-300 border-amber-500/40',
  watched:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
}[props.status]))
</script>
