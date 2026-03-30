<template>
  <button
    @click="$emit('click')"
    class="px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150"
    :class="active ? activeClass : inactiveClass"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ active: boolean; color: 'blue' | 'amber' | 'emerald' | 'red' }>()
defineEmits<{ click: [] }>()

const map = {
  blue:    { active: 'bg-blue-500/20 text-blue-300 border-blue-500/40',       inactive: 'bg-transparent text-gray-400 border-white/10 hover:border-blue-500/30 hover:text-blue-300' },
  amber:   { active: 'bg-amber-500/20 text-amber-300 border-amber-500/40',    inactive: 'bg-transparent text-gray-400 border-white/10 hover:border-amber-500/30 hover:text-amber-300' },
  emerald: { active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', inactive: 'bg-transparent text-gray-400 border-white/10 hover:border-emerald-500/30 hover:text-emerald-300' },
  red:     { active: 'bg-red-500/20 text-red-300 border-red-500/40',          inactive: 'bg-transparent text-gray-400 border-white/10 hover:border-red-500/30 hover:text-red-300' },
}

const activeClass   = computed(() => map[props.color].active)
const inactiveClass = computed(() => map[props.color].inactive)
</script>
