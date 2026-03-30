<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="close" />
    </Transition>

    <Transition name="drawer">
      <div
        v-if="modelValue && media"
        class="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-900 border-l border-white/10 z-50 flex flex-col"
        @click.stop
      >
        <!-- Hero cover -->
        <div class="relative h-56 shrink-0 overflow-hidden">
          <img
            v-if="media.cover_url"
            :src="media.cover_url"
            :alt="media.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full" :class="gradient" />

          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

          <!-- Close + Edit actions -->
          <div class="absolute top-4 right-4 flex gap-2">
            <button @click="$emit('edit', media)" class="bg-black/50 backdrop-blur-sm border border-white/20 text-white p-2 rounded-xl hover:bg-black/70 transition-colors">
              <Pencil class="w-4 h-4" />
            </button>
            <button @click="close" class="bg-black/50 backdrop-blur-sm border border-white/20 text-white p-2 rounded-xl hover:bg-black/70 transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Title overlay -->
          <div class="absolute bottom-4 left-6 right-6">
            <div class="flex items-center gap-2 mb-1.5">
              <TypeBadge :type="media.type" />
              <StatusBadge :status="media.status" />
            </div>
            <h2 class="text-2xl font-bold text-white leading-tight">{{ media.title }}</h2>
            <div class="flex items-center gap-3 mt-1 text-sm text-gray-300">
              <span v-if="media.year">{{ media.year }}</span>
              <span v-if="media.genre">· {{ media.genre }}</span>
              <span v-if="media.rating" class="flex items-center gap-1">
                <Star class="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {{ media.rating }}/10
              </span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Description -->
          <div v-if="media.description">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Sinopsis</h3>
            <p class="text-gray-300 text-sm leading-relaxed">{{ media.description }}</p>
          </div>

          <!-- Platform -->
          <div v-if="media.platform" class="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
            <span class="text-xl leading-none">{{ platformEmoji }}</span>
            <div>
              <p class="text-xs text-gray-500">Plataforma</p>
              <p class="text-sm font-medium text-white mt-0.5">{{ media.platform }}</p>
            </div>
          </div>

          <!-- Series progress -->
          <div v-if="media.type === 'series'">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Progreso</h3>

            <div v-if="loadingProgress" class="h-20 rounded-xl bg-white/5 animate-pulse" />

            <div v-else-if="progress" class="bg-white/5 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-300">
                  T{{ progress.current_season ?? media.current_season ?? '—' }}
                  · Ep {{ progress.current_episode ?? media.current_episode ?? '—' }}
                </span>
                <span v-if="progress.total_episodes" class="text-gray-500 text-xs">
                  de {{ progress.total_episodes }} ep.
                </span>
              </div>

              <div v-if="progressPercent !== null" class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  :style="{ width: progressPercent + '%' }"
                />
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

              <!-- Season tracker -->
              <div v-if="progress.total_seasons && progress.total_seasons > 1">
                <p class="text-xs text-gray-500 mb-2">Temporadas</p>
                <div class="flex flex-wrap gap-1.5">
                  <div
                    v-for="s in progress.total_seasons"
                    :key="s"
                    class="flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold border transition-colors"
                    :class="s < (progress.current_season ?? 0)
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : s === (progress.current_season ?? 0)
                        ? 'bg-violet-500/25 border-violet-500/50 text-violet-200 ring-1 ring-violet-400/30'
                        : 'bg-white/4 border-white/10 text-gray-600'"
                    :title="s < (progress.current_season ?? 0) ? `Temp. ${s} — Vista` : s === (progress.current_season ?? 0) ? `Temp. ${s} — En curso` : `Temp. ${s} — Pendiente`"
                  >
                    {{ s }}
                  </div>
                </div>
              </div>

              <div v-if="progress.notes" class="text-gray-400 text-xs italic border-t border-white/5 pt-3">
                {{ progress.notes }}
              </div>
            </div>

            <div v-else class="text-gray-500 text-sm">Sin datos de progreso registrados.</div>
          </div>

          <!-- Reminder badge -->
          <div v-if="media.remind_at" class="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
            <Bell class="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p class="text-xs text-gray-500">Recordatorio</p>
              <p class="text-sm font-medium text-amber-300 mt-0.5">{{ formatDate(media.remind_at) }}</p>
            </div>
          </div>

          <!-- Status history -->
          <div v-if="history.length">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <History class="w-3.5 h-3.5" /> Historial
            </h3>
            <div class="space-y-1.5">
              <div
                v-for="h in history"
                :key="h.$id"
                class="flex items-center gap-2.5 text-xs bg-white/3 rounded-lg px-3 py-2"
              >
                <span class="font-medium" :class="statusColor(h.from_status)">{{ statusLabel(h.from_status) }}</span>
                <span class="text-gray-600">→</span>
                <span class="font-medium" :class="statusColor(h.to_status)">{{ statusLabel(h.to_status) }}</span>
                <span class="ml-auto text-gray-600">{{ formatDate(h.changed_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Meta info -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-white/5 rounded-xl p-3">
              <p class="text-gray-500 mb-1">Añadido</p>
              <p class="text-gray-300">{{ formatDate(media.$createdAt) }}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-3">
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

        <!-- Footer actions -->
        <div class="px-6 py-4 border-t border-white/5 shrink-0 flex gap-3">
          <button
            @click="cycleStatus"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150"
            :class="cycleClass"
          >
            <component :is="cycleIcon" class="w-4 h-4" />
            {{ cycleLabel }}
          </button>
          <button
            @click="confirmDelete"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Pencil, Star, Trash2, Eye, Clock, CheckCheck, History, Bell } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore } from '@/stores/ui'
import type { Media, Progress, StatusHistory } from '@/types'
import TypeBadge   from './TypeBadge.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ modelValue: boolean; media: Media | null }>()
const emit  = defineEmits<{
  'update:modelValue': [v: boolean]
  edit:   [m: Media]
  delete: [id: string]
}>()

const store   = useMediaStore()
const ui      = useUiStore()
const progress        = ref<Progress | null>(null)
const loadingProgress = ref(false)
const history         = ref<StatusHistory[]>([])

watch(() => props.media, async (m) => {
  progress.value = null
  history.value  = []
  if (!m) return
  if (m.type === 'series') {
    loadingProgress.value = true
    try { progress.value = await store.getProgress(m.$id) }
    finally { loadingProgress.value = false }
  }
  store.getStatusHistory(m.$id).then(h => { history.value = h }).catch(() => {})
}, { immediate: true })

const PLATFORM_EMOJI: Record<string, string> = {
  'Netflix': '🎬', 'HBO Max': '🟣', 'Prime Video': '📦', 'Disney+': '✨',
  'Apple TV+': '🍎', 'Movistar+': '📡', 'Crunchyroll': '🍥', 'Filmin': '🎭',
  'Mubi': '🎞️', 'YouTube': '▶️', 'Físico': '💿', 'Otro': '📌',
}
const platformEmoji = computed(() => props.media?.platform ? (PLATFORM_EMOJI[props.media.platform] ?? '📺') : '')

const gradient = computed(() => props.media ? ({
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}[props.media.type]) : '')

const progressPercent = computed(() => {
  if (!progress.value?.current_episode || !progress.value?.total_episodes) return null
  return Math.round((progress.value.current_episode / progress.value.total_episodes) * 100)
})

const cycleIcon  = computed(() => props.media ? ({ watching: Eye, pending: Clock, watched: CheckCheck }[props.media.status]) : Eye)
const cycleLabel = computed(() => props.media ? ({ watching: 'Marcar pendiente', pending: 'Empezar a ver', watched: 'Marcar como visto' }[props.media.status]) : '')
const cycleClass = computed(() => props.media ? ({
  watching: 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10',
  pending:  'border-blue-500/30 text-blue-300 hover:bg-blue-500/10',
  watched:  'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10',
}[props.media.status]) : '')

function close() { emit('update:modelValue', false) }

async function cycleStatus() {
  if (!props.media) return
  await store.cycleStatus(props.media.$id)
  ui.toast('Estado actualizado')
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
  return ({ watching: 'Viendo', watched: 'Visto', pending: 'Pendiente' }[s] ?? s)
}
function statusColor(s: string) {
  return ({ watching: 'text-blue-300', watched: 'text-emerald-300', pending: 'text-amber-300' }[s] ?? 'text-gray-300')
}
</script>
