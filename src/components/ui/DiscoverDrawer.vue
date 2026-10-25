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
        <div class="drawer-header">
          <div class="drawer-title-group">
            <Compass class="w-4.5 h-4.5 text-violet-400 shrink-0" />
            <div class="min-w-0">
              <h2 class="drawer-title">Explorar</h2>
              <p class="drawer-subtitle">
                {{ mode === 'basic' ? 'Tendencias de la semana' : 'Exploración avanzada por filtros' }}
              </p>
            </div>
          </div>
          <button @click="close" class="drawer-close">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="px-4 pt-3 pb-2 shrink-0 border-b border-white/6 space-y-2.5">
          <div class="flex gap-1">
            <button
              v-for="tab in tabs" :key="tab.value"
              @click="changeTab(tab.value)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition-all duration-150"
              :class="activeTab === tab.value
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
            >
              {{ tab.emoji }} {{ tab.label }}
            </button>
          </div>

          <div class="flex justify-end">
            <button
              @click="toggleMode"
              class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors"
              :class="mode === 'advanced'
                ? 'border-violet-500/40 bg-violet-500/20 text-violet-200'
                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/8'"
            >
              <Sliders class="w-3.5 h-3.5" />
              {{ mode === 'advanced' ? 'Modo avanzado' : 'Modo básico' }}
            </button>
          </div>
        </div>

        <div v-if="mode === 'advanced'" class="px-4 py-3 border-b border-white/6 shrink-0 space-y-3 bg-white/2">
          <div>
            <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Géneros</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="g in availableGenres"
                :key="g.id"
                @click="toggleGenre(g.id)"
                class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
                :class="selectedGenres.has(g.id)
                  ? 'bg-violet-500/25 border-violet-500/45 text-violet-200'
                  : 'bg-white/4 border-white/10 text-gray-400 hover:bg-white/8'"
              >
                {{ g.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Año desde</label>
              <input
                v-model.number="yearFrom"
                type="number"
                min="1888"
                :max="currentYear"
                class="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Año hasta</label>
              <input
                v-model.number="yearTo"
                type="number"
                min="1888"
                :max="currentYear + 2"
                class="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                :placeholder="String(currentYear)"
              />
            </div>
          </div>

          <div>
            <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Valoración TMDB mínima</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="r in [0, 5, 6, 7, 7.5, 8]"
                :key="r"
                @click="minRating = r"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                :class="minRating === r
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                  : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
              >
                {{ r === 0 ? 'Todos' : `${r}+` }}
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'movie'" class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Duración mín</label>
              <input
                v-model.number="runtimeMin"
                type="number"
                min="0"
                max="300"
                class="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Duración máx</label>
              <input
                v-model.number="runtimeMax"
                type="number"
                min="0"
                max="300"
                class="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div v-if="activeTab === 'movie'">
            <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Actor</label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                v-model="actorSearch"
                type="text"
                placeholder="Buscar actor..."
                @input="searchActorsByName(actorSearch)"
                class="w-full bg-gray-800 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
              <div v-if="actorSearchOpen && actorSuggestions.length" class="absolute top-full left-0 right-0 mt-1 rounded-lg border border-white/10 bg-gray-800 max-h-32 overflow-y-auto z-10">
                <button
                  v-for="actor in actorSuggestions"
                  :key="actor.id"
                  @click="selectActor(actor)"
                  class="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors"
                >
                  {{ actor.name }}
                </button>
              </div>
            </div>
            <div v-if="selectedActors.length" class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="actor in selectedActors"
                :key="actor.id"
                class="inline-flex items-center gap-1 rounded-full border border-blue-500/50 bg-blue-500/20 px-2 py-1 text-[11px] text-blue-200"
              >
                {{ actor.name }}
                <button @click="removeActor(actor.id)" class="text-blue-200/80 hover:text-blue-100">×</button>
              </span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button @click="resetAdvancedFilters" class="text-xs text-gray-400 hover:text-gray-200">Limpiar</button>
            <button
              @click="loadAdvanced"
              :disabled="loading"
              class="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-60"
            >
              <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
              Aplicar filtros
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="p-4 space-y-3">
            <div v-for="i in 6" :key="i" class="flex gap-3 animate-pulse">
              <div class="w-12 h-16 rounded-lg bg-white/8 shrink-0" />
              <div class="flex-1 space-y-2 py-1">
                <div class="h-3 bg-white/8 rounded w-3/4" />
                <div class="h-2.5 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          </div>

          <div v-else-if="error" class="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle class="w-8 h-8 text-red-400" />
            <p class="text-sm text-gray-400">No se pudo cargar el contenido</p>
            <button @click="loadByMode" class="text-sm text-violet-400 hover:text-violet-300">Reintentar</button>
          </div>

          <div v-else-if="!results.length" class="flex flex-col items-center justify-center py-16 gap-3">
            <Compass class="w-8 h-8 text-gray-600" />
            <p class="text-sm text-gray-400">
              {{ mode === 'advanced' ? 'Sin resultados con esos filtros' : 'No hay recomendaciones disponibles' }}
            </p>
          </div>

          <div v-else class="p-4 grid grid-cols-3 gap-3">
            <div
              v-for="item in results"
              :key="item.id"
              class="group relative flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/3 transition-colors"
              :class="isInCollection(item) ? 'opacity-50' : 'hover:border-white/15'"
            >
              <div class="relative aspect-[2/3] overflow-hidden bg-gray-800 shrink-0">
                <img
                  v-if="tmdbPoster(item.poster_path)"
                  :src="tmdbPoster(item.poster_path)"
                  :alt="tmdbDisplayTitle(item)"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-3xl">
                  {{ activeTab === 'movie' ? '🎬' : '📺' }}
                </div>

                <div v-if="item.vote_average" class="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] text-amber-400 font-bold">
                  <Star class="w-2.5 h-2.5 fill-amber-400" />{{ item.vote_average.toFixed(1) }}
                </div>

                <div v-if="isInCollection(item)" class="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span class="text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-lg">En colección</span>
                </div>

                <div v-else class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span v-if="added.has(item.id)" class="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                    <Check class="w-3.5 h-3.5" /> Añadido
                  </span>
                  <button
                    v-else
                    @click="addItem(item)"
                    :disabled="adding.has(item.id)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold transition-colors shadow-lg"
                  >
                    <Loader2 v-if="adding.has(item.id)" class="w-3 h-3 animate-spin" />
                    <Plus v-else class="w-3 h-3" />
                    Añadir
                  </button>
                </div>
              </div>

              <div class="p-2 flex-1">
                <p class="text-[11px] font-semibold text-white leading-snug line-clamp-2">{{ tmdbDisplayTitle(item) }}</p>
                <p v-if="tmdbYear(item)" class="text-[10px] text-gray-500 mt-0.5">{{ tmdbYear(item) }}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X, Compass, Star, Plus, Check, Loader2, AlertCircle, Sliders, Search } from 'lucide-vue-next'
import { fetchDiscover, fetchTrending, searchActors, tmdbPoster, tmdbYear, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const media   = useMediaStore()
const ui      = useUiStore()
const loading = ref(false)
const error   = ref(false)
const results = ref<TmdbRecommendation[]>([])
const adding  = ref(new Set<number>())
const added   = ref(new Set<number>())
const mode    = ref<'basic' | 'advanced'>('basic')
const activeTab = ref<'movie' | 'tv'>('movie')
const currentYear = new Date().getFullYear()

const selectedGenres = ref(new Set<number>())
const yearFrom = ref<number | null>(null)
const yearTo = ref<number | null>(null)
const minRating = ref(0)
const runtimeMin = ref<number | null>(null)
const runtimeMax = ref<number | null>(null)
const actorSearch = ref('')
const actorSearchOpen = ref(false)
const actorSuggestions = ref<Array<{ id: number; name: string }>>([])
const selectedActors = ref<Array<{ id: number; name: string }>>([])

const tabs = [
  { value: 'movie' as const, label: 'Películas', emoji: '🎬' },
  { value: 'tv'    as const, label: 'Series',    emoji: '📺' },
]

const movieGenres = [
  { id: 28, label: 'Acción' },
  { id: 12, label: 'Aventura' },
  { id: 16, label: 'Animación' },
  { id: 35, label: 'Comedia' },
  { id: 80, label: 'Crimen' },
  { id: 99, label: 'Documental' },
  { id: 18, label: 'Drama' },
  { id: 14, label: 'Fantasía' },
  { id: 27, label: 'Terror' },
  { id: 9648, label: 'Misterio' },
  { id: 10749, label: 'Romance' },
  { id: 878, label: 'Ciencia ficción' },
]

const tvGenres = [
  { id: 10759, label: 'Acción & aventura' },
  { id: 16, label: 'Animación' },
  { id: 35, label: 'Comedia' },
  { id: 80, label: 'Crimen' },
  { id: 99, label: 'Documental' },
  { id: 18, label: 'Drama' },
  { id: 14, label: 'Fantasía' },
  { id: 9648, label: 'Misterio' },
  { id: 10765, label: 'Sci-Fi y fantasía' },
]

const availableGenres = computed(() => activeTab.value === 'movie' ? movieGenres : tvGenres)

watch(() => props.modelValue, (v) => {
  if (!v) return
  mode.value = 'basic'
  resetAdvancedFilters()
  adding.value = new Set()
  added.value = new Set()
  void loadByMode()
})

async function loadByMode() {
  if (mode.value === 'advanced') return loadAdvanced()
  return loadTrending()
}

async function loadTrending() {
  results.value = []
  error.value = false
  loading.value = true
  try {
    results.value = await fetchTrending(activeTab.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadAdvanced() {
  if (loading.value) return
  loading.value = true
  error.value = false
  try {
    results.value = await fetchDiscover(activeTab.value, {
      genreIds: selectedGenres.value.size > 0 ? [...selectedGenres.value] : undefined,
      yearFrom: yearFrom.value ?? undefined,
      yearTo: yearTo.value ?? undefined,
      minRating: minRating.value > 0 ? minRating.value : undefined,
      runtimeMin: activeTab.value === 'movie' ? runtimeMin.value ?? undefined : undefined,
      runtimeMax: activeTab.value === 'movie' ? runtimeMax.value ?? undefined : undefined,
      castIds: activeTab.value === 'movie' && selectedActors.value.length > 0 ? selectedActors.value.map(actor => actor.id) : undefined,
    })
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  mode.value = mode.value === 'basic' ? 'advanced' : 'basic'
  void loadByMode()
}

function changeTab(tab: 'movie' | 'tv') {
  activeTab.value = tab
  if (tab === 'tv') {
    runtimeMin.value = null
    runtimeMax.value = null
    actorSearch.value = ''
    actorSearchOpen.value = false
    actorSuggestions.value = []
    selectedActors.value = []
  }
  void loadByMode()
}

function toggleGenre(id: number) {
  if (selectedGenres.value.has(id)) selectedGenres.value.delete(id)
  else selectedGenres.value.add(id)
}

function resetAdvancedFilters() {
  selectedGenres.value.clear()
  yearFrom.value = null
  yearTo.value = null
  minRating.value = 0
  runtimeMin.value = null
  runtimeMax.value = null
  actorSearch.value = ''
  actorSearchOpen.value = false
  actorSuggestions.value = []
  selectedActors.value = []
}

async function searchActorsByName(query: string) {
  if (!query.trim()) {
    actorSuggestions.value = []
    actorSearchOpen.value = false
    return
  }
  try {
    actorSuggestions.value = await searchActors(query)
    actorSearchOpen.value = actorSuggestions.value.length > 0
  } catch {
    actorSuggestions.value = []
    actorSearchOpen.value = false
  }
}

function selectActor(actor: { id: number; name: string }) {
  if (!selectedActors.value.find(current => current.id === actor.id)) {
    selectedActors.value.push(actor)
  }
  actorSearch.value = ''
  actorSuggestions.value = []
  actorSearchOpen.value = false
}

function removeActor(id: number) {
  selectedActors.value = selectedActors.value.filter(actor => actor.id !== id)
}

function isInCollection(item: TmdbRecommendation): boolean {
  const title = tmdbDisplayTitle(item).toLowerCase()
  return media.all.some(m => m.title?.toLowerCase() === title)
}

async function addItem(item: TmdbRecommendation) {
  adding.value = new Set([...adding.value, item.id])
  const type = activeTab.value === 'movie' ? 'movie' : 'series'
  try {
    await media.create({
      title:           tmdbDisplayTitle(item),
      type,
      status:          'pending',
      cover_url:       tmdbPoster(item.poster_path, 'w500') || null,
      year:            tmdbYear(item),
      description:     item.overview || null,
      genre:           null,
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

function close() { emit('update:modelValue', false) }
</script>
