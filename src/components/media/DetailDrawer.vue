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

          <!-- Series progress -->
          <div v-if="media.type === 'series'">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Progreso</h3>

            <div v-if="loadingProgress" class="h-20 rounded-xl bg-white/5 animate-pulse" />

            <div v-else-if="progress" class="bg-white/5 rounded-xl p-4 space-y-3">
              <!-- Season/episode bar -->
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-300">
                  T{{ progress.current_season ?? media.current_season ?? '—' }}
                  · Ep {{ progress.current_episode ?? media.current_episode ?? '—' }}
                </span>
                <span v-if="progress.total_episodes" class="text-gray-500 text-xs">
                  de {{ progress.total_episodes }} ep.
                </span>
              </div>

              <!-- Progress bar -->
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

              <div v-if="progress.notes" class="text-gray-400 text-xs italic border-t border-white/5 pt-3">
                {{ progress.notes }}
              </div>
            </div>

            <div v-else class="text-gray-500 text-sm">Sin datos de progreso registrados.</div>
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
import { X, Pencil, Star, Trash2, Eye, Clock, CheckCheck } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore } from '@/stores/ui'
import type { Media, Progress } from '@/types'
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

watch(() => props.media, async (m) => {
  progress.value = null
  if (!m || m.type !== 'series') return
  loadingProgress.value = true
  try { progress.value = await store.getProgress(m.$id) }
  finally { loadingProgress.value = false }
}, { immediate: true })

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
</script>
