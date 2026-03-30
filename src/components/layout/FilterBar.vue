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

      <!-- Rating filter -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-for="r in ratingFilters"
          :key="r"
          @click="media.filterMinRating = media.filterMinRating === r ? null : r"
          class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all"
          :class="media.filterMinRating === r
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'"
        >
          <Star class="w-2.5 h-2.5 fill-current" />{{ r }}+
        </button>
      </div>

      <!-- Platform filter -->
      <div class="relative shrink-0">
        <select
          :value="media.filterPlatform ?? ''"
          @change="e => media.filterPlatform = (e.target as HTMLSelectElement).value || null"
          class="input text-sm py-1.5 pr-8 appearance-none cursor-pointer"
          :class="media.filterPlatform ? 'border-violet-500/40 text-white' : 'text-gray-400'"
        >
          <option value="">Plataforma</option>
          <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
        </select>
        <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Search -->
      <div class="relative w-full sm:w-48 lg:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          ref="searchInput"
          :value="localSearch"
          type="search"
          placeholder="Buscar… (Ctrl+K)"
          class="input pl-9 py-1.5 text-sm"
          @input="onSearchInput"
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

      <!-- View toggle -->
      <div class="flex items-center gap-0.5 bg-white/5 rounded-xl p-1 shrink-0">
        <button
          @click="ui.viewMode = 'grid'"
          class="p-1.5 rounded-lg transition-colors"
          :class="ui.viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'"
          title="Vista cuadrícula"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
        </button>
        <button
          @click="ui.viewMode = 'list'"
          class="p-1.5 rounded-lg transition-colors"
          :class="ui.viewMode === 'list' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'"
          title="Vista lista"
        >
          <List class="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, ChevronDown, Star, LayoutGrid, List } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import type { SortField, SortOrder } from '@/stores/media'
import TabBtn     from './TabBtn.vue'
import StatusPill from './StatusPill.vue'

const media = useMediaStore()
const ui    = useUiStore()

const statuses = [
  { value: 'watching', label: 'Viendo',    color: 'blue' },
  { value: 'pending',  label: 'Pendiente', color: 'amber' },
  { value: 'watched',  label: 'Visto',     color: 'emerald' },
] as const

const ratingFilters = [6, 7, 8, 9] as const

const PLATFORMS = [
  'Netflix', 'HBO Max', 'Prime Video', 'Disney+', 'Apple TV+',
  'Movistar+', 'Crunchyroll', 'Filmin', 'Mubi', 'YouTube', 'Físico', 'Otro',
]

const localSearch  = ref(media.search)
const searchInput  = ref<HTMLInputElement>()
let debounceTimer  = 0

function onSearchInput(e: Event) {
  localSearch.value = (e.target as HTMLInputElement).value
  clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => { media.search = localSearch.value }, 280)
}

watch(() => media.search, v => { if (v !== localSearch.value) localSearch.value = v })

function onSortChange(e: Event) {
  const [field, order] = (e.target as HTMLSelectElement).value.split(':')
  media.sortField = field as SortField
  media.sortOrder = order as SortOrder
}

// Expose focus method for keyboard shortcut
defineExpose({ focusSearch: () => searchInput.value?.focus() })
</script>
