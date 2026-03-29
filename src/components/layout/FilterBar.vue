<template>
  <div class="bg-gray-950/50 border-b border-white/5 sticky top-16 z-30 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">

      <!-- Type tabs -->
      <div class="flex items-center gap-1 bg-white/5 rounded-xl p-1 shrink-0">
        <TabBtn :active="media.filterType === null"     @click="media.filterType = null">     Todos </TabBtn>
        <TabBtn :active="media.filterType === 'movie'"  @click="media.filterType = 'movie'"> 🎬 Pelis </TabBtn>
        <TabBtn :active="media.filterType === 'series'" @click="media.filterType = 'series'">📺 Series</TabBtn>
        <TabBtn :active="media.filterType === 'book'"   @click="media.filterType = 'book'">  📚 Libros</TabBtn>
      </div>

      <!-- Status pills -->
      <div class="flex items-center gap-1.5 shrink-0">
        <StatusPill
          v-for="s in statuses"
          :key="s.value"
          :active="media.filterStatus === s.value"
          :color="s.color"
          @click="media.filterStatus = media.filterStatus === s.value ? null : s.value"
        >{{ s.label }}</StatusPill>
      </div>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Search -->
      <div class="relative w-full sm:w-48 lg:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          v-model="media.search"
          type="search"
          placeholder="Buscar..."
          class="input pl-9 py-1.5 text-sm"
        />
      </div>

      <!-- Sort -->
      <div class="relative shrink-0">
        <select
          :value="media.sortField + ':' + media.sortOrder"
          @change="onSortChange"
          class="input text-sm py-1.5 pr-8 appearance-none cursor-pointer"
        >
          <option value="$createdAt:DESC">Reciente</option>
          <option value="$createdAt:ASC">Más antiguo</option>
          <option value="title:ASC">Título A-Z</option>
          <option value="title:DESC">Título Z-A</option>
          <option value="year:DESC">Año desc.</option>
          <option value="year:ASC">Año asc.</option>
          <option value="rating:DESC">Mejor valorado</option>
        </select>
        <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, ChevronDown } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import type { SortField, SortOrder } from '@/stores/media'
import TabBtn    from './TabBtn.vue'
import StatusPill from './StatusPill.vue'

const media = useMediaStore()

const statuses = [
  { value: 'watching', label: 'Viendo',    color: 'blue' },
  { value: 'pending',  label: 'Pendiente', color: 'amber' },
  { value: 'watched',  label: 'Visto',     color: 'emerald' },
] as const

function onSortChange(e: Event) {
  const [field, order] = (e.target as HTMLSelectElement).value.split(':')
  media.sortField = field as SortField
  media.sortOrder = order as SortOrder
}
</script>
