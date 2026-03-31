<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 z-[55] bg-black/40" @click="close" />
    </Transition>

    <!-- Panel -->
    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 border-l border-white/10 z-[60] flex flex-col"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
          <button @click="close" class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors">
            <ArrowLeft class="w-4 h-4" />
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Recomendaciones</p>
            <p class="text-sm font-semibold text-white truncate">{{ media?.title }}</p>
          </div>
          <Sparkles class="w-4 h-4 text-violet-400 shrink-0" />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">

          <!-- Loading -->
          <div v-if="loading" class="p-5 space-y-3">
            <div v-for="i in 5" :key="i" class="flex gap-3 animate-pulse">
              <div class="w-12 h-16 rounded-lg bg-white/8 shrink-0" />
              <div class="flex-1 space-y-2 py-1">
                <div class="h-3 bg-white/8 rounded w-3/4" />
                <div class="h-2.5 bg-white/5 rounded w-1/2" />
                <div class="h-2.5 bg-white/5 rounded w-full" />
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
            <AlertCircle class="w-8 h-8 text-red-400" />
            <p class="text-sm text-gray-400">No se encontraron recomendaciones para este título.</p>
          </div>

          <!-- Results -->
          <div v-else class="p-4 space-y-2">
            <p class="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 pb-1">
              {{ results.length }} títulos similares
            </p>

            <div
              v-for="item in results"
              :key="item.id"
              class="flex gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:bg-white/7 hover:border-white/10 transition-colors"
            >
              <!-- Poster -->
              <div class="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/8">
                <img
                  v-if="tmdbPoster(item.poster_path)"
                  :src="tmdbPoster(item.poster_path)"
                  :alt="tmdbDisplayTitle(item)"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center" :class="gradientClass">
                  <component :is="typeIcon" class="w-4 h-4 text-white/25" />
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate leading-snug">{{ tmdbDisplayTitle(item) }}</p>
                <div class="flex items-center gap-2 mt-0.5 mb-1.5">
                  <span v-if="tmdbYear(item)" class="text-[11px] text-gray-500">{{ tmdbYear(item) }}</span>
                  <span v-if="item.vote_average" class="flex items-center gap-0.5 text-[11px] text-amber-400">
                    <Star class="w-2.5 h-2.5 fill-amber-400" /> {{ item.vote_average.toFixed(1) }}
                  </span>
                </div>
                <p v-if="item.overview" class="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{{ item.overview }}</p>
              </div>

              <!-- Add button -->
              <div class="shrink-0 flex items-start pt-0.5">
                <button
                  v-if="!added.has(item.id)"
                  @click="addToCollection(item)"
                  :disabled="adding.has(item.id)"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150"
                  :class="adding.has(item.id)
                    ? 'border-white/10 text-gray-600 cursor-not-allowed'
                    : 'border-violet-500/35 text-violet-300 hover:bg-violet-500/15 hover:border-violet-400/50'"
                >
                  <Loader2 v-if="adding.has(item.id)" class="w-3 h-3 animate-spin" />
                  <Plus v-else class="w-3 h-3" />
                  {{ adding.has(item.id) ? '…' : 'Añadir' }}
                </button>
                <span v-else class="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400">
                  <Check class="w-3 h-3" /> Añadido
                </span>
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
import { ArrowLeft, Sparkles, Star, Plus, Check, Loader2, AlertCircle, Film, Tv } from 'lucide-vue-next'
import { fetchRecommendations, tmdbPoster, tmdbYear, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import type { Media }    from '@/types'

const props = defineProps<{ modelValue: boolean; media: Media | null }>()
const emit  = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const store   = useMediaStore()
const ui      = useUiStore()
const loading = ref(false)
const error   = ref(false)
const results = ref<TmdbRecommendation[]>([])
const adding  = ref(new Set<number>())
const added   = ref(new Set<number>())

const typeIcon    = props.media?.type === 'series' ? Tv : Film
const gradientClass = props.media?.type === 'series'
  ? 'bg-gradient-to-br from-violet-900 to-violet-800'
  : 'bg-gradient-to-br from-blue-900 to-blue-800'

watch(() => props.modelValue, async (v) => {
  if (!v || !props.media) return
  results.value = []
  error.value   = false
  adding.value  = new Set()
  added.value   = new Set()
  loading.value = true
  try {
    results.value = await fetchRecommendations(props.media.title, props.media.type as 'movie' | 'series')
    if (!results.value.length) error.value = true
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

async function addToCollection(item: TmdbRecommendation) {
  if (!props.media) return
  adding.value = new Set([...adding.value, item.id])
  try {
    await store.create({
      title:       tmdbDisplayTitle(item),
      type:        props.media.type as 'movie' | 'series',
      status:      'pending',
      cover_url:   tmdbPoster(item.poster_path, 'w500') || null,
      year:        tmdbYear(item),
      description: item.overview || null,
      genre:       null,
      platform:    null,
      rating:      null,
      review:      null,
      trailer_url: null,
      remind_at:   null,
      current_season:   null,
      current_episode:  null,
    } as any)
    added.value = new Set([...added.value, item.id])
    ui.toast(`"${tmdbDisplayTitle(item)}" añadido a pendientes`)
  } catch {
    ui.toast('Error al añadir', 'error')
  } finally {
    adding.value = new Set([...adding.value].filter(i => i !== item.id))
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>
