<template>
  <Transition name="bg-fade">
    <div v-if="type" :key="type" class="bg-layer" aria-hidden="true">

      <!-- Ambient glow -->
      <div class="ambient" :class="ambientClass" />

      <!-- Floating particles -->
      <div
        v-for="p in particles"
        :key="p.id"
        class="particle"
        :class="iconColorClass"
        :style="(p.style as any)"
      >
        <component :is="p.icon" class="w-full h-full" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, Tv, Film, Clapperboard, Star } from 'lucide-vue-next'
import type { MediaType } from '@/types'

const props = defineProps<{ type: MediaType | null }>()

const PHI = 1.6180339887

const config: Record<MediaType, { icons: object[]; ambient: string; color: string }> = {
  book:   { icons: [BookOpen],                  ambient: 'ambient-amber',  color: 'text-amber-200'  },
  series: { icons: [Tv],                        ambient: 'ambient-violet', color: 'text-violet-200' },
  movie:  { icons: [Film, Clapperboard, Star],  ambient: 'ambient-blue',   color: 'text-blue-200'   },
}

const ambientClass   = computed(() => config[props.type!]?.ambient  ?? '')
const iconColorClass = computed(() => config[props.type!]?.color    ?? '')

const particles = computed(() => {
  if (!props.type) return []
  const icons = config[props.type].icons
  return Array.from({ length: 24 }, (_, i) => {
    const x    = (i * PHI * 100) % 100
    const size = 12 + (i % 6) * 7           // 12 → 47 px
    const dur  = 22 + (i % 9) * 4           // 22 → 54 s
    const delay = -((i * 3.7) % dur)        // pre-started, no blank start
    const op   = 0.028 + (i % 6) * 0.011   // 0.028 → 0.083
    const r0   = (i % 7 - 3) * 11          // −33 → 33 deg
    const r1   = r0 + (i % 2 ? 28 : -28)
    const dx   = (i % 5 - 2) * 40          // −80 → 80 px horizontal drift

    return {
      id: i,
      icon: icons[i % icons.length],
      style: {
        left: `${x}%`,
        width: `${size}px`,
        height: `${size}px`,
        '--r0': `${r0}deg`,
        '--r1': `${r1}deg`,
        '--op': op,
        '--dx': `${dx}px`,
        animationDuration: `${dur}s`,
        animationDelay:    `${delay}s`,
      },
    }
  })
})
</script>

<style scoped>
.bg-layer {
  position: fixed; inset: 0; z-index: 0;
  pointer-events: none; overflow: hidden;
}

/* ── Ambient glows ───────────────────────────────────────── */
.ambient { position: absolute; inset: 0; }

.ambient-amber {
  background:
    radial-gradient(ellipse at 8%  90%, rgba(180,83,9,.10)  0%, transparent 50%),
    radial-gradient(ellipse at 92% 80%, rgba(146,64,14,.07) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 95%, rgba(217,119,6,.05) 0%, transparent 60%);
}
.ambient-violet {
  background:
    radial-gradient(ellipse at 12% 88%, rgba(109,40,217,.11) 0%, transparent 50%),
    radial-gradient(ellipse at 88% 78%, rgba(79,70,229,.08)  0%, transparent 45%),
    radial-gradient(ellipse at 50% 95%, rgba(139,92,246,.05) 0%, transparent 60%);
}
.ambient-blue {
  background:
    radial-gradient(ellipse at 10% 85%, rgba(29,78,216,.11)  0%, transparent 50%),
    radial-gradient(ellipse at 90% 82%, rgba(67,56,202,.08)  0%, transparent 45%),
    radial-gradient(ellipse at 50% 95%, rgba(99,102,241,.05) 0%, transparent 60%);
}

/* ── Floating particles ──────────────────────────────────── */
.particle {
  position: absolute; bottom: -80px;
  animation-name: rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes rise {
  0%   { transform: translateY(0) translateX(0) rotate(var(--r0)); opacity: 0; }
  7%   { opacity: var(--op); }
  93%  { opacity: var(--op); }
  100% { transform: translateY(-110vh) translateX(var(--dx)) rotate(var(--r1)); opacity: 0; }
}

/* ── Theme transitions ───────────────────────────────────── */
.bg-fade-enter-active { transition: opacity .7s ease; }
.bg-fade-leave-active { transition: opacity .4s ease; }
.bg-fade-enter-from, .bg-fade-leave-to { opacity: 0; }
</style>
