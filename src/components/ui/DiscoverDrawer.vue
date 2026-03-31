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
            <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Tendencias esta semana</p>
          </div>
          <Compass class="w-4 h-4 text-violet-400 shrink-0" />
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 px-4 pt-3 pb-2 shrink-0">
          <button
            v-for="tab in tabs" :key="tab.value"
            @click="activeTab = tab.value; load()"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition-all duration-150"
            :class="activeTab === tab.value
              ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
              : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
          >
            {{ tab.emoji }} {{ tab.label }}
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
            <button @click="load" class="text-sm text-violet-400 hover:text-violet-300">Reintentar</button>
          </div>

          <!-- Results — poster grid -->
          <div v-else class="p-4 grid grid-cols-3 gap-3">
            <div
              v-for="item in results"
              :key="item.id"
              class="group relative flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/3 transition-colors"
              :class="isInCollection(item) ? 'opacity-50' : 'hover:border-white/15'"
            >
              <!-- Poster -->
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

                <!-- Rating badge -->
                <div v-if="item.vote_average" class="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] text-amber-400 font-bold">
                  <Star class="w-2.5 h-2.5 fill-amber-400" />{{ item.vote_average.toFixed(1) }}
                </div>

                <!-- In collection badge -->
                <div v-if="isInCollection(item)" class="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span class="text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-lg">En colección</span>
                </div>

                <!-- Add overlay on hover -->
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

              <!-- Title + year -->
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
import { ref, watch } from 'vue'
import { X, Compass, Star, Film, Plus, Check, Loader2, AlertCircle } from 'lucide-vue-next'
import { fetchTrending, tmdbPoster, tmdbYear, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
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
const activeTab = ref<'movie' | 'tv'>('movie')

const tabs = [
  { value: 'movie' as const, label: 'Películas', emoji: '🎬' },
  { value: 'tv'    as const, label: 'Series',    emoji: '📺' },
]

watch(() => props.modelValue, (v) => {
  if (!v) return
  adding.value = new Set()
  added.value  = new Set()
  load()
})

async function load() {
  results.value = []
  error.value   = false
  loading.value = true
  try {
    results.value = await fetchTrending(activeTab.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
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
