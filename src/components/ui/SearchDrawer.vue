<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="close" />
    </Transition>

    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-900 border-l border-white/10 z-50 flex flex-col"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
          <button @click="close" class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors shrink-0">
            <X class="w-4 h-4" />
          </button>

          <!-- Search input -->
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="w-full bg-white/6 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-colors"
              placeholder="Buscar películas y series…"
              @keydown.escape="close"
            />
            <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400 animate-spin" />
          </div>
        </div>

        <!-- Type tabs -->
        <div class="flex gap-1 px-4 pt-2.5 pb-2 shrink-0">
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
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">

          <!-- Empty / hint -->
          <div v-if="!query.trim()" class="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <div class="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Search class="w-6 h-6 text-violet-400" />
            </div>
            <p class="text-gray-400 text-sm">Escribe al menos 2 caracteres para buscar</p>
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
          <div v-else-if="!loading && query.trim().length >= 2 && !results.length" class="flex flex-col items-center justify-center py-16 gap-3">
            <SearchX class="w-8 h-8 text-gray-600" />
            <p class="text-sm text-gray-500">Sin resultados para "{{ query }}"</p>
          </div>

          <!-- Results -->
          <div v-else-if="results.length" class="p-4 space-y-2">
            <p class="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 pb-1">
              {{ results.length }} resultados
            </p>

            <div
              v-for="item in results"
              :key="`${item.id}-${item.media_type}`"
              class="flex gap-3 p-3 rounded-xl border transition-colors"
              :class="inCollection(item)
                ? 'bg-white/3 border-white/5'
                : 'bg-white/4 border-white/6 hover:bg-white/7 hover:border-white/10'"
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
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-lg">
                  {{ item.media_type === 'tv' || (activeType === 'tv') ? '📺' : '🎬' }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    :class="(item.media_type === 'tv' || activeType === 'tv') ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400'">
                    {{ (item.media_type === 'tv' || activeType === 'tv') ? 'Serie' : 'Película' }}
                  </span>
                  <span v-if="item.vote_average > 0" class="flex items-center gap-0.5 text-[11px] text-amber-400">
                    <Star class="w-2.5 h-2.5 fill-amber-400" /> {{ item.vote_average.toFixed(1) }}
                  </span>
                </div>
                <p class="text-sm font-semibold text-white leading-snug truncate">{{ tmdbDisplayTitle(item) }}</p>
                <p v-if="tmdbYear(item)" class="text-[11px] text-gray-500 mt-0.5">{{ tmdbYear(item) }}</p>
                <p v-if="item.overview" class="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mt-1">{{ item.overview }}</p>
              </div>

              <!-- Action -->
              <div class="shrink-0 flex items-start pt-0.5">
                <span v-if="inCollection(item)" class="text-[11px] text-gray-500 font-medium px-2 py-1.5">En colección</span>
                <span v-else-if="added.has(item.id)" class="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400">
                  <Check class="w-3 h-3" /> Añadido
                </span>
                <button
                  v-else
                  @click="addItem(item)"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X, Search, SearchX, Star, Plus, Check, Loader2 } from 'lucide-vue-next'
import { fetchSearch, tmdbPoster, tmdbYear, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const media   = useMediaStore()
const ui      = useUiStore()
const inputRef = ref<HTMLInputElement>()
const query    = ref('')
const results  = ref<TmdbRecommendation[]>([])
const loading  = ref(false)
const adding   = ref(new Set<number>())
const added    = ref(new Set<number>())
const activeType = ref<'all' | 'movie' | 'tv'>('all')

const tabs = [
  { value: 'all'   as const, emoji: '🔍', label: 'Todos' },
  { value: 'movie' as const, emoji: '🎬', label: 'Películas' },
  { value: 'tv'    as const, emoji: '📺', label: 'Series' },
]

let debounceTimer: ReturnType<typeof setTimeout>

watch(query, (q) => {
  clearTimeout(debounceTimer)
  if (q.trim().length < 2) { results.value = []; return }
  debounceTimer = setTimeout(() => runSearch(), 400)
})

watch(activeType, () => {
  if (query.value.trim().length >= 2) runSearch()
})

watch(() => props.modelValue, async (v) => {
  if (!v) { query.value = ''; results.value = []; return }
  adding.value = new Set(); added.value = new Set()
  await nextTick()
  inputRef.value?.focus()
})

async function runSearch() {
  loading.value = true
  try {
    const type = activeType.value === 'all' ? undefined : activeType.value
    results.value = await fetchSearch(query.value, type)
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function inCollection(item: TmdbRecommendation): boolean {
  const title = tmdbDisplayTitle(item).toLowerCase()
  return media.all.some(m => m.title?.toLowerCase() === title)
}

async function addItem(item: TmdbRecommendation) {
  adding.value = new Set([...adding.value, item.id])
  const isTV = item.media_type === 'tv' || activeType.value === 'tv'
  try {
    await media.create({
      title:           tmdbDisplayTitle(item),
      type:            isTV ? 'series' : 'movie',
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
