<template>
  <article
    class="group relative rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60"
    style="aspect-ratio: 2/3"
    :class="cardBorder"
    @click="$emit('detail', media)"
  >
    <!-- Cover / fallback gradient -->
    <div class="absolute inset-0">
      <img
        v-if="media.cover_url"
        :src="media.cover_url"
        :alt="media.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center gap-3" :class="gradient">
        <component :is="typeIcon" class="w-10 h-10 text-white/20" />
        <span class="text-white/25 text-[10px] font-bold uppercase tracking-[.2em]">{{ typeLabel }}</span>
      </div>
    </div>

    <!-- ── MOVIE frame: film-strip bars top + bottom ─────────── -->
    <template v-if="media.type === 'movie'">
      <div class="film-strip film-strip--top" />
      <div class="film-strip film-strip--bottom" />
    </template>

    <!-- ── SERIES frame: TV corner brackets ──────────────────── -->
    <template v-if="media.type === 'series'">
      <div class="tv-corner tv-corner--tl" />
      <div class="tv-corner tv-corner--tr" />
      <div class="tv-corner tv-corner--bl" />
      <div class="tv-corner tv-corner--br" />
    </template>

    <!-- ── BOOK frame: dog-ear fold + spine ──────────────────── -->
    <template v-if="media.type === 'book'">
      <div class="book-spine" />
      <div class="book-dogear" />
    </template>

    <!-- Bottom gradient -->
    <div class="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

    <!-- Status accent — left edge -->
    <div class="absolute left-0 inset-y-0 w-[3px]" :class="statusAccent" />

    <!-- Rating — top right -->
    <div
      v-if="media.rating"
      class="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/65 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-white/10"
    >
      <Star class="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
      <span class="text-[11px] font-bold text-white leading-none">{{ media.rating }}</span>
    </div>

    <!-- Series progress — top left (shifted right of the strip) -->
    <div
      v-if="media.type === 'series' && media.current_season"
      class="absolute top-2.5 left-3.5 flex items-center gap-1 bg-black/65 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-violet-500/30"
    >
      <Tv class="w-2.5 h-2.5 text-violet-400 shrink-0" />
      <span class="text-[10px] font-bold text-violet-200">T{{ media.current_season }}·E{{ media.current_episode ?? 1 }}</span>
    </div>

    <!-- Bottom info (always visible) -->
    <div class="absolute inset-x-0 bottom-0 px-3 pb-3 pt-8 pointer-events-none">
      <p class="text-white text-sm font-semibold leading-tight line-clamp-2 mb-1.5">{{ media.title }}</p>
      <div class="flex items-center gap-2">
        <span class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" :class="statusTextClass">
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="statusDotClass" />
          {{ statusLabel }}
        </span>
        <span v-if="media.year" class="text-gray-500 text-[11px]">{{ media.year }}</span>
      </div>
    </div>

    <!-- Hover overlay + actions -->
    <div class="absolute inset-0 bg-black/72 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-4 p-3">

      <p class="text-white/40 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
        <Eye class="w-3 h-3" /> Ver detalle
      </p>

      <div class="flex gap-2.5">

        <!-- Edit -->
        <button @click.stop="$emit('edit', media)" class="action-btn group/b">
          <div class="action-icon border-white/20 bg-white/10 text-white group-hover/b:bg-white/25 group-hover/b:border-white/40">
            <Pencil class="w-4 h-4" />
          </div>
          <span class="action-label text-white/55">Editar</span>
        </button>

        <!-- Cycle status -->
        <button @click.stop="cycleStatus" class="action-btn group/b">
          <div class="action-icon" :class="cycleBtnClass">
            <component :is="nextStatusIcon" class="w-4 h-4" />
          </div>
          <span class="action-label" :class="cycleLabelClass">{{ nextStatusLabel }}</span>
        </button>

        <!-- Delete -->
        <button @click.stop="$emit('delete', media.$id)" class="action-btn group/b">
          <div class="action-icon border-red-500/30 bg-red-500/15 text-red-400 group-hover/b:bg-red-500/30 group-hover/b:border-red-500/55">
            <Trash2 class="w-4 h-4" />
          </div>
          <span class="action-label text-red-400/55">Eliminar</span>
        </button>

      </div>
    </div>

  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, Pencil, Trash2, Film, Tv, BookOpen, Eye, CheckCheck, RotateCcw } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import type { Media } from '@/types'

const props = defineProps<{ media: Media }>()
defineEmits<{ detail: [m: Media]; edit: [m: Media]; delete: [id: string] }>()

const store = useMediaStore()

const typeIcon  = computed(() => ({ movie: Film, series: Tv, book: BookOpen }[props.media.type]))
const typeLabel = computed(() => ({ movie: 'Película', series: 'Serie', book: 'Libro' }[props.media.type]))
const gradient  = computed(() => ({
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}[props.media.type]))

