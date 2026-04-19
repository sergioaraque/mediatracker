<template>
  <div class="min-h-screen bg-gray-950 text-white flex flex-col">

    <!-- Header -->
    <header class="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-2xl border-b border-white/6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-4 h-16">
          <button
            @click="router.push('/app')"
            class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 -ml-2 rounded-xl hover:bg-white/5"
          >
            <ArrowLeft class="w-5 h-5" />
            <span class="text-sm font-medium hidden sm:block">Volver</span>
          </button>

          <div class="h-5 w-px bg-white/10 hidden sm:block" />

          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <CalendarDays class="w-3.5 h-3.5 text-white" />
            </div>
            <h1 class="text-base font-bold text-white">Próximos Estrenos</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Tabs -->
    <div class="sticky top-16 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex gap-1 py-2.5">
          <button
            v-for="tab in tabs" :key="tab.value"
            @click="activeTab = tab.value"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150"
            :class="activeTab === tab.value
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
          >
            {{ tab.emoji }} {{ tab.label }}
            <span
              v-if="!loading && results.length"
              class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              :class="activeTab === tab.value ? 'bg-rose-500/25 text-rose-300' : 'bg-white/8 text-gray-500'"
            >{{ results.length }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main -->
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="n in 10" :key="n"
          class="rounded-2xl bg-white/5 animate-skeleton"
          style="aspect-ratio: 2/3"
        />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle class="w-10 h-10 text-red-400" />
        <p class="text-gray-400">No se pudo cargar el contenido</p>
        <button @click="load" class="btn-secondary text-sm px-4 py-2">Reintentar</button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="item in results"
          :key="item.id"
          class="group relative rounded-2xl overflow-hidden border border-white/8 bg-gray-900 flex flex-col"
          style="aspect-ratio: 2/3"
        >
          <!-- Poster -->
          <div class="flex-1 relative overflow-hidden bg-gray-800">
            <img
              v-if="tmdbPoster(item.poster_path, 'w300')"
              :src="tmdbPoster(item.poster_path, 'w300')"
              :alt="tmdbDisplayTitle(item)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-4xl">
              {{ activeTab === 'movie' ? '🎬' : '📺' }}
            </div>

            <!-- TMDB rating badge -->
            <div v-if="item.vote_average > 0" class="absolute top-2 left-2 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
              <Star class="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span class="text-[11px] font-bold text-amber-300">{{ item.vote_average.toFixed(1) }}</span>
            </div>

            <!-- In collection badge -->
            <div v-if="inCollection(item)" class="absolute top-2 right-2">
              <span class="flex items-center gap-0.5 bg-emerald-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <Check class="w-2.5 h-2.5" /> En colección
              </span>
            </div>

            <!-- Release date ribbon -->
            <div v-if="releaseDate(item)" class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pt-6 pb-2">
              <p class="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                <CalendarDays class="w-3 h-3" /> {{ releaseDate(item) }}
              </p>
            </div>
          </div>

          <!-- Card footer -->
          <div class="p-2.5">
            <p class="text-xs font-semibold text-white truncate leading-snug">{{ tmdbDisplayTitle(item) }}</p>
            <div class="flex items-center justify-between mt-1.5 gap-1">
              <span class="text-[11px] text-gray-500">{{ tmdbYear(item) ?? '—' }}</span>

              <span v-if="added.has(item.id)" class="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                <Check class="w-3 h-3" /> Añadido
              </span>
              <button
                v-else-if="!inCollection(item)"
                @click="addItem(item)"
                :disabled="adding.has(item.id)"
                class="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all duration-150 shrink-0"
                :class="adding.has(item.id)
                  ? 'border-white/10 text-gray-600 cursor-not-allowed'
                  : 'border-violet-500/35 text-violet-300 hover:bg-violet-500/15'"
              >
                <Loader2 v-if="adding.has(item.id)" class="w-2.5 h-2.5 animate-spin" />
                <Plus v-else class="w-2.5 h-2.5" />
                {{ adding.has(item.id) ? '…' : 'Añadir' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CalendarDays, Star, Plus, Check, Loader2, AlertCircle } from 'lucide-vue-next'
import { fetchUpcoming, fetchOnTheAir, tmdbPoster, tmdbYear, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'

const router = useRouter()
const media  = useMediaStore()
const ui     = useUiStore()

const activeTab = ref<'movie' | 'tv'>('movie')
const loading   = ref(false)
const error     = ref(false)
const results   = ref<TmdbRecommendation[]>([])
const adding    = ref(new Set<number>())
const added     = ref(new Set<number>())

const tabs = [
  { value: 'movie' as const, emoji: '🎬', label: 'Películas' },
  { value: 'tv'    as const, emoji: '📺', label: 'Series' },
]

watch(activeTab, () => load())
onMounted(async () => {
  if (!media.all.length) {
    try {
      await media.fetch()
    } catch {
      ui.toast('No se pudo cargar tu colección', 'error')
    }
  }
  load()
})

async function load() {
  results.value = []
  error.value   = false
  loading.value = true
  adding.value  = new Set()
  added.value   = new Set()
  try {
    results.value = activeTab.value === 'movie'
      ? await fetchUpcoming()
      : await fetchOnTheAir()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function inCollection(item: TmdbRecommendation): boolean {
  const title = tmdbDisplayTitle(item).toLowerCase()
  return media.all.some(m => m.title?.toLowerCase() === title)
}

function releaseDate(item: TmdbRecommendation): string | null {
  const raw = item.release_date ?? item.first_air_date ?? ''
  if (!raw) return null
  return new Date(raw).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function addItem(item: TmdbRecommendation) {
  adding.value = new Set([...adding.value, item.id])
  try {
    await media.create({
      title:           tmdbDisplayTitle(item),
      type:            activeTab.value === 'movie' ? 'movie' : 'series',
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
</script>
