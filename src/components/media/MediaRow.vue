<template>
  <div
    class="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/60 border transition-all duration-200 cursor-pointer hover:bg-gray-800/60"
    :class="rowBorder"
    @click="$emit('detail', media)"
  >
    <!-- Status accent -->
    <div class="w-0.5 h-10 rounded-full shrink-0" :class="statusAccent" />

    <!-- Thumbnail -->
    <div class="w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
      <img v-if="media.cover_url" :src="media.cover_url" :alt="media.title" class="w-full h-full object-cover" loading="lazy" />
      <div v-else class="w-full h-full flex items-center justify-center" :class="gradient">
        <component :is="typeIcon" class="w-5 h-5 text-white/30" />
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <p class="text-sm font-semibold text-white truncate">{{ media.title }}</p>
        <span
          v-if="media.type === 'series' && media.current_season"
          class="shrink-0 text-[10px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-1.5 py-0.5"
        >
          T{{ media.current_season }}·E{{ media.current_episode ?? 1 }}
        </span>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span class="flex items-center gap-1 font-medium" :class="statusTextClass">
          <span class="w-1.5 h-1.5 rounded-full" :class="statusDotClass" />
          {{ statusLabel }}
        </span>
        <span v-if="media.year">· {{ media.year }}</span>
        <span v-if="media.genre" class="truncate">· {{ media.genre.split(',')[0].trim() }}</span>
      </div>
    </div>

    <!-- Rating -->
    <div v-if="media.rating" class="flex items-center gap-1 shrink-0">
      <Star class="w-3 h-3 text-amber-400 fill-amber-400" />
      <span class="text-xs font-bold text-white">{{ media.rating }}</span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <button @click.stop="$emit('edit', media)" class="row-action text-gray-400 hover:text-white hover:bg-white/10">
        <Pencil class="w-3.5 h-3.5" />
      </button>
      <button @click.stop="cycleStatus" class="row-action" :class="cycleClass">
        <component :is="nextStatusIcon" class="w-3.5 h-3.5" />
      </button>
      <button v-if="media.status === 'watching'" @click.stop="dropMedia" class="row-action text-red-400/60 hover:text-red-400 hover:bg-red-500/10" title="Abandonar">
        <XCircle class="w-3.5 h-3.5" />
      </button>
      <button @click.stop="$emit('delete', media.$id)" class="row-action text-red-400/70 hover:text-red-400 hover:bg-red-500/10">
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, Pencil, Trash2, Film, Tv, BookOpen, Eye, CheckCheck, RotateCcw, XCircle } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import type { Media } from '@/types'

const props = defineProps<{ media: Media }>()
defineEmits<{ detail: [m: Media]; edit: [m: Media]; delete: [id: string] }>()

const store = useMediaStore()

const typeIcon = computed(() => ({ movie: Film, series: Tv, book: BookOpen }[props.media.type]))
const gradient = computed(() => ({
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}[props.media.type]))

const rowBorder = computed(() => ({
  watching: 'border-blue-500/15 hover:border-blue-500/30',
  pending:  'border-white/5 hover:border-white/10',
  watched:  'border-emerald-500/10 hover:border-emerald-500/25',
  dropped:  'border-red-500/10 hover:border-red-500/25',
}[props.media.status]))

const statusAccent    = computed(() => ({ watching: 'bg-blue-400', pending: 'bg-amber-400/50', watched: 'bg-emerald-400', dropped: 'bg-red-400' }[props.media.status]))
const statusLabel     = computed(() => ({ watching: 'Viendo', pending: 'Pendiente', watched: 'Visto', dropped: 'Abandonado' }[props.media.status]))
const statusTextClass = computed(() => ({ watching: 'text-blue-300', pending: 'text-amber-300', watched: 'text-emerald-300', dropped: 'text-red-300' }[props.media.status]))
const statusDotClass  = computed(() => ({ watching: 'bg-blue-400', pending: 'bg-amber-400', watched: 'bg-emerald-400', dropped: 'bg-red-400' }[props.media.status]))

const nextState      = computed(() => ({ pending: 'watching', watching: 'watched', watched: 'pending', dropped: 'watching' }[props.media.status] as Media['status']))
const nextStatusIcon = computed(() => ({ watching: Eye, watched: CheckCheck, pending: RotateCcw, dropped: RotateCcw }[nextState.value]))
const cycleClass     = computed(() => ({
  watching: 'text-blue-300 hover:bg-blue-500/15',
  watched:  'text-emerald-300 hover:bg-emerald-500/15',
  pending:  'text-gray-300 hover:bg-white/10',
  dropped:  'text-red-300 hover:bg-red-500/15',
}[props.media.status]))

async function cycleStatus() {
  await store.cycleStatus(props.media.$id)
}

async function dropMedia() {
  await store.setStatus(props.media.$id, 'dropped')
}
</script>

<style scoped>
.row-action {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: background-color .15s, color .15s;
}
</style>
