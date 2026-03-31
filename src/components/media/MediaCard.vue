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

    <!-- Platform — top right (above rating) -->
    <div
      v-if="media.platform"
      class="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-white/10"
    >
      <span class="text-[10px] font-bold text-white/80 leading-none">{{ platformEmoji }}</span>
    </div>

    <!-- Rating — below platform or top-right if no platform -->
    <div
      v-if="media.rating"
      class="absolute flex items-center gap-1 bg-black/65 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-white/10"
      :class="media.platform ? 'top-8 right-2.5' : 'top-2.5 right-2.5'"
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

    <!-- Hover overlay + actions (desktop only) -->
    <div class="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex flex-col items-center justify-between py-4 px-3">

      <!-- Top: hint -->
      <p class="text-white/35 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
        <Eye class="w-3 h-3" /> Ver detalle
      </p>

      <!-- Center: primary action -->
      <button
        @click.stop="cycleStatus"
        class="primary-action group/p flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-150"
        :class="primaryBtnClass"
      >
        <component :is="nextStatusIcon" class="w-4 h-4 shrink-0" />
        <span class="text-sm font-bold">{{ nextStatusLabel }}</span>
      </button>

      <!-- Bottom: secondary actions (icon only) -->
      <div class="flex items-center gap-1.5">
        <button @click.stop="$emit('edit', media)" class="sec-btn text-gray-400 hover:text-white hover:bg-white/15 border-white/10 hover:border-white/25" title="Editar">
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button v-if="media.status === 'watching'" @click.stop="dropMedia" class="sec-btn text-red-400/70 hover:text-red-300 hover:bg-red-500/15 border-red-500/15 hover:border-red-500/35" title="Abandonar">
          <XCircle class="w-3.5 h-3.5" />
        </button>
        <button @click.stop="$emit('delete', media.$id)" class="sec-btn text-red-400/70 hover:text-red-300 hover:bg-red-500/15 border-red-500/15 hover:border-red-500/35" title="Eliminar">
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>

    </div>

  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, Pencil, Trash2, Film, Tv, BookOpen, Eye, CheckCheck, RotateCcw, XCircle } from 'lucide-vue-next'
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
  dropped:  'bg-gray-900 border border-red-500/20 hover:border-red-500/40',
}[props.media.status]))

const statusAccent = computed(() => ({
  watching: 'bg-blue-400',
  pending:  'bg-amber-400/50',
  watched:  'bg-emerald-400',
  dropped:  'bg-red-400',
}[props.media.status]))

const statusLabel = computed(() => ({
  watching: 'Viendo', pending: 'Pendiente', watched: 'Visto', dropped: 'Abandonado',
}[props.media.status]))

const statusTextClass = computed(() => ({
  watching: 'text-blue-300', pending: 'text-amber-300', watched: 'text-emerald-300', dropped: 'text-red-300',
}[props.media.status]))

const statusDotClass = computed(() => ({
  watching: 'bg-blue-400', pending: 'bg-amber-400', watched: 'bg-emerald-400', dropped: 'bg-red-400',
}[props.media.status]))

const PLATFORM_EMOJI: Record<string, string> = {
  'Netflix': '🎬', 'HBO Max': '🟣', 'Prime Video': '📦', 'Disney+': '✨',
  'Apple TV+': '🍎', 'Movistar+': '📡', 'Crunchyroll': '🍥', 'Filmin': '🎭',
  'Mubi': '🎞️', 'YouTube': '▶️', 'Físico': '💿', 'Otro': '📌',
}
const platformEmoji = computed(() => props.media.platform ? (PLATFORM_EMOJI[props.media.platform] ?? '📺') : '')

const nextState = computed(() => ({
  pending: 'watching', watching: 'watched', watched: 'pending', dropped: 'watching',
}[props.media.status] as Media['status']))

const nextStatusIcon  = computed(() => ({ watching: Eye, watched: CheckCheck, pending: RotateCcw, dropped: RotateCcw }[nextState.value]))
const nextStatusLabel = computed(() => ({ pending: 'Empezar', watching: 'Marcar visto', watched: 'Quitar visto', dropped: 'Retomar' }[props.media.status]))
const primaryBtnClass = computed(() => ({
  watching: 'border-blue-500/40    bg-blue-500/20    text-blue-200    hover:bg-blue-500/35    hover:border-blue-400/60',
  watched:  'border-emerald-500/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/35 hover:border-emerald-400/60',
  pending:  'border-gray-500/40    bg-gray-500/20    text-gray-200    hover:bg-gray-500/35    hover:border-gray-400/60',
  dropped:  'border-red-500/40     bg-red-500/20     text-red-200     hover:bg-red-500/35     hover:border-red-400/60',
}[props.media.status]))

async function cycleStatus() {
  await store.cycleStatus(props.media.$id)
}

async function dropMedia() {
  await store.setStatus(props.media.$id, 'dropped')
}
</script>

<style scoped>
.primary-action { backdrop-filter: blur(4px); }
.primary-action:hover { transform: scale(1.04); }

.sec-btn {
  width: 32px; height: 32px; border-radius: 10px; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  transition: background-color .15s, border-color .15s, color .15s, transform .15s;
}
.sec-btn:hover { transform: scale(1.1); }

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
