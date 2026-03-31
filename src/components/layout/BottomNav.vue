<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none">
    <div class="pointer-events-auto bg-gray-950/85 backdrop-blur-2xl border-t border-white/8" :style="{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }">
      <div class="flex items-center justify-around px-2 pt-2 pb-1">

        <!-- Library -->
        <button class="nav-item" @click="$emit('library')">
          <div class="nav-icon-wrap" :class="active === 'library' ? 'text-violet-400' : 'text-gray-500'">
            <LayoutGrid class="w-5 h-5" />
            <span class="nav-dot" v-if="active === 'library'" />
          </div>
          <span class="nav-label" :class="active === 'library' ? 'text-violet-300' : 'text-gray-600'">Colección</span>
        </button>

        <!-- Calendar -->
        <button class="nav-item" @click="$emit('calendar')">
          <div class="nav-icon-wrap text-gray-500">
            <CalendarDays class="w-5 h-5" />
          </div>
          <span class="nav-label text-gray-600">Historial</span>
        </button>

        <!-- Add — centre pill -->
        <button
          @click="$emit('add')"
          class="relative -mt-5 flex flex-col items-center"
        >
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-900/70 border border-violet-400/25 transition-all duration-150 active:scale-90 active:brightness-90">
            <Plus class="w-7 h-7 text-white" />
          </div>
          <span class="nav-label text-gray-600 mt-1">Añadir</span>
        </button>

        <!-- Search -->
        <button class="nav-item" @click="$emit('search')">
          <div class="nav-icon-wrap text-gray-500">
            <Search class="w-5 h-5" />
          </div>
          <span class="nav-label text-gray-600">Buscar</span>
        </button>

        <!-- Stats -->
        <button class="nav-item" @click="$emit('stats')">
          <div class="nav-icon-wrap text-gray-500">
            <BarChart2 class="w-5 h-5" />
          </div>
          <span class="nav-label text-gray-600">Stats</span>
        </button>

      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { LayoutGrid, CalendarDays, Plus, Search, BarChart2 } from 'lucide-vue-next'

defineProps<{ active?: string }>()
defineEmits<{ library: []; calendar: []; add: []; search: []; stats: [] }>()
</script>

<style scoped>
.nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 4px 12px;
  transition: opacity .15s;
}
.nav-item:active { opacity: .6; }

.nav-icon-wrap {
  position: relative;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  transition: background-color .2s;
}

.nav-dot {
  position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
  width: 4px; height: 4px; border-radius: 9999px;
  background: #a78bfa; /* violet-400 */
}

.nav-label {
  font-size: 10px; font-weight: 600; letter-spacing: .02em;
}
</style>
