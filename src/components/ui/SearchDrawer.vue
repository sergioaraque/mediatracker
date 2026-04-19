<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="close" />
    </Transition>

    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="drawer-panel max-w-2xl"
        @click.stop
      >
        <!-- Header -->
        <div class="drawer-header">
          <div class="drawer-title-group">
            <Search class="w-4.5 h-4.5 text-violet-400 shrink-0" />
            <div class="min-w-0">
              <h2 class="drawer-title">Buscar En TMDB</h2>
              <p class="drawer-subtitle">Busca por titulo o explora por filtros</p>
            </div>
          </div>
          <button @click="close" class="drawer-close shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Search input -->
        <div class="px-4 py-3 border-b border-white/8 shrink-0">
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="w-full bg-gray-800 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-gray-700 transition-colors"
              placeholder="Buscar por título…"
              @keydown.escape="close"
            />
            <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400 animate-spin" />
          </div>
        </div>

        <!-- Type tabs + filter toggle -->
        <div class="flex items-center gap-1 px-4 pt-2.5 pb-2 shrink-0">
          <button
            v-for="t in tabs" :key="t.value"
            @click="activeType = t.value"
            class="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150"
            :class="activeType === t.value
              ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
              : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
          >
            {{ t.emoji }} {{ t.label }}
          </button>
          <button
            @click="showFilters = !showFilters"
            class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all duration-150 relative"
            :class="activeFiltersCount
              ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
              : showFilters
                ? 'bg-white/8 border-white/15 text-white'
                : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
          >
            <SlidersHorizontal class="w-3.5 h-3.5" />
            <span v-if="activeFiltersCount" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
              {{ activeFiltersCount }}
            </span>
          </button>
        </div>

        <!-- Filtros avanzados -->
        <Transition name="filters">
          <div v-if="showFilters" class="px-4 pb-3 space-y-2.5 border-b border-white/6 shrink-0 bg-white/2">

            <!-- Género -->
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Género</label>
              <div class="relative">
                <select v-model="filterGenre" class="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-violet-500/50">
                  <option :value="null">Todos los géneros</option>
                  <option v-for="g in GENRES" :key="g.id" :value="g.id">{{ g.label }}</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <!-- Año + Rating -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Año desde</label>
                <input
                  v-model.number="filterYearFrom"
                  type="number"
                  placeholder="1970"
                  min="1888"
                  :max="currentYear"
                  class="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Año hasta</label>
                <input
                  v-model.number="filterYearTo"
                  type="number"
                  :placeholder="String(currentYear)"
                  min="1888"
                  :max="currentYear + 2"
                  class="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            <!-- Min rating -->
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Valoración TMDB mínima</label>
              <div class="flex gap-2">
                <button
                  v-for="r in ratingOptions" :key="r.value"
                  @click="filterMinRating = filterMinRating === r.value ? null : r.value"
                  class="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150"
                  :class="filterMinRating === r.value
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                    : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
                >
                  ★ {{ r.label }}
                </button>
              </div>
            </div>

            <!-- Clear filters -->
            <button
              v-if="activeFiltersCount"
              @click="clearFilters"
              class="text-[11px] text-red-400 hover:text-red-300 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </Transition>

        <!-- Mode indicator when using discover (no query) -->
        <div v-if="!query.trim() && activeFiltersCount && results.length" class="px-4 py-2 shrink-0 border-b border-white/5">
          <p class="text-[11px] text-violet-400 flex items-center gap-1.5">
            <Compass class="w-3 h-3" />
            Explorando por filtros — {{ results.length }} títulos
          </p>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">

          <!-- Empty/hint state -->
          <div v-if="!query.trim() && !activeFiltersCount" class="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <div class="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Search class="w-6 h-6 text-violet-400" />
            </div>
            <p class="text-gray-400 text-sm">Escribe un título o aplica filtros para explorar</p>
          </div>

          <!-- Loading skeleton -->
          <div v-else-if="loading && !results.length" class="p-4 space-y-3">
            <div v-for="i in 5" :key="i" class="flex gap-3 animate-pulse">
              <div class="w-12 h-16 rounded-lg bg-white/8 shrink-0" />
              <div class="flex-1 space-y-2 py-1">
                <div class="h-3 bg-white/8 rounded w-3/4" />
                <div class="h-2.5 bg-white/5 rounded w-1/3" />
                <div class="h-2.5 bg-white/5 rounded w-full" />
              </div>
            </div>
          </div>

          <!-- No results -->
          <div v-else-if="!loading && searched && !results.length" class="flex flex-col items-center justify-center py-16 gap-3">
            <SearchX class="w-8 h-8 text-gray-600" />
            <p class="text-sm text-gray-500">Sin resultados{{ query.trim() ? ` para "${query}"` : '' }}</p>
          </div>

          <!-- Results -->
          <div v-else-if="results.length" class="p-4 space-y-2">
            <div
              v-for="item in results"
              :key="`${item.id}-${item.media_type}`"
              class="flex gap-4 p-3 rounded-xl border transition-colors"
              :class="inCollection(item) ? 'bg-white/3 border-white/5' : 'bg-white/4 border-white/6 hover:bg-white/7 hover:border-white/10'"
            >
              <!-- Poster — larger -->
              <div class="w-16 shrink-0 rounded-lg overflow-hidden border border-white/8" style="aspect-ratio:2/3">
                <img
                  v-if="tmdbPoster(item.poster_path)"
                  :src="tmdbPoster(item.poster_path)"
                  :alt="tmdbDisplayTitle(item)"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-xl">
                  {{ (item.media_type === 'tv' || activeType === 'tv') ? '📺' : '🎬' }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 py-0.5">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    :class="(item.media_type === 'tv' || activeType === 'tv') ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400'">
                    {{ (item.media_type === 'tv' || activeType === 'tv') ? 'Serie' : 'Película' }}
                  </span>
                  <span v-if="item.vote_average > 0" class="flex items-center gap-0.5 text-[11px] text-amber-400">
                    <Star class="w-2.5 h-2.5 fill-amber-400" /> {{ item.vote_average.toFixed(1) }}
                  </span>
                  <span v-if="tmdbYear(item)" class="text-[11px] text-gray-500">{{ tmdbYear(item) }}</span>
                </div>
                <p class="text-sm font-semibold text-white leading-snug mb-1">{{ tmdbDisplayTitle(item) }}</p>
                <p v-if="item.overview" class="text-xs text-gray-500 leading-relaxed line-clamp-3">{{ item.overview }}</p>
              </div>

              <!-- Action -->
              <div class="shrink-0 flex items-center">
                <span v-if="inCollection(item)" class="text-[11px] text-gray-500 font-medium px-2">En colección</span>
                <span v-else-if="added.has(item.id)" class="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400">
                  <Check class="w-3 h-3" /> Añadido
                </span>
                <button
                  v-else
                  @click="addItem(item)"
                  :disabled="adding.has(item.id)"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-150"
                  :class="adding.has(item.id)
                    ? 'border-white/10 text-gray-600 cursor-not-allowed'
                    : 'border-violet-500/35 text-violet-300 hover:bg-violet-500/15 hover:border-violet-400/50'"
                >
                  <Loader2 v-if="adding.has(item.id)" class="w-3 h-3 animate-spin" />
                  <Plus v-else class="w-3.5 h-3.5" />
                  Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { X, Search, SearchX, Star, Plus, Check, Loader2, SlidersHorizontal, ChevronDown, Compass } from 'lucide-vue-next'
import { fetchSearch, fetchDiscover, tmdbPoster, tmdbYear, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const media   = useMediaStore()
const ui      = useUiStore()

// State
const inputRef    = ref<HTMLInputElement>()
const query       = ref('')
const results     = ref<TmdbRecommendation[]>([])
const loading     = ref(false)
const searched    = ref(false)
const adding      = ref(new Set<number>())
const added       = ref(new Set<number>())
const activeType  = ref<'all' | 'movie' | 'tv'>('all')
const showFilters = ref(false)

// Filters
const filterGenre     = ref<number | null>(null)
const filterYearFrom  = ref<number | null>(null)
const filterYearTo    = ref<number | null>(null)
const filterMinRating = ref<number | null>(null)
const currentYear     = new Date().getFullYear()

const GENRES = [
  { id: 28,    label: 'Acción' },
  { id: 10759, label: 'Acción y aventura' },
  { id: 12,    label: 'Aventura' },
  { id: 16,    label: 'Animación' },
  { id: 35,    label: 'Comedia' },
  { id: 80,    label: 'Crimen' },
  { id: 99,    label: 'Documental' },
  { id: 18,    label: 'Drama' },
  { id: 10751, label: 'Familia' },
  { id: 14,    label: 'Fantasía' },
  { id: 36,    label: 'Historia' },
  { id: 27,    label: 'Terror' },
  { id: 9648,  label: 'Misterio' },
  { id: 10749, label: 'Romance' },
  { id: 878,   label: 'Ciencia ficción' },
  { id: 10765, label: 'Sci-Fi y fantasía' },
  { id: 53,    label: 'Thriller' },
  { id: 10752, label: 'Bélica' },
  { id: 37,    label: 'Western' },
]

const ratingOptions = [
  { value: 6,   label: '6+' },
  { value: 7,   label: '7+' },
  { value: 7.5, label: '7.5+' },
  { value: 8,   label: '8+' },
]

const tabs = [
  { value: 'all'   as const, emoji: '🔍', label: 'Todos' },
  { value: 'movie' as const, emoji: '🎬', label: 'Películas' },
  { value: 'tv'    as const, emoji: '📺', label: 'Series' },
]

const activeFiltersCount = computed(() =>
  [filterGenre.value, filterYearFrom.value, filterYearTo.value, filterMinRating.value]
    .filter(v => v !== null).length
)

// Auto-search on query change (debounced)
let debounceTimer: ReturnType<typeof setTimeout>
watch(query, (q) => {
  clearTimeout(debounceTimer)
  results.value = []
  searched.value = false
  if (q.trim().length < 2 && !activeFiltersCount.value) return
  if (q.trim().length > 0 && q.trim().length < 2) return
  debounceTimer = setTimeout(() => runSearch(), 400)
})

// Re-search when type or filters change
watch([activeType, filterGenre, filterYearFrom, filterYearTo, filterMinRating], () => {
  clearTimeout(debounceTimer)
  const hasQuery = query.value.trim().length >= 2
  if (hasQuery || activeFiltersCount.value) {
    debounceTimer = setTimeout(() => runSearch(), 300)
  }
})

watch(() => props.modelValue, async (v) => {
  if (!v) { query.value = ''; results.value = []; searched.value = false; return }
  adding.value = new Set(); added.value = new Set()
  await nextTick()
  inputRef.value?.focus()
})

async function runSearch() {
  const hasQuery   = query.value.trim().length >= 2
  const hasFilters = activeFiltersCount.value > 0
  if (!hasQuery && !hasFilters) return

  loading.value  = true
  searched.value = false
  try {
    if (hasQuery) {
      // Text search + client-side genre/year/rating filter
      const type = activeType.value === 'all' ? undefined : activeType.value
      let res = await fetchSearch(query.value, type)

      if (filterGenre.value !== null)
        res = res.filter(r => r.genre_ids.includes(filterGenre.value!))
      if (filterYearFrom.value !== null || filterYearTo.value !== null)
        res = res.filter(r => {
          const y = tmdbYear(r)
          if (!y) return false
          if (filterYearFrom.value && y < filterYearFrom.value) return false
          if (filterYearTo.value   && y > filterYearTo.value)   return false
          return true
        })
      if (filterMinRating.value !== null)
        res = res.filter(r => r.vote_average >= filterMinRating.value!)

      results.value = res
    } else {
      // Discover mode — filter-only, no text
      const discoverType = activeType.value === 'all' ? 'movie' : activeType.value
      results.value = await fetchDiscover(discoverType, {
        genreId:   filterGenre.value     ?? undefined,
        yearFrom:  filterYearFrom.value  ?? undefined,
        yearTo:    filterYearTo.value    ?? undefined,
        minRating: filterMinRating.value ?? undefined,
      })
    }
  } catch {
    results.value = []
  } finally {
    loading.value  = false
    searched.value = true
  }
}

function clearFilters() {
  filterGenre.value     = null
  filterYearFrom.value  = null
  filterYearTo.value    = null
  filterMinRating.value = null
}

function inCollection(item: TmdbRecommendation): boolean {
  return media.all.some(m => m.title?.toLowerCase() === tmdbDisplayTitle(item).toLowerCase())
}

async function addItem(item: TmdbRecommendation) {
  adding.value = new Set([...adding.value, item.id])
  const isTV = item.media_type === 'tv' || activeType.value === 'tv'
  const genreLabel = filterGenre.value
    ? (GENRES.find(g => g.id === filterGenre.value)?.label ?? null)
    : null
  try {
    await media.create({
      title:           tmdbDisplayTitle(item),
      type:            isTV ? 'series' : 'movie',
      status:          'pending',
      cover_url:       tmdbPoster(item.poster_path, 'w500') || null,
      year:            tmdbYear(item),
      description:     item.overview || null,
      genre:           genreLabel,
      platform:        null,
      rating:          null,
      review:          null,
      trailer_url:     null,
      remind_at:       null,
      private_note:    null,
      current_season:  null,
      current_episode: null,
      total_seasons:   null,
      total_episodes:  null,
      progress_notes:  null,
    })
    added.value = new Set([...added.value, item.id])
    ui.toast(`"${tmdbDisplayTitle(item)}" añadido a pendientes`)
  } catch {
    ui.toast('Error al añadir', 'error')
  } finally {
    adding.value = new Set([...adding.value].filter(i => i !== item.id))
  }
}

onUnmounted(() => clearTimeout(debounceTimer))

function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.filters-enter-active { transition: all .2s ease; }
.filters-leave-active { transition: all .15s ease; }
.filters-enter-from, .filters-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
