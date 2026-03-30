<template>
  <div class="sticky top-16 z-30 bg-gray-950/65 backdrop-blur-2xl border-b border-white/5">
    <div class="max-w-7xl mx-auto">

      <!-- ── Row 1: Section navigation ────────────────────────────── -->
      <div class="flex gap-2 px-4 sm:px-6 lg:px-8 pt-3 pb-2.5 overflow-x-auto scrollbar-none">
        <button
          v-for="s in sections"
          :key="s.key"
          @click="media.filterType = s.type"
          class="section-tab flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border font-medium text-sm transition-all duration-200 shrink-0 relative overflow-hidden"
          :class="media.filterType === s.type ? s.activeClass : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8 hover:text-gray-200 hover:border-white/15'"
        >
          <span class="text-base leading-none select-none">{{ s.emoji }}</span>
          <span class="font-semibold">{{ s.label }}</span>
          <span
            class="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
            :class="media.filterType === s.type ? s.countClass : 'bg-white/8 text-gray-500'"
          >{{ s.count }}</span>
          <Transition name="avg-fade">
            <span v-if="s.avg && media.filterType === s.type" class="text-xs opacity-60 font-normal">
              ★ {{ s.avg }}
            </span>
          </Transition>
        </button>

        <!-- Clear filters -->
        <Transition name="avg-fade">
          <button
            v-if="hasActiveFilters"
            @click="clearAllFilters"
            class="section-tab flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border font-medium text-sm transition-all duration-200 shrink-0 bg-white/4 border-white/8 text-gray-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 ml-auto"
          >
            <X class="w-3.5 h-3.5" />
            <span class="text-xs">Limpiar</span>
          </button>
        </Transition>
      </div>

      <!-- ── Row 2 desktop: filters + big search ───────────────────── -->
      <div class="hidden md:flex items-center gap-2 px-4 sm:px-6 lg:px-8 pb-3">

        <!-- Status pills -->
        <div class="flex items-center gap-1.5 shrink-0">
          <StatusPill
            v-for="s in statuses" :key="s.value"
            :active="media.filterStatus === s.value" :color="s.color"
            @click="media.filterStatus = media.filterStatus === s.value ? null : s.value"
          >{{ s.label }}</StatusPill>
        </div>

        <div class="w-px h-5 bg-white/10 shrink-0" />

        <!-- Rating filter -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            v-for="r in ratingFilters" :key="r"
            @click="media.filterMinRating = media.filterMinRating === r ? null : r"
            class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all"
            :class="media.filterMinRating === r
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 border-transparent'"
          ><Star class="w-2.5 h-2.5 fill-current" />{{ r }}+</button>
        </div>

        <div class="w-px h-5 bg-white/10 shrink-0" />

        <!-- Platform -->
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

        <div class="flex-1" />

        <!-- Search — prominente -->
        <div class="relative w-72 lg:w-96">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref="searchInput"
            :value="localSearch"
            type="search"
            placeholder="Buscar título, género… (Ctrl+K)"
            class="input pl-10 py-2 text-sm bg-white/5 border-white/10 focus:border-violet-500/50 focus:bg-white/8"
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
            <option value="title:ASC">A-Z</option>
            <option value="title:DESC">Z-A</option>
            <option value="year:DESC">Año ↓</option>
            <option value="rating:DESC">Mejor nota</option>
          </select>
          <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <!-- View toggle -->
        <div class="flex items-center gap-0.5 bg-white/6 rounded-xl p-1 shrink-0">
          <button @click="ui.viewMode = 'grid'" class="p-1.5 rounded-lg transition-colors" :class="ui.viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'" title="Cuadrícula"><LayoutGrid class="w-3.5 h-3.5" /></button>
          <button @click="ui.viewMode = 'list'" class="p-1.5 rounded-lg transition-colors" :class="ui.viewMode === 'list' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'" title="Lista"><List class="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <!-- ── Row 2 mobile: chips + sort + view ──────────────────────── -->
      <div class="md:hidden flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
        <StatusPill
          v-for="s in statuses" :key="s.value"
          :active="media.filterStatus === s.value" :color="s.color"
          @click="media.filterStatus = media.filterStatus === s.value ? null : s.value"
          class="shrink-0"
        >{{ s.label }}</StatusPill>

        <div class="w-px h-5 bg-white/10 shrink-0" />

        <button
          v-for="r in ratingFilters" :key="r"
          @click="media.filterMinRating = media.filterMinRating === r ? null : r"
          class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0"
          :class="media.filterMinRating === r ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-gray-500 border-transparent'"
        ><Star class="w-2.5 h-2.5 fill-current" />{{ r }}+</button>

        <div class="w-px h-5 bg-white/10 shrink-0" />

        <div class="relative shrink-0">
          <select
            :value="media.sortField + ':' + media.sortOrder" @change="onSortChange"
            class="input text-xs py-1 pl-2 pr-6 appearance-none cursor-pointer bg-white/6 border-white/8 rounded-lg"
          >
            <option value="$createdAt:DESC">Reciente</option>
            <option value="$createdAt:ASC">Más antiguo</option>
            <option value="title:ASC">A-Z</option>
            <option value="rating:DESC">Mejor nota</option>
          </select>
          <ChevronDown class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>

        <div class="flex items-center gap-0.5 bg-white/6 rounded-xl p-1 shrink-0 ml-auto">
          <button @click="ui.viewMode = 'grid'" class="p-1.5 rounded-lg" :class="ui.viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-gray-500'"><LayoutGrid class="w-3.5 h-3.5" /></button>
          <button @click="ui.viewMode = 'list'" class="p-1.5 rounded-lg" :class="ui.viewMode === 'list' ? 'bg-white/15 text-white' : 'text-gray-500'"><List class="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <!-- ── Mobile search (full width) ────────────────────────────── -->
      <div class="md:hidden px-4 pb-3">
        <div class="relative">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            :value="localSearch" type="search" placeholder="Buscar título, género…"
            class="input pl-10 py-3 text-sm bg-white/5 border-white/10 w-full text-base"
            @input="onSearchInput"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Search, ChevronDown, Star, LayoutGrid, List, X } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import type { SortField, SortOrder } from '@/stores/media'
