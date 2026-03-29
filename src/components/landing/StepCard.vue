<template>
  <div class="relative flex flex-col items-center text-center gap-4">
    <!-- Number circle -->
    <div class="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl z-10">
      {{ icon }}
      <span class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
        {{ number }}
      </span>
    </div>
    <div>
      <h3 class="font-bold text-white mb-1">{{ title }}</h3>
      <p class="text-gray-400 text-sm leading-relaxed">{{ desc }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ number: string; icon: string; title: string; desc: string }>()
</script>
