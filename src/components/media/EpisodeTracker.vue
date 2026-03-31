<template>
  <!-- No season data configured -->
  <div v-if="!hasSeasonsData" class="flex flex-col items-center gap-2 bg-white/4 rounded-xl p-5 border border-white/8 text-center">
    <Tv2 class="w-7 h-7 text-gray-600" />
    <p class="text-xs text-gray-500 leading-relaxed">
      Edita la serie y añade el número de temporadas y episodios para activar el seguimiento detallado.
    </p>
  </div>

  <div v-else class="space-y-4">

    <!-- Overall progress bar -->
    <div>
      <div class="flex items-center justify-between text-xs mb-1.5">
        <span class="text-gray-400">{{ totalWatchedCount }} / {{ totalEps }} episodios vistos</span>
        <span class="font-bold text-violet-400">{{ overallPct }}%</span>
      </div>
      <div class="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-500"
          :style="{ width: overallPct + '%' }"
        />
      </div>
    </div>

    <!-- Season tabs -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="s in totalSeasons!"
        :key="s"
        @click="activeSeason = s"
        class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
        :class="activeSeason === s
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
          : watchedInSeason(s) >= epsInSeason(s)
            ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300'
            : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
      >
        T{{ s }}
        <span class="opacity-60 text-[9px] ml-0.5">{{ watchedInSeason(s) }}/{{ epsInSeason(s) }}</span>
      </button>
    </div>

    <!-- Episode grid for active season -->
    <div>
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-xs font-semibold text-gray-300">Temporada {{ activeSeason }}</span>
        <div class="flex gap-3">
          <button
            @click="doMarkComplete"
            class="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
          >
            Marcar completa
          </button>
          <button
            @click="doClearSeason"
            class="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div class="grid grid-cols-10 gap-1">
        <button
          v-for="ep in epsInSeason(activeSeason)"
          :key="ep"
          @click="doToggle(activeSeason, ep)"
          class="aspect-square rounded-md text-[10px] font-bold flex items-center justify-center border transition-all duration-100 active:scale-90 select-none"
          :class="isWatched(activeSeason, ep)
            ? 'bg-violet-500/70 border-violet-400/40 text-white hover:bg-violet-500'
            : 'bg-white/5 border-white/8 text-gray-600 hover:bg-white/10 hover:text-gray-300'"
          :title="`Episodio ${ep}`"
        >
          {{ ep }}
        </button>
      </div>

      <!-- Season complete indicator -->
      <Transition name="fade">
        <div v-if="watchedInSeason(activeSeason) >= epsInSeason(activeSeason)" class="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
          <CheckCircle2 class="w-3.5 h-3.5" />
          Temporada {{ activeSeason }} completada
        </div>
      </Transition>
    </div>

    <!-- Progress notes if any -->
    <p v-if="progress?.notes" class="text-xs text-gray-500 italic border-t border-white/5 pt-3">
      {{ progress.notes }}
    </p>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckCircle2, Tv2 } from 'lucide-vue-next'
import type { Media, Progress } from '@/types'
import {
  getWatched,
  toggleEpisode,
  markSeasonComplete,
  clearSeason,
} from '@/lib/episodeTracker'

const props = defineProps<{
  media:    Media
  progress: Progress | null
}>()

const activeSeason = ref(props.progress?.current_season ?? props.media.current_season ?? 1)

// Reactive snapshot — refreshed after every mutation
const watched = ref<Record<string, number[]>>(getWatched(props.media.$id))

watch(() => props.media.$id, (id) => {
  watched.value      = getWatched(id)
  activeSeason.value = props.progress?.current_season ?? props.media.current_season ?? 1
})

function refresh() {
  watched.value = { ...getWatched(props.media.$id) }
}

// ── Helpers ────────────────────────────────────────────────

// total_seasons/total_episodes live in COLL_PROGRESS, not COLL_MEDIA
const totalSeasons  = computed(() => props.progress?.total_seasons  ?? null)
const totalEpisodes = computed(() => props.progress?.total_episodes ?? null)

const hasSeasonsData = computed(() =>
  !!(totalSeasons.value && totalSeasons.value > 0)
)

/** Episodes per season — total_episodes stores eps/season, not grand total */
function epsInSeason(_s: number): number {
  return totalEpisodes.value ?? 10
}

const totalEps = computed(() => {
  const eps     = totalEpisodes.value ?? 10
  const seasons = totalSeasons.value  ?? 0
  return seasons * eps
})

function isWatched(season: number, ep: number): boolean {
  return (watched.value[String(season)] ?? []).includes(ep)
}

function watchedInSeason(season: number): number {
  return (watched.value[String(season)] ?? []).length
}

const totalWatchedCount = computed(() =>
  Object.values(watched.value).reduce((s, eps) => s + eps.length, 0)
)

const overallPct = computed(() => {
  if (!totalEps.value) return 0
  return Math.min(100, Math.round((totalWatchedCount.value / totalEps.value) * 100))
})

// ── Actions ────────────────────────────────────────────────

function doToggle(season: number, ep: number) {
  toggleEpisode(props.media.$id, season, ep)
  refresh()
}

function doMarkComplete() {
  markSeasonComplete(props.media.$id, activeSeason.value, epsInSeason(activeSeason.value))
  refresh()
}

function doClearSeason() {
  clearSeason(props.media.$id, activeSeason.value)
  refresh()
}
</script>

<style scoped>
.fade-enter-active { transition: opacity .2s ease; }
.fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
