<template>
  <div>
    <!-- Actividad reciente -->
    <Transition name="fade-down">
      <section
        v-if="activitySummary.recentTotal > 0"
        class="mb-6 rounded-2xl border border-sky-500/20 bg-sky-500/8 p-4 sm:p-5"
      >
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <p class="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">Actividad reciente</p>
            <p class="text-sm text-gray-300">
              Has registrado {{ activitySummary.recentTotal }} eventos en los últimos 7 días.
            </p>
          </div>
          <button
            @click="$emit('open-tool', 'stats')"
            class="hidden sm:inline-flex items-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/15 transition-colors"
          >
            <BarChart2 class="w-3.5 h-3.5" />
            Ver estadísticas
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300">
            {{ activitySummary.recentTotal }} esta semana
          </span>
          <span class="rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-xs text-gray-300">
            {{ activitySummary.total }} en total
          </span>
          <span
            v-for="item in activitySummary.topTitles"
            :key="item.id"
            class="rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-xs text-gray-300"
          >
            {{ item.title }} · {{ item.count }}
          </span>
        </div>
      </section>
    </Transition>

    <!-- Qué ver ahora -->
    <Transition name="fade-down">
      <section
        v-if="recommendedNow.length"
        class="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 sm:p-5"
      >
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Qué ver ahora</p>
            <p class="text-sm text-gray-300">Sugerencias ordenadas por tu actividad, cola y estado actual.</p>
          </div>
          <button
            @click="$emit('open-tool', 'discover')"
            class="hidden sm:inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/15 transition-colors"
          >
            <Sparkles class="w-3.5 h-3.5" />
            Descubrir más
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <button
            v-for="item in recommendedNow"
            :key="item.$id"
            @click="$emit('open-detail', item)"
            class="group flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-3 text-left transition-all hover:border-emerald-400/35 hover:bg-white/5"
          >
            <div class="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
              <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-lg">
                {{ item.type === 'series' ? '📺' : item.type === 'book' ? '📚' : '🎬' }}
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-semibold text-white truncate group-hover:text-emerald-200 transition-colors">{{ item.title }}</p>
                <span class="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{{ item.reason }}</span>
              </div>
              <p class="mt-1 text-xs text-gray-400">
                {{ item.subtitle }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span v-if="item.year">{{ item.year }}</span>
                <span v-if="item.rating">★ {{ item.rating.toFixed(1) }}</span>
                <span class="capitalize">{{ item.type }}</span>
              </div>
            </div>
          </button>
        </div>
      </section>
    </Transition>

    <!-- Siguiente a ver banner -->
    <Transition name="fade-down">
      <div
        v-if="nextInQueue"
        class="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/25 hover:border-violet-400/40 transition-colors"
      >
        <div class="w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <img v-if="nextInQueue.cover_url" :src="nextInQueue.cover_url" :alt="nextInQueue.title" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-lg">
            {{ nextInQueue.type === 'series' ? '📺' : nextInQueue.type === 'book' ? '📚' : '🎬' }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">Siguiente a ver</p>
          <p class="text-sm font-semibold text-white truncate">{{ nextInQueue.title }}</p>
          <p v-if="nextInQueue.year" class="text-xs text-gray-500 mt-0.5">{{ nextInQueue.year }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="$emit('open-detail', nextInQueue)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-violet-500/40 text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            Ver detalle
          </button>
          <button
            @click="$emit('remove-from-queue', nextInQueue.$id)"
            class="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
            title="Saltar de la cola"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Continuar viendo banner -->
    <Transition name="fade-down">
      <div
        v-if="recentMedia && recentMedia.$id !== nextInQueue?.$id"
        class="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 hover:border-amber-400/40 transition-colors"
      >
        <div class="w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <img v-if="recentMedia.cover_url" :src="recentMedia.cover_url" :alt="recentMedia.title" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-lg">
            {{ recentMedia.type === 'series' ? '📺' : recentMedia.type === 'book' ? '📚' : '🎬' }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">Continuar viendo</p>
          <p class="text-sm font-semibold text-white truncate">{{ recentMedia.title }}</p>
          <p v-if="recentMedia.status === 'watching' && recentMedia.type === 'series'" class="text-xs text-gray-500 mt-0.5">
            T{{ recentMedia.current_season }} E{{ recentMedia.current_episode }}
          </p>
          <p v-else class="text-xs text-gray-500 mt-0.5">{{ recentMedia.status === 'watching' ? 'Viendo' : recentMedia.status === 'pending' ? 'Por empezar' : 'Completado' }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="$emit('open-detail', recentMedia)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            Retomar
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Sparkles, BarChart2, X } from 'lucide-vue-next'
import type { Media } from '@/types'

type ActivityTitle = { id: string; title: string; count: number }
type SuggestedNowItem = Media & { reason: string; subtitle: string; score: number }
type ActivitySummary = { recentTotal: number; total: number; topTitles: ActivityTitle[] }

defineProps<{
  activitySummary: ActivitySummary
  recommendedNow: SuggestedNowItem[]
  nextInQueue: Media | null
  recentMedia: Media | null
}>()

defineEmits<{
  'open-tool': [tool: 'discover' | 'stats']
  'open-detail': [media: Media]
  'remove-from-queue': [id: string]
}>()
</script>