<template>
  <div class="sticky top-16 z-30 bg-gray-950/75 backdrop-blur-md border-b border-white/5">
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

      <!-- ── Row 2 desktop: primary controls ────────────────────────── -->
      <div class="hidden md:flex items-center gap-2 px-4 sm:px-6 lg:px-8 pb-3">

        <!-- Status pills -->
        <div class="flex items-center gap-1.5 shrink-0">
          <StatusPill
            v-for="s in statuses" :key="s.value"
            :active="media.filterStatus === s.value" :color="s.color"
            @click="media.filterStatus = media.filterStatus === s.value ? null : s.value"
          >{{ s.label }}</StatusPill>
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
            class="input pl-10 pr-10 py-2 text-sm bg-white/5 border-white/10 focus:border-violet-500/50 focus:bg-white/8"
            @input="onSearchInput"
            @keydown.esc.prevent="clearSearch"
          />
          <!-- Suggestions -->
          <div v-if="showSuggestions && (genreSuggestions.length || tmdbSuggestions.length)" class="absolute left-0 mt-1 w-full bg-gray-900 border border-white/6 rounded-lg shadow-2xl z-40">
            <ul v-if="genreSuggestions.length" class="max-h-44 overflow-auto">
              <li v-for="g in genreSuggestions" :key="g" class="px-3 py-2 hover:bg-white/5 cursor-pointer text-sm" @click="chooseGenreSuggestion(g)">{{ g }}</li>
            </ul>
            <ul v-if="tmdbSuggestions.length" class="max-h-44 overflow-auto border-t border-white/6">
              <li v-for="i in tmdbSuggestions" :key="i.id" class="px-3 py-2 hover:bg-white/5 cursor-pointer text-sm flex items-center gap-2" @click="applyTmdbSuggestion(i)">
                <img v-if="i.poster_path || i.profile_path" :src="tmdbPoster(i.poster_path || i.profile_path, 'w92')" class="w-8 h-12 rounded object-cover" />
                <div class="truncate">
                  <div class="font-semibold truncate">{{ tmdbDisplayTitle(i) }}</div>
                  <div class="text-xs text-gray-400 truncate">{{ (i.media_type || (i.title ? 'movie' : 'tv')) }}</div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Presets button + dropdown -->
          <div class="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button @click.prevent="savePreset" title="Guardar búsqueda" class="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/8">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </button>
            <div class="relative">
              <button @click.prevent="(showPresets = !showPresets, ui.setShowSearchPresets(showPresets))" class="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/8">
                <ChevronDown class="w-4 h-4" />
              </button>
              <div v-if="showPresets" class="absolute right-0 mt-1 w-60 bg-gray-900 border border-white/6 rounded-lg shadow-2xl z-50">
                <div v-if="presets.length" class="p-2">
                  <div v-for="p in presets" :key="p.id" class="flex items-center justify-between gap-2 p-2 hover:bg-white/5 rounded">
                    <div class="flex-1 min-w-0">
                      <button @click.prevent="applyPreset(p)" class="text-sm text-left truncate w-full">
                        <div class="flex items-center gap-2">
                          <span class="font-semibold truncate">{{ p.name }}</span>
                          <span class="text-xs text-gray-400 truncate">· {{ p.query }}</span>
                        </div>
                      </button>
                      <div class="mt-1 flex gap-1 text-xs">
                        <span v-if="p.filters?.type" class="px-2 py-0.5 rounded-full bg-white/6 text-gray-300">{{ p.filters.type }}</span>
                        <span v-if="p.filters?.status" class="px-2 py-0.5 rounded-full bg-white/6 text-gray-300">{{ p.filters.status }}</span>
                        <span v-if="p.filters?.minRating" class="px-2 py-0.5 rounded-full bg-white/6 text-gray-300">★ {{ p.filters.minRating }}+</span>
                        <span v-if="p.filters?.platform" class="px-2 py-0.5 rounded-full bg-white/6 text-gray-300">{{ p.filters.platform }}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button @click.prevent="removePreset(p.id)" class="text-xs text-red-400 ml-2">Eliminar</button>
                    </div>
                  </div>
                </div>
                <div v-else class="p-3 text-sm text-gray-400">No hay presets guardados</div>
              </div>
            </div>
          </div>
          <button
            v-if="localSearch"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-200 hover:bg-white/8 transition-colors"
            @click="clearSearch"
            aria-label="Limpiar búsqueda"
          >
            <X class="w-3.5 h-3.5" />
          </button>
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

        <button
          @click="showAdvanced = !showAdvanced"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0"
          :class="showAdvanced || advancedFilterCount > 0
            ? 'bg-violet-500/15 text-violet-200 border-violet-500/35'
            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'"
        >
          Filtros avanzados
          <span
            v-if="advancedFilterCount > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/25 text-violet-200"
          >{{ advancedFilterCount }}</span>
        </button>

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

        <button
          @click="showAdvanced = !showAdvanced"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-colors"
          :class="showAdvanced || advancedFilterCount > 0
            ? 'bg-violet-500/15 text-violet-200 border-violet-500/35'
            : 'bg-white/5 text-gray-400 border-white/10'"
        >
          Filtros
          <span v-if="advancedFilterCount > 0" class="text-[10px] font-bold">{{ advancedFilterCount }}</span>
        </button>

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
            class="input pl-10 pr-10 py-3 text-sm bg-white/5 border-white/10 w-full text-base"
            @input="onSearchInput"
            @keydown.esc.prevent="clearSearch"
          />
          <button
            v-if="localSearch"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-200 hover:bg-white/8 transition-colors"
            @click="clearSearch"
            aria-label="Limpiar búsqueda"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- ── Active filters summary ─────────────────────────────── -->
      <div v-if="activeFilters.length" class="px-4 sm:px-6 lg:px-8 pb-3">
        <div class="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Filtros activos</span>
          <button
            v-for="filter in activeFilters"
            :key="filter.key"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-gray-300 hover:border-white/20 hover:bg-white/8 transition-colors"
            @click="filter.clear"
          >
            <span>{{ filter.label }}</span>
            <X class="w-3 h-3 text-gray-500" />
          </button>
          <button
            class="ml-auto inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200 hover:bg-violet-500/15 transition-colors"
            @click="clearAllFilters"
          >
            Limpiar todo
          </button>
        </div>
      </div>

      <!-- ── Advanced filters (desktop + mobile) ───────────────────── -->
      <Transition name="avg-fade">
        <div
          v-if="showAdvanced"
          class="px-4 sm:px-6 lg:px-8 pb-3"
        >
          <div class="rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
            <div class="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div class="flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none pb-1 md:pb-0">
                <button
                  v-for="r in ratingFilters" :key="r"
                  @click="media.filterMinRating = media.filterMinRating === r ? null : r"
                  class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0"
                  :class="media.filterMinRating === r
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 border-transparent'"
                ><Star class="w-2.5 h-2.5 fill-current" />{{ r }}+</button>
              </div>

              <div class="relative md:w-52">
                <select
                  :value="media.filterPlatform ?? ''"
                  @change="e => media.filterPlatform = (e.target as HTMLSelectElement).value || null"
                  class="input text-sm py-2 pr-8 appearance-none cursor-pointer"
                  :class="media.filterPlatform ? 'border-violet-500/40 text-white' : 'text-gray-400'"
                >
                  <option value="">Todas las plataformas</option>
                  <option v-for="p in PLATFORMS" :key="p" :value="p">{{ p }}</option>
                </select>
                <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              <button
                v-if="advancedFilterCount > 0"
                @click="clearAdvancedFilters"
                class="btn-ghost text-xs px-3 py-2 rounded-lg self-start md:self-auto"
              >
                Limpiar avanzados
              </button>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Search, ChevronDown, Star, LayoutGrid, List, X } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import { useSearchPresets } from '@/composables/useSearchPresets'