const cardBorder = computed(() => ({
  watching: 'bg-gray-900 border border-blue-500/25 hover:border-blue-500/50',
  pending:  'bg-gray-900 border border-white/5  hover:border-white/15',
  watched:  'bg-gray-900 border border-emerald-500/20 hover:border-emerald-500/40',
}[props.media.status]))

const statusAccent = computed(() => ({
  watching: 'bg-blue-400',
  pending:  'bg-amber-400/50',
  watched:  'bg-emerald-400',
}[props.media.status]))

const statusLabel = computed(() => ({
  watching: 'Viendo', pending: 'Pendiente', watched: 'Visto',
}[props.media.status]))

const statusTextClass = computed(() => ({
  watching: 'text-blue-300', pending: 'text-amber-300', watched: 'text-emerald-300',
}[props.media.status]))

const statusDotClass = computed(() => ({
  watching: 'bg-blue-400', pending: 'bg-amber-400', watched: 'bg-emerald-400',
}[props.media.status]))

const nextState = computed(() => ({
  pending: 'watching', watching: 'watched', watched: 'pending',
}[props.media.status] as 'watching' | 'watched' | 'pending'))

const nextStatusIcon  = computed(() => ({ watching: Eye, watched: CheckCheck, pending: RotateCcw }[nextState.value]))
const nextStatusLabel = computed(() => ({ watching: 'Empezar', watched: 'Marcar visto', pending: 'Quitar visto' }[nextState.value]))
const cycleBtnClass   = computed(() => ({
  watching: 'border-blue-500/30    bg-blue-500/15    text-blue-300    group-hover/b:bg-blue-500/30    group-hover/b:border-blue-500/55',
  watched:  'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 group-hover/b:bg-emerald-500/30 group-hover/b:border-emerald-500/55',
  pending:  'border-gray-500/30    bg-gray-500/15    text-gray-300    group-hover/b:bg-gray-500/30    group-hover/b:border-gray-500/55',
}[nextState.value]))
const cycleLabelClass = computed(() => ({
  watching: 'text-blue-300/55', watched: 'text-emerald-300/55', pending: 'text-gray-300/55',
}[nextState.value]))

async function cycleStatus() {
  await store.cycleStatus(props.media.$id)
}
</script>

<style scoped>
.action-btn  { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.action-icon {
  width: 44px; height: 44px; border-radius: 14px; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  transition: background-color .15s, border-color .15s, transform .15s;
}
.action-btn:hover .action-icon  { transform: scale(1.1); }
.action-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }

/* ── Film-strip bars (movie) ─────────────────────────────── */
.film-strip {
  position: absolute; left: 0; right: 0; height: 14px; z-index: 10; pointer-events: none;
  background-color: rgba(0,0,0,.75);
  background-image: repeating-linear-gradient(
    90deg,
    transparent 0px, transparent 6px,
    rgba(255,255,255,.15) 6px, rgba(255,255,255,.15) 8px,
    transparent 8px, transparent 18px
  );
  background-size: 24px 100%;
}
.film-strip--top    { top: 0; }
.film-strip--bottom { bottom: 0; }

/* ── TV corner brackets (series) ────────────────────────── */
.tv-corner {
  position: absolute; width: 12px; height: 12px; z-index: 10; pointer-events: none;
  border-color: rgba(167,139,250,.55); /* violet-400/55 */
  border-style: solid; border-width: 0;
}
.tv-corner--tl { top: 6px;    left: 6px;    border-top-width: 2px;    border-left-width: 2px;    border-top-left-radius: 3px; }
.tv-corner--tr { top: 6px;    right: 6px;   border-top-width: 2px;    border-right-width: 2px;   border-top-right-radius: 3px; }
.tv-corner--bl { bottom: 6px; left: 6px;    border-bottom-width: 2px; border-left-width: 2px;    border-bottom-left-radius: 3px; }
.tv-corner--br { bottom: 6px; right: 6px;   border-bottom-width: 2px; border-right-width: 2px;   border-bottom-right-radius: 3px; }

/* ── Book dog-ear + spine (book) ─────────────────────────── */
.book-spine {
  position: absolute; top: 0; bottom: 0; left: 0; width: 8px; z-index: 10; pointer-events: none;
  background: linear-gradient(90deg,
    rgba(217,119,6,.35) 0%,   /* amber-600/35 */
    rgba(217,119,6,.12) 60%,
    transparent 100%
  );
  border-right: 1px solid rgba(251,191,36,.15); /* amber-400/15 */
}
.book-dogear {
  position: absolute; top: 0; right: 0; z-index: 10; pointer-events: none;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 20px 20px 0;
  border-color: transparent rgba(0,0,0,.7) transparent transparent;
  filter: drop-shadow(-1px 1px 2px rgba(0,0,0,.5));
}
.book-dogear::after {
  content: '';
  position: absolute;
  top: 0; right: -20px;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 20px 20px 0;
  border-color: transparent rgba(217,119,6,.25) transparent transparent;
}
</style>
