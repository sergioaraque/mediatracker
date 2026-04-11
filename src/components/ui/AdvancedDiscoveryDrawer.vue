<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="close" />
    </Transition>

    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-900 border-l border-white/10 z-50 flex flex-col"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
          <button @click="close" class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors">
            <X class="w-4 h-4" />
          </button>
          <div class="flex-1">
            <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Búsqueda experta</p>
          </div>
          <Sliders class="w-4 h-4 text-violet-400 shrink-0" />
        </div>

        <!-- Type selector + filters -->
        <div class="px-5 py-4 border-b border-white/8 shrink-0 overflow-y-auto max-h-[calc(100vh-180px)] space-y-4">
          <!-- Type tabs -->
          <div class="flex gap-2">
            <button
              v-for="t in ['movie', 'tv']"
              :key="t"
              @click="activeType = t as any; resetFilters()"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-all"
              :class="activeType === t
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
            >
              {{ t === 'movie' ? '🎬 Películas' : '📺 Series' }}
            </button>
          </div>

          <!-- Genres — Multi-select visual -->
          <div>
            <label class="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2.5">Géneros</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="g in availableGenres"
                :key="g.id"
                @click="toggleGenre(g.id)"
                class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                :class="selectedGenres.has(g.id)
                  ? 'bg-violet-500/30 border-violet-500/60 text-violet-200'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/8'"
              >
                {{ g.label }}
              </button>
            </div>
          </div>

          <!-- Year filter -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">Desde</label>
              <input
                v-model.number="yearFrom"
                type="number"
                min="1900"
                :max="currentYear"
                class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">Hasta</label>
              <input
                v-model.number="yearTo"
                type="number"
                min="1900"
                :max="currentYear"
                class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                :placeholder="currentYear.toString()"
              />
            </div>
          </div>

          <!-- Rating filter -->
          <div>
            <label class="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">Rating TMDB mínimo</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="r in [0, 5, 6, 7, 7.5, 8]"
                :key="r"
                @click="minRating = r"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                :class="minRating === r
                  ? 'bg-amber-500/30 border-amber-500/60 text-amber-200'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/8'"
              >
                {{ r === 0 ? 'Todos' : r + '+' }}
              </button>
            </div>
          </div>

          <!-- Runtime filter (movies only) -->
          <div v-if="activeType === 'movie'">
            <label class="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2.5">Duración (minutos)</label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-[10px] text-gray-500 mb-1">Mínimo</p>
                <input
                  v-model.number="runtimeMin"
                  type="number"
                  min="0"
                  max="300"
                  class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                  placeholder="0"
                />
              </div>
              <div>
                <p class="text-[10px] text-gray-500 mb-1">Máximo</p>
                <input
                  v-model.number="runtimeMax"
                  type="number"
                  min="0"
                  max="300"
                  class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
                  placeholder="300"
                />
              </div>
            </div>
          </div>

          <!-- Cast search (movies only) -->
          <div v-if="activeType === 'movie'">
            <label class="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">Buscar por actor</label>
            <div class="relative">
              <input
                v-model="actorSearch"
                type="text"
                placeholder="Nombre del actor..."
                @input="searchActors_"
                class="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
              />
              <!-- Autocomplete suggestions -->
              <div v-if="actorSearchOpen && actorSuggestions.length" class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg overflow-hidden z-10 max-h-32 overflow-y-auto">
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

            <!-- Selected actors chips -->
            <div v-if="selectedActors.length" class="flex flex-wrap gap-2 mt-2">
              <div
                v-for="actor in selectedActors"
                :key="actor.id"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/30 border border-blue-500/60 text-xs text-blue-200"
              >
                {{ actor.name }}
                <button
                  @click="removeActor(actor.id)"
                  class="text-blue-300 hover:text-blue-100 transition-colors"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <button
            @click="search"
            :disabled="loading"
            class="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold transition-all duration-150"
            :class="loading ? 'opacity-50 cursor-not-allowed' : 'hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-900/30'"
          >
            {{ loading ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">

          <!-- Loading -->
          <div v-if="loading" class="p-4 space-y-3">
            <div v-for="i in 6" :key="i" class="flex gap-3 animate-pulse">
              <div class="w-12 h-16 rounded-lg bg-white/8 shrink-0" />
              <div class="flex-1 space-y-2 py-1">
                <div class="h-3 bg-white/8 rounded w-3/4" />
                <div class="h-2.5 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle class="w-8 h-8 text-red-400" />
            <p class="text-sm text-gray-400">No se pudo cargar el contenido</p>
            <button @click="search" class="text-sm text-violet-400 hover:text-violet-300">Reintentar</button>
          </div>

          <!-- No results -->
          <div v-else-if="results.length === 0 && !loading" class="flex flex-col items-center justify-center py-16 gap-3">
            <Sliders class="w-8 h-8 text-gray-600" />
            <p class="text-sm text-gray-400">Sin resultados con esos filtros</p>
          </div>

          <!-- Results -->
          <div v-else class="p-4 space-y-3">
            <div
              v-for="item in results"
              :key="item.id"
              class="flex gap-3 p-3 rounded-xl bg-white/4 border border-white/5 group hover:border-white/10 transition-colors"
              :class="added.has(item.id) ? 'opacity-50' : ''"
            >
              <!-- Poster -->
              <div class="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-800 border border-white/8">
                <img
                  v-if="tmdbPoster(item.poster_path, 'w92')"
                  :src="tmdbPoster(item.poster_path, 'w92')"
                  :alt="tmdbDisplayTitle(item)"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-lg">
                  {{ activeType === 'movie' ? '🎬' : '📺' }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p class="text-sm font-semibold text-white truncate">{{ tmdbDisplayTitle(item) }}</p>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span class="text-[10px] text-gray-500">{{ releaseYear(item) }}</span>
                    <span class="flex items-center gap-0.5 text-[10px] text-amber-400">
                      <Star class="w-2.5 h-2.5 fill-amber-400" />
                      {{ item.vote_average.toFixed(1) }}
                    </span>
                  </div>
                </div>
                <p v-if="item.overview" class="text-[11px] text-gray-500 line-clamp-2">{{ item.overview }}</p>
              </div>

              <!-- Add button -->
              <div class="shrink-0 flex items-start pt-0.5">
                <button
                  v-if="!added.has(item.id)"
                  @click="addItem(item)"
                  :disabled="adding.has(item.id)"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150"
                  :class="adding.has(item.id)
                    ? 'border-white/10 text-gray-600 cursor-not-allowed'
                    : 'border-violet-500/35 text-violet-300 hover:bg-violet-500/15 hover:border-violet-400/50'"
                >
                  <Plus class="w-3 h-3" /> Añadir
                </button>
                <div v-else class="text-xs text-emerald-400 font-bold">✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, AlertCircle, Star, Plus, Sliders } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import { fetchDiscover, tmdbPoster, tmdbYear, tmdbDisplayTitle, searchActors, type TmdbRecommendation } from '@/lib/tmdb'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const media = useMediaStore()
const ui    = useUiStore()

const activeType          = ref<'movie' | 'tv'>('movie')
const selectedGenres      = ref(new Set<number>())
const yearFrom            = ref<number | null>(null)
const yearTo              = ref<number | null>(null)
const minRating           = ref(0)
const runtimeMin          = ref<number | null>(null)
const runtimeMax          = ref<number | null>(null)
const actorSearch         = ref('')
const actorSearchOpen     = ref(false)
const actorSuggestions    = ref<Array<{ id: number; name: string }>>([])
const loading        = ref(false)
const error          = ref(false)
const results        = ref<TmdbRecommendation[]>([])
const adding         = ref(new Set<number>())
const added          = ref(new Set<number>())
const currentYear    = new Date().getFullYear()

const movieGenres = [
  { id: 28,    label: 'Acción' },
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
  { id: 53,    label: 'Thriller' },
  { id: 10752, label: 'Bélica' },
  { id: 37,    label: 'Western' },
]

const tvGenres = [
  { id: 10759, label: 'Acción & Aventura' },
  { id: 16,    label: 'Animación' },
  { id: 35,    label: 'Comedia' },
  { id: 80,    label: 'Crimen' },
  { id: 99,    label: 'Documental' },
  { id: 18,    label: 'Drama' },
  { id: 10751, label: 'Familia' },
  { id: 14,    label: 'Fantasía' },
  { id: 36,    label: 'Historia' },
  { id: 9648,  label: 'Misterio' },
  { id: 10763, label: 'Noticias' },
  { id: 10765, label: 'Sci-Fi y fantasía' },
  { id: 10768, label: 'Serie de guerra y política' },
]

const availableGenres = computed(() =>
  activeType.value === 'movie' ? movieGenres : tvGenres
)

function close() {
  emit('update:modelValue', false)
}

function toggleGenre(id: number) {
  if (selectedGenres.value.has(id)) {
    selectedGenres.value.delete(id)
  } else {
    selectedGenres.value.add(id)
  }
}

function resetFilters() {
  selectedGenres.value.clear()
  yearFrom.value = null
  yearTo.value = null
  minRating.value = 0
  runtimeMin.value = null
  runtimeMax.value = null
  actorSearch.value = ''
  selectedActors.value = []
  results.value = []
}

async function search() {
  if (loading.value) return
  loading.value = true
  error.value = false
  try {
    results.value = await fetchDiscover(activeType.value, {
      genreIds:   selectedGenres.value.size > 0 ? [...selectedGenres.value] : undefined,
      yearFrom:   yearFrom.value ?? undefined,
      yearTo:     yearTo.value ?? undefined,
      minRating:  minRating.value > 0 ? minRating.value : undefined,
      runtimeMin: runtimeMin.value ?? undefined,
      runtimeMax: runtimeMax.value ?? undefined,
      castIds:    selectedActors.value.length > 0 ? selectedActors.value.map(a => a.id) : undefined,
    })
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function releaseYear(item: TmdbRecommendation): string {
  const date = item.release_date ?? item.first_air_date ?? ''
  if (!date) return 'Año desconocido'
  return new Date(date).getFullYear().toString()
}

async function searchActors_(query: string) {
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
  }
}

function selectActor(actor: { id: number; name: string }) {
  if (!selectedActors.value.find(a => a.id === actor.id)) {
    selectedActors.value.push(actor)
  }
  actorSearch.value = ''
  actorSuggestions.value = []
  actorSearchOpen.value = false
}

function removeActor(id: number) {
  selectedActors.value = selectedActors.value.filter(a => a.id !== id)
}

 

async function addItem(item: TmdbRecommendation) {
  adding.value = new Set([...adding.value, item.id])
  try {
    await media.create({
      title:           tmdbDisplayTitle(item),
      type:            activeType.value === 'movie' ? 'movie' : 'series',
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
    ui.toast(`✅ Añadido: ${tmdbDisplayTitle(item)}`)
  } catch {
    ui.toast('❌ Error al añadir', 'error')
  } finally {
    adding.value = new Set([...adding.value].filter(id => id !== item.id))
  }
}
</script>