import { useUiStore } from '@/stores/ui'
import { fetchSearch, tmdbDisplayTitle, tmdbPoster } from '@/lib/tmdb'
import { useUiStore } from '@/stores/ui'
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
  media.filterType !== null ||
  media.filterStatus !== null ||
  media.filterMinRating !== null ||
  media.filterPlatform !== null ||
  media.search !== ''
)

const advancedFilterCount = computed(() =>
  Number(media.filterMinRating !== null) + Number(media.filterPlatform !== null)
)

const activeFilters = computed(() => {
  const filters: Array<{ key: string; label: string; clear: () => void }> = []

  if (media.filterType) {
    const typeLabel = sections.value.find(section => section.type === media.filterType)?.label ?? media.filterType
    filters.push({ key: 'type', label: typeLabel, clear: () => { media.filterType = null } })
  }

  if (media.filterStatus) {
    const statusLabel = statuses.find(status => status.value === media.filterStatus)?.label ?? media.filterStatus
    filters.push({ key: 'status', label: statusLabel, clear: () => { media.filterStatus = null } })
  }

  if (media.filterMinRating !== null) {
    filters.push({ key: 'rating', label: `${media.filterMinRating}+ ★`, clear: () => { media.filterMinRating = null } })
  }

  if (media.filterPlatform) {
    filters.push({ key: 'platform', label: media.filterPlatform, clear: () => { media.filterPlatform = null } })
  }

  if (media.search) {
    filters.push({ key: 'search', label: `“${media.search}”`, clear: clearSearch })
  }

  return filters
})

const showAdvanced = ref(false)

function clearAllFilters() {
  media.filterType      = null
  media.filterStatus    = null
  media.filterMinRating = null
  media.filterPlatform  = null
  media.search          = ''
  localSearch.value     = ''
}

