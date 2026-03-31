<template>
  <Transition name="bg-fade">
    <div v-if="type" :key="type" class="bg-layer" aria-hidden="true">

      <!-- Ambient glow -->
      <div class="ambient" :class="ambientClass" />

      <!-- Floating particles (pure CSS, no SVG components) -->
      <div
        v-for="p in particles"
        :key="p.id"
        class="particle"
        :class="colorClass"
        :style="(p.style as any)"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MediaType } from '@/types'

const props = defineProps<{ type: MediaType | null }>()

const PHI = 1.6180339887

const config: Record<MediaType, { ambient: string; color: string }> = {
  book:   { ambient: 'ambient-amber',  color: 'dot-amber'  },
  series: { ambient: 'ambient-violet', color: 'dot-violet' },
  movie:  { ambient: 'ambient-blue',   color: 'dot-blue'   },
}

const ambientClass = computed(() => config[props.type!]?.ambient ?? '')
const colorClass   = computed(() => config[props.type!]?.color   ?? '')

const particles = computed(() => {
  if (!props.type) return []
  return Array.from({ length: 8 }, (_, i) => {
    const x     = (i * PHI * 100) % 100
    const size  = 6 + (i % 4) * 5              // 6 → 21 px
    const dur   = 28 + (i % 5) * 5             // 28 → 48 s
    const delay = -((i * 4.7) % dur)
    const op    = 0.06 + (i % 4) * 0.04        // 0.06 → 0.18
    const dx    = (i % 5 - 2) * 40             // −80 → 80 px

    return {
      id: i,
      style: {
        left:              `${x}%`,
        width:             `${size}px`,
        height:            `${size}px`,
        '--op':            op,
        '--dx':            `${dx}px`,
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

/* ── Floating dots ───────────────────────────────────────── */
.particle {
  position: absolute;
  bottom: -60px;
  border-radius: 50%;
  animation-name: rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.dot-amber  { background: rgba(217,119,6,1);  }
.dot-violet { background: rgba(139,92,246,1); }
.dot-blue   { background: rgba(99,102,241,1); }

@keyframes rise {
  0%   { transform: translateY(0)       translateX(0)       scale(1);    opacity: 0; }
  8%   { opacity: var(--op); }
  92%  { opacity: var(--op); }
  100% { transform: translateY(-110vh)  translateX(var(--dx)) scale(.6); opacity: 0; }
}

/* ── Theme transitions ───────────────────────────────────── */
.bg-fade-enter-active { transition: opacity .7s ease; }
.bg-fade-leave-active { transition: opacity .4s ease; }
.bg-fade-enter-from, .bg-fade-leave-to { opacity: 0; }
</style>
