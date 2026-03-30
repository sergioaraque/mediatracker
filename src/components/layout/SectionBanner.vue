<template>
  <Transition name="section-banner">
    <div
      v-if="config"
      :key="type"
      class="relative rounded-3xl overflow-hidden mb-8 border"
      :class="config.wrap"
    >
      <!-- Ambient gradient layer -->
      <div class="absolute inset-0 pointer-events-none" :class="config.bg" />

      <!-- Section-specific pattern overlay -->
      <div class="absolute inset-0 pointer-events-none" :class="config.pattern" />

      <!-- Content -->
      <div class="relative z-10 flex items-center gap-6 px-8 py-7">
        <!-- Big emoji -->
        <div class="text-5xl select-none drop-shadow-2xl leading-none shrink-0">{{ config.emoji }}</div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none mb-1.5">
            {{ config.title }}
          </h2>
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-medium" :class="config.subColor">
              {{ count }} {{ count === 1 ? 'título' : 'títulos' }}
            </span>
            <span v-if="watched" class="text-sm" :class="config.subColor">
              · {{ watched }} vistos
            </span>
            <span v-if="avg" class="flex items-center gap-1 text-sm font-bold text-amber-300">
              <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {{ avg }} de media
            </span>
          </div>
        </div>

        <!-- Decorative large icon watermark -->
        <div class="absolute right-6 top-1/2 -translate-y-1/2 text-[96px] leading-none opacity-[0.06] select-none pointer-events-none hidden sm:block">
          {{ config.emoji }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'

const props = defineProps<{ type: string | null }>()

const media = useMediaStore()

const CONFIGS = {
  movie: {
    emoji: '🎬',
    title: 'Películas',
    wrap:    'border-blue-500/15',
    bg:      'bg-gradient-to-br from-blue-900/35 via-blue-950/20 to-indigo-950/10',
    pattern: 'film-pattern',
    subColor: 'text-blue-300/70',
  },
  series: {
    emoji: '📺',
    title: 'Series',
    wrap:    'border-violet-500/15',
    bg:      'bg-gradient-to-br from-violet-900/35 via-violet-950/20 to-indigo-950/10',
    pattern: 'scan-pattern',
    subColor: 'text-violet-300/70',
  },
  book: {
    emoji: '📚',
    title: 'Libros',
    wrap:    'border-amber-500/15',
    bg:      'bg-gradient-to-br from-amber-900/25 via-amber-950/15 to-yellow-950/10',
    pattern: 'page-pattern',
    subColor: 'text-amber-300/70',
  },
}

const config = computed(() => props.type ? CONFIGS[props.type as keyof typeof CONFIGS] ?? null : null)

const count = computed(() => {
  if (!props.type) return 0
  return media.all.filter(m => m.type === props.type).length
})

const watched = computed(() => {
  if (!props.type) return 0
  return media.all.filter(m => m.type === props.type && m.status === 'watched').length
})

const avg = computed(() => {
  if (!props.type) return null
  const rated = media.all.filter(m => m.type === props.type && m.rating)
  if (!rated.length) return null
  return (rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length).toFixed(1)
})
</script>

<style scoped>
/* ── Film strip pattern (movies) ──────────────────────────── */
.film-pattern {
  background-image:
    linear-gradient(0deg,
      rgba(0,0,0,.5) 0px, rgba(0,0,0,.5) 18px,
      transparent 18px, transparent calc(100% - 18px),
      rgba(0,0,0,.5) calc(100% - 18px), rgba(0,0,0,.5) 100%
    ),
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 8px,
      rgba(255,255,255,.06) 8px, rgba(255,255,255,.06) 10px,
      transparent 10px, transparent 22px
    );
  background-size: 100% 100%, 24px 100%;
}

/* ── Scanline pattern (series) ────────────────────────────── */
.scan-pattern {
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(139,92,246,.04) 3px,
    rgba(139,92,246,.04) 4px
  );
}

/* ── Page lines pattern (books) ───────────────────────────── */
.page-pattern {
  background-image:
    repeating-linear-gradient(
      180deg,
      transparent 0px,
      transparent 22px,
      rgba(251,191,36,.05) 22px,
      rgba(251,191,36,.05) 23px
    ),
    linear-gradient(90deg,
      rgba(217,119,6,.12) 0px, rgba(217,119,6,.12) 3px,
      transparent 3px
    );
}

/* ── Transition ───────────────────────────────────────────── */
.section-banner-enter-active {
  transition: opacity .35s ease, transform .35s cubic-bezier(.34,1.56,.64,1);
}
.section-banner-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.section-banner-enter-from { opacity: 0; transform: translateY(-8px) scale(.98); }
.section-banner-leave-to   { opacity: 0; transform: scale(.99); }
</style>
