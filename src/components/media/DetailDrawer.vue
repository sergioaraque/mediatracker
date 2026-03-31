<template>
  <Teleport to="body">

    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
        @click="close"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="modal-detail">
      <div
        v-if="modelValue && media"
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6"
        @click.self="close"
      >
        <div class="relative w-full md:max-w-5xl bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          style="max-height: 95dvh; md:max-height: 88vh"
        >

          <!-- ── LEFT: Cover panel ───────────────────────────── -->
          <div class="relative md:w-[38%] shrink-0 h-56 md:h-auto md:min-h-full">

            <!-- Image -->
            <img
              v-if="media.cover_url"
              :src="media.cover_url"
              :alt="media.title"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div v-else class="absolute inset-0" :class="gradient" />

            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-gray-900/10 md:bg-gradient-to-t md:from-gray-900 md:via-gray-900/50 md:to-transparent" />

            <!-- Mobile: close + edit top-right -->
            <div class="md:hidden absolute top-3 right-3 flex gap-2 z-10">
              <button @click="$emit('edit', media)" class="bg-black/60 backdrop-blur-sm border border-white/20 text-white p-2 rounded-xl hover:bg-black/80 transition-colors">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="close" class="bg-black/60 backdrop-blur-sm border border-white/20 text-white p-2 rounded-xl hover:bg-black/80 transition-colors">
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Title overlay (bottom of cover) -->
            <div class="absolute bottom-0 left-0 right-0 p-5 md:p-6">
              <div class="flex items-center gap-2 mb-2">
                <TypeBadge :type="media.type" />
                <StatusBadge :status="media.status" />
              </div>
              <h2 class="text-xl md:text-2xl font-bold text-white leading-tight drop-shadow-lg">{{ media.title }}</h2>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-gray-300">
                <span v-if="media.year">{{ media.year }}</span>
                <span v-if="media.genre" class="text-gray-400">· {{ media.genre }}</span>
                <span v-if="media.rating" class="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star class="w-3.5 h-3.5 fill-amber-400" /> {{ media.rating }}/10
                </span>
              </div>
              <div v-if="media.platform" class="flex items-center gap-1.5 mt-2">
                <span class="text-base leading-none">{{ platformEmoji }}</span>
                <span class="text-xs text-gray-400">{{ media.platform }}</span>
              </div>
            </div>
          </div>

          <!-- ── RIGHT: Scrollable content ──────────────────── -->
          <div class="flex-1 flex flex-col min-h-0">

            <!-- Desktop header with close/edit -->
            <div class="hidden md:flex items-center justify-end gap-2 px-5 py-4 shrink-0">
              <button
                @click="$emit('edit', media)"
                class="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Pencil class="w-3.5 h-3.5" /> Editar
              </button>
              <button @click="close" class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors">
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Scrollable body -->
            <div class="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-2 space-y-5">

              <!-- Trailer -->
              <div v-if="media.trailer_url && youtubeId">
                <p class="section-label flex items-center gap-1.5"><Youtube class="w-3.5 h-3.5 text-red-500" /> Trailer</p>
                <div v-if="!trailerPlaying" class="relative rounded-xl overflow-hidden cursor-pointer group" style="aspect-ratio:16/9" @click="trailerPlaying = true">
                  <img
                    :src="`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    :alt="`Trailer de ${media.title}`"
                  />
                  <div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play class="w-5 h-5 text-white ml-0.5 fill-white" />
                    </div>
                  </div>
                </div>
                <div v-else class="rounded-xl overflow-hidden" style="aspect-ratio:16/9">
                  <iframe :src="`https://www.youtube.com/embed/${youtubeId}?autoplay=1`" class="w-full h-full" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen />
                </div>
              </div>

              <!-- Review -->
              <div v-if="media.review">
                <p class="section-label">Mi reseña</p>
                <div class="bg-white/4 border border-white/8 rounded-xl p-4">
                  <div v-if="media.rating" class="flex items-center gap-0.5 mb-2">
                    <Star v-for="n in 10" :key="n" class="w-3 h-3" :class="n <= media.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700 fill-gray-700'" />
                    <span class="text-xs font-bold text-white ml-1.5">{{ media.rating }}/10</span>
                  </div>
                  <p class="text-gray-300 text-sm leading-relaxed italic">"{{ media.review }}"</p>
                </div>
              </div>

              <!-- Description -->
              <div v-if="media.description">
                <p class="section-label">Sinopsis</p>
                <p class="text-gray-300 text-sm leading-relaxed">{{ media.description }}</p>
              </div>

              <!-- Series progress -->
              <div v-if="media.type === 'series'">
                <p class="section-label">Progreso</p>
                <div v-if="loadingProgress" class="h-20 rounded-xl bg-white/5 animate-pulse" />
                <div v-else-if="progress" class="bg-white/5 rounded-xl p-4 space-y-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-300">T{{ progress.current_season ?? '—' }} · Ep {{ progress.current_episode ?? '—' }}</span>
                    <span v-if="progress.total_episodes" class="text-gray-500 text-xs">de {{ progress.total_episodes }} ep.</span>
                  </div>
                  <div v-if="progressPercent !== null" class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" :style="{ width: progressPercent + '%' }" />
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-white/5 rounded-lg p-2.5">
                      <p class="text-gray-500">Temporadas</p>
                      <p class="text-white font-medium">{{ progress.current_season ?? '—' }} / {{ progress.total_seasons ?? '—' }}</p>
                    </div>
                    <div class="bg-white/5 rounded-lg p-2.5">
                      <p class="text-gray-500">Episodios</p>
                      <p class="text-white font-medium">{{ progress.current_episode ?? '—' }} / {{ progress.total_episodes ?? '—' }}</p>
                    </div>
                  </div>
                  <div v-if="progress.total_seasons && progress.total_seasons > 1">
                    <p class="text-xs text-gray-500 mb-2">Temporadas</p>
                    <div class="flex flex-wrap gap-1.5">
                      <div
                        v-for="s in progress.total_seasons" :key="s"
                        class="flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold border transition-colors"
                        :class="s < (progress.current_season ?? 0)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : s === (progress.current_season ?? 0)
                            ? 'bg-violet-500/25 border-violet-500/50 text-violet-200 ring-1 ring-violet-400/30'
                            : 'bg-white/4 border-white/10 text-gray-600'"
                        :title="s < (progress.current_season ?? 0) ? `Temp. ${s} — Vista` : s === (progress.current_season ?? 0) ? `Temp. ${s} — En curso` : `Temp. ${s} — Pendiente`"
                      >{{ s }}</div>
                    </div>
                  </div>
                  <p v-if="progress.notes" class="text-gray-400 text-xs italic border-t border-white/5 pt-3">{{ progress.notes }}</p>
                </div>
                <p v-else class="text-gray-500 text-sm">Sin datos de progreso registrados.</p>
              </div>

              <!-- Reminder -->
              <div v-if="media.remind_at" class="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
                <Bell class="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p class="text-xs text-gray-500">Recordatorio</p>
                  <p class="text-sm font-medium text-amber-300 mt-0.5">{{ formatDate(media.remind_at) }}</p>
                </div>
              </div>

              <!-- Private note -->
              <div v-if="media.private_note" class="flex items-start gap-2.5 bg-gray-800/60 border border-white/8 rounded-xl px-4 py-3">
                <Lock class="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Nota privada</p>
                  <p class="text-sm text-gray-300 italic">{{ media.private_note }}</p>
                </div>
              </div>

              <!-- Watch history -->
              <div v-if="watchHistory.length">
                <p class="section-label flex items-center gap-1.5"><Eye class="w-3.5 h-3.5" /> Visionados ({{ watchHistory.length }})</p>
                <div class="space-y-1.5">
                  <div v-for="(entry, i) in watchHistory" :key="i" class="flex items-center gap-2.5 text-xs bg-white/3 rounded-lg px-3 py-2">
                    <span class="text-emerald-400 font-bold">#{{ watchHistory.length - i }}</span>
                    <span class="text-gray-300">{{ formatDate(entry.watchedAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Status history -->
              <div v-if="history.length">
                <p class="section-label flex items-center gap-1.5"><History class="w-3.5 h-3.5" /> Historial de estado</p>
                <div class="space-y-1.5">
                  <div v-for="h in history" :key="h.$id" class="flex items-center gap-2.5 text-xs bg-white/3 rounded-lg px-3 py-2">
                    <span class="font-medium" :class="statusColor(h.from_status)">{{ statusLabel(h.from_status) }}</span>
                    <span class="text-gray-600">→</span>
                    <span class="font-medium" :class="statusColor(h.to_status)">{{ statusLabel(h.to_status) }}</span>
                    <span class="ml-auto text-gray-600">{{ formatDate(h.changed_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- Meta dates -->
              <div class="grid grid-cols-2 gap-2 text-xs pb-2">
                <div class="bg-white/4 rounded-xl p-3">
                  <p class="text-gray-500 mb-1">Añadido</p>
                  <p class="text-gray-300">{{ formatDate(media.$createdAt) }}</p>
                </div>
                <div class="bg-white/4 rounded-xl p-3">
                  <p class="text-gray-500 mb-1">Actualizado</p>
                  <p class="text-gray-300">{{ formatDate(media.$updatedAt) }}</p>
                </div>
                <div v-if="media.finished_at" class="col-span-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5">
                  <CheckCheck class="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p class="text-gray-500">Terminado el</p>
                    <p class="text-emerald-300 font-medium mt-0.5">{{ formatDate(media.finished_at) }}</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- ── Sticky footer: actions ───────────────────── -->
            <div class="px-5 md:px-6 py-4 border-t border-white/8 shrink-0 flex gap-2 bg-gray-900/80 backdrop-blur-sm">

              <template v-if="media.status === 'watched'">
                <button @click="cycleStatus" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-gray-500/30 text-gray-300 hover:bg-gray-500/10 transition-all duration-150">
                  <RotateCcw class="w-4 h-4" /> Quitar visto
                </button>
                <button @click="rewatchMedia" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition-all duration-150">
                  <RefreshCw class="w-4 h-4" /> Volver a ver
                </button>
              </template>

              <button
                v-else
                @click="cycleStatus"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150"
                :class="cycleClass"
              >
                <component :is="cycleIcon" class="w-4 h-4" />
                {{ cycleLabel }}
              </button>

              <button
                v-if="media.type !== 'book'"
                @click="showRecs = true"
                class="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors"
                title="Recomendaciones similares"
              >
                <Sparkles class="w-4 h-4" />
              </button>

              <button
                @click="confirmDelete"
                class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </Transition>

    <RecommendationsDrawer v-model="showRecs" :media="media" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Pencil, Star, Trash2, Eye, Clock, CheckCheck, History, Bell, Youtube, Play, RotateCcw, Sparkles, RefreshCw, Lock } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import type { Media, Progress, StatusHistory } from '@/types'
import { getWatchHistory, type WatchEntry } from '@/lib/watchHistory'
import TypeBadge             from './TypeBadge.vue'
import StatusBadge           from './StatusBadge.vue'
import RecommendationsDrawer from '@/components/ui/RecommendationsDrawer.vue'

const props = defineProps<{ modelValue: boolean; media: Media | null }>()
const emit  = defineEmits<{
  'update:modelValue': [v: boolean]
  edit:   [m: Media]
  delete: [id: string]
}>()

const showRecs        = ref(false)
const store           = useMediaStore()
const ui              = useUiStore()
const progress        = ref<Progress | null>(null)
const loadingProgress = ref(false)
const history         = ref<StatusHistory[]>([])
const watchHistory    = ref<WatchEntry[]>([])

watch(() => props.media, async (m) => {
  progress.value     = null
  history.value      = []
  watchHistory.value = []
  if (!m) return
  watchHistory.value = getWatchHistory(m.$id)
  if (m.type === 'series') {
    loadingProgress.value = true
    try { progress.value = await store.getProgress(m.$id) }
    finally { loadingProgress.value = false }
  }
  const currentId = m.$id
  store.getStatusHistory(currentId).then(h => {
    if (props.media?.$id === currentId) history.value = h
  }).catch((e) => console.warn('[DetailDrawer] getStatusHistory failed:', e))
}, { immediate: true })

const trailerPlaying = ref(false)
watch(() => props.media, () => { trailerPlaying.value = false })

const youtubeId = computed(() => {
  const url = props.media?.trailer_url
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*?v=|embed\/|v\/))([^&?/\s]{11})/)
  return m?.[1] ?? null
})

const PLATFORM_EMOJI: Record<string, string> = {
  'Netflix': '🎬', 'HBO Max': '🟣', 'Prime Video': '📦', 'Disney+': '✨',
  'Apple TV+': '🍎', 'Movistar+': '📡', 'Crunchyroll': '🍥', 'Filmin': '🎭',
  'Mubi': '🎞️', 'YouTube': '▶️', 'Físico': '💿', 'Otro': '📌',
}
const platformEmoji  = computed(() => props.media?.platform ? (PLATFORM_EMOJI[props.media.platform] ?? '📺') : '')
const gradient       = computed(() => props.media ? ({
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}[props.media.type]) : '')
const progressPercent = computed(() => {
  if (!progress.value?.current_episode || !progress.value?.total_episodes) return null
  return Math.round((progress.value.current_episode / progress.value.total_episodes) * 100)
})

const cycleIcon  = computed(() => props.media ? ({ pending: Clock, watching: CheckCheck, watched: RotateCcw, dropped: RotateCcw }[props.media.status] ?? Eye) : Eye)
const cycleLabel = computed(() => props.media ? ({ pending: 'Empezar a ver', watching: 'Marcar como visto', watched: 'Quitar visto', dropped: 'Retomar' }[props.media.status] ?? '') : '')
const cycleClass = computed(() => props.media ? ({
  pending:  'border-blue-500/30 text-blue-300 hover:bg-blue-500/10',
  watching: 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10',
  watched:  'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10',
  dropped:  'border-red-500/30 text-red-300 hover:bg-red-500/10',
}[props.media.status] ?? '') : '')

function close() { emit('update:modelValue', false) }

async function cycleStatus() {
  if (!props.media) return
  await store.cycleStatus(props.media.$id)
  ui.toast('Estado actualizado')
}
async function rewatchMedia() {
  if (!props.media) return
  await store.rewatch(props.media.$id)
  ui.toast('¡A verla de nuevo!')
}
function confirmDelete() {
  if (!props.media) return
  emit('delete', props.media.$id)
  close()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}
function statusLabel(s: string) {
  return ({ watching: 'Viendo', watched: 'Visto', pending: 'Pendiente', dropped: 'Abandonado' }[s] ?? s)
}
function statusColor(s: string) {
  return ({ watching: 'text-blue-300', watched: 'text-emerald-300', pending: 'text-amber-300', dropped: 'text-red-300' }[s] ?? 'text-gray-300')
}
</script>

<style scoped>
.section-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(107 114 128);
  margin-bottom: 0.5rem;
}

.modal-detail-enter-active { transition: opacity .25s ease, transform .3s cubic-bezier(.34,1.56,.64,1); }
.modal-detail-leave-active { transition: opacity .2s ease, transform .2s ease; }
.modal-detail-enter-from, .modal-detail-leave-to { opacity: 0; transform: scale(.97) translateY(12px); }
</style>