import StatusPill from './StatusPill.vue'

const media = useMediaStore()
const ui    = useUiStore()

const statuses = [
  { value: 'watching', label: 'Viendo',     color: 'blue'    },
  { value: 'pending',  label: 'Pendiente',  color: 'amber'   },
  { value: 'watched',  label: 'Visto',      color: 'emerald' },
  { value: 'dropped',  label: 'Abandonado', color: 'red'     },
] as const

const ratingFilters = [6, 7, 8, 9] as const

const PLATFORMS = [
  'Netflix','HBO Max','Prime Video','Disney+','Apple TV+',
  'Movistar+','Crunchyroll','Filmin','Mubi','YouTube','Físico','Otro',
]

function calcAvg(type: string): string | null {
  const rated = media.all.filter(m => m.type === type && m.rating)
  if (!rated.length) return null
  return (rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length).toFixed(1)
}

const sections = computed(() => [
  {
    key: 'all', type: null as string | null,
    emoji: '✦', label: 'Todo',
    count: media.all.length, avg: null,
    activeClass: 'bg-white/10 border-white/20 text-white',
    countClass:  'bg-white/15 text-white',
  },
  {
    key: 'movie', type: 'movie',
    emoji: '🎬', label: 'Películas',
    count: media.all.filter(m => m.type === 'movie').length,
    avg:   calcAvg('movie'),
    activeClass: 'bg-blue-500/15 border-blue-500/35 text-blue-100 shadow-lg shadow-blue-500/10',
    countClass:  'bg-blue-500/25 text-blue-200',
  },
  {
    key: 'series', type: 'series',
    emoji: '📺', label: 'Series',
    count: media.all.filter(m => m.type === 'series').length,
    avg:   calcAvg('series'),
    activeClass: 'bg-violet-500/15 border-violet-500/35 text-violet-100 shadow-lg shadow-violet-500/10',
    countClass:  'bg-violet-500/25 text-violet-200',
  },
  {
    key: 'book', type: 'book',
    emoji: '📚', label: 'Libros',
    count: media.all.filter(m => m.type === 'book').length,
    avg:   calcAvg('book'),
    activeClass: 'bg-amber-500/15 border-amber-500/35 text-amber-100 shadow-lg shadow-amber-500/10',
    countClass:  'bg-amber-500/25 text-amber-200',
  },
])

const hasActiveFilters = computed(() =>
  media.filterStatus !== null ||
  media.filterMinRating !== null ||
  media.filterPlatform !== null ||
  media.search !== ''
)

function clearAllFilters() {
  media.filterStatus    = null
  media.filterMinRating = null
  media.filterPlatform  = null
  media.search          = ''
  localSearch.value     = ''
}

const localSearch = ref(media.search)
const searchInput = ref<HTMLInputElement>()
let debounceTimer = 0

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

onUnmounted(() => clearTimeout(debounceTimer))

defineExpose({ focusSearch: () => searchInput.value?.focus() })
</script>

<style scoped>
.section-tab { cursor: pointer; }
.section-tab:active { transform: scale(.97); }

.avg-fade-enter-active { transition: all .2s ease; }
.avg-fade-leave-active { transition: all .15s ease; }
.avg-fade-enter-from, .avg-fade-leave-to { opacity: 0; transform: translateX(-4px); }
</style>