function clearSearch() {
  media.search = ''
  localSearch.value = ''
}

function clearAdvancedFilters() {
  media.filterMinRating = null
  media.filterPlatform  = null
}

const localSearch = ref(media.search)
const searchInput = ref<HTMLInputElement>()
let debounceTimer = 0
const showSuggestions = ref(false)
const showPresets = ref(false)
const ui = useUiStore()
const { presets, add, remove } = useSearchPresets()
const tmdbSuggestions = ref<any[]>([])
const tmdbCache = new Map<string, any[]>()
let tmdbTimer = 0
const uiStore = useUiStore()

function onSearchInput(e: Event) {
  localSearch.value = (e.target as HTMLInputElement).value
  clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => { media.search = localSearch.value }, 140)
  showSuggestions.value = true
}

watch(() => media.search, v => { if (v !== localSearch.value) localSearch.value = v })

function onSortChange(e: Event) {
  const [field, order] = (e.target as HTMLSelectElement).value.split(':')
  media.sortField = field as SortField
  media.sortOrder = order as SortOrder
}

onUnmounted(() => clearTimeout(debounceTimer))

watch(() => ui.showSearchPresets, v => {
  showPresets.value = !!v
  if (v) {
    // focus search input when opened via keyboard
    setTimeout(() => searchInput.value?.focus(), 50)
  }
})

const uniqueGenres = computed(() => {
  const s = new Set<string>()
  for (const m of media.all) {
    if (!m.genre) continue
    for (const g of m.genre.split(',')) s.add(g.trim())
  }
  return Array.from(s).sort()
})

const genreSuggestions = computed(() => {
  const q = localSearch.value.trim().toLowerCase()
  if (!q) return []
  return uniqueGenres.value.filter(g => g.toLowerCase().includes(q)).slice(0, 8)
})

function chooseGenreSuggestion(g: string) {
  localSearch.value = g
  media.search = g
  showSuggestions.value = false
  searchInput.value?.focus()
}

async function fetchTmdbSuggestions(q: string) {
  if (!q || q.trim().length < 3) { tmdbSuggestions.value = []; return }
  const key = q.trim().toLowerCase()
  if (tmdbCache.has(key)) { tmdbSuggestions.value = tmdbCache.get(key) || []; return }
  try {
    const res = await fetchSearch(q)
    tmdbCache.set(key, res)
    tmdbSuggestions.value = res
  } catch (e) {
    tmdbSuggestions.value = []
  }
}

function onSearchInput(e: Event) {
  localSearch.value = (e.target as HTMLInputElement).value
  clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => { media.search = localSearch.value }, 140)
  showSuggestions.value = true
  clearTimeout(tmdbTimer)
  tmdbTimer = window.setTimeout(() => void fetchTmdbSuggestions(localSearch.value), 300)
}

function savePreset() {
  const name = prompt('Nombre para la búsqueda (presets guardados)')
  if (!name) return
  add({ name, query: localSearch.value, filters: { type: media.filterType, status: media.filterStatus, minRating: media.filterMinRating, platform: media.filterPlatform } })
  showPresets.value = true
}

function applyPreset(p: any) {
  media.search = p.query
  localSearch.value = p.query
  media.filterType = p.filters?.type ?? null
  media.filterStatus = p.filters?.status ?? null
  media.filterMinRating = p.filters?.minRating ?? null
  media.filterPlatform = p.filters?.platform ?? null
  showPresets.value = false
  uiStore.toast(`Preset "${p.name}" aplicado`)
}

function removePreset(id: string) {
  if (!confirm('Eliminar preset? Esta acción no se puede deshacer.')) return
  remove(id)
  uiStore.toast('Preset eliminado', 'info')
}

function applyTmdbSuggestion(item: any) {
  const title = tmdbDisplayTitle(item)
  localSearch.value = title
  media.search = title
  showSuggestions.value = false
  uiStore.toast(`Sugerencia TMDB aplicada: ${title}`)
}

function applyPreset(p: any) {
  media.search = p.query
  localSearch.value = p.query
  media.filterType = p.filters?.type ?? null
  media.filterStatus = p.filters?.status ?? null
  media.filterMinRating = p.filters?.minRating ?? null
  media.filterPlatform = p.filters?.platform ?? null
  showPresets.value = false
}

defineExpose({ focusSearch: () => searchInput.value?.focus() })
</script>

<style scoped>
.section-tab { cursor: pointer; }
.section-tab:active { transform: scale(.97); }

.avg-fade-enter-active { transition: all .2s ease; }
.avg-fade-leave-active { transition: all .15s ease; }
.avg-fade-enter-from, .avg-fade-leave-to { opacity: 0; transform: translateX(-4px); }
</style>
