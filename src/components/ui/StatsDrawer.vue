<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="$emit('update:modelValue', false)" />
    </Transition>

    <Transition name="drawer">
      <div v-if="modelValue" class="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-900 border-l border-white/10 z-50 flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <BarChart2 class="w-5 h-5 text-violet-400" />
            <h2 class="text-lg font-semibold text-white">Mis estadísticas</h2>
          </div>
          <button @click="$emit('update:modelValue', false)" class="btn-ghost p-2 rounded-xl">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          <!-- ── Totales ─────────────────────────────────────── -->
          <div class="grid grid-cols-3 gap-3">
            <TotalCard emoji="🎬" label="Películas" :count="byType.movie"  color="from-blue-500/15 border-blue-500/20 text-blue-300" />
            <TotalCard emoji="📺" label="Series"    :count="byType.series" color="from-violet-500/15 border-violet-500/20 text-violet-300" />
            <TotalCard emoji="📚" label="Libros"    :count="byType.book"   color="from-amber-500/15 border-amber-500/20 text-amber-300" />
          </div>

          <!-- ── Por estado ──────────────────────────────────── -->
          <div>
            <SectionTitle>Por estado</SectionTitle>
            <div class="space-y-3">
              <StatusRow label="Visto"      :count="byStatus.watched"  :total="total" dot="bg-emerald-400" bar="bg-emerald-500" />
              <StatusRow label="Viendo"    :count="byStatus.watching" :total="total" dot="bg-blue-400"    bar="bg-blue-500" />
              <StatusRow label="Pendiente" :count="byStatus.pending"  :total="total" dot="bg-amber-400"   bar="bg-amber-500" />
              <StatusRow v-if="byStatus.dropped" label="Abandonado" :count="byStatus.dropped" :total="total" dot="bg-red-400" bar="bg-red-500" />
            </div>
          </div>

          <!-- ── Valoración media ────────────────────────────── -->
          <div v-if="anyRated">
            <SectionTitle>Valoración media</SectionTitle>
            <div class="grid grid-cols-3 gap-3">
              <RatingCard
                v-for="r in ratingsByType"
                :key="r.type"
                :label="r.label"
                :avg="r.avg"
                :rated="r.rated"
                :total="r.total"
              />
            </div>
          </div>

          <!-- ── Perfil de géneros ──────────────────────────── -->
          <div v-if="topGenres.length">
            <SectionTitle>Histograma de géneros</SectionTitle>
            <div class="space-y-2.5">
              <div
                v-for="(g, i) in topGenres"
                :key="g.genre"
                class="space-y-1"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="flex items-center gap-1.5 text-gray-300 font-medium">
                    <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: genreColors[i % genreColors.length] }" />
                    {{ g.genre }}
                  </span>
                  <span class="text-gray-500 tabular-nums">{{ g.count }} <span class="text-gray-600">({{ g.pct }}%)</span></span>
                </div>
                <div class="h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :style="{ width: g.pct + '%', background: genreColors[i % genreColors.length] }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Análisis de Plataformas ──────────────────── -->
          <div v-if="platformStats.length">
            <SectionTitle>Distribuición por plataforma</SectionTitle>
            <div class="space-y-2">
              <div
                v-for="p in platformStats"
                :key="p.platform"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/5"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white">{{ p.platform || 'Sin plataforma' }}</p>
                  <p class="text-xs text-gray-500">{{ p.count }} títulos</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-violet-300">{{ p.pct }}%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Tendencias Temporales ──────────────────────── -->
          <div v-if="yearlyTrends.length > 1">
            <SectionTitle>Tendencias por año</SectionTitle>
            <div class="bg-white/3 rounded-xl p-4 border border-white/5">
              <div class="space-y-3">
                <div v-for="t in yearlyTrends" :key="t.year" class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-300 font-medium">{{ t.year }}</span>
                    <span class="text-gray-500">{{ t.count }} <span class="text-gray-600">títulos</span></span>
                  </div>
                  <div class="h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700"
                      :style="{ width: (t.count / maxYearCount * 100) + '%' }"
                    />
                  </div>
                </div>
              </div>
              <p class="text-[10px] text-gray-600 mt-3 text-center">Consumo acumulado por año</p>
            </div>
          </div>

          <!-- ── Actualidad de Contenido ──────────────────── -->
          <div v-if="total > 0">
            <SectionTitle>Actualidad del contenido</SectionTitle>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <p class="text-xs text-blue-300 mb-1">Estreno promedio</p>
                <p class="text-2xl font-extrabold text-blue-100">{{ avgYearReleased ?? '—' }}</p>
                <p class="text-[10px] text-blue-400 mt-0.5">años desde el estreno</p>
              </div>
              <div class="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
                <p class="text-xs text-violet-300 mb-1">Más reciente</p>
                <p class="text-2xl font-extrabold text-violet-100">{{ mostRecentYear ?? '—' }}</p>
                <p class="text-[10px] text-violet-400 mt-0.5">año de estreno</p>
              </div>
            </div>
          </div>

          <!-- ── Tasa de completado ──────────────────────────── -->
          <div v-if="total > 0">
            <SectionTitle>Completado</SectionTitle>
            <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
              <div class="flex items-end justify-between mb-3">
                <div>
                  <p class="text-4xl font-extrabold text-white">{{ completionPct }}<span class="text-2xl text-gray-400">%</span></p>
                  <p class="text-gray-400 text-sm mt-1">{{ byStatus.watched }} de {{ total }} títulos vistos</p>
                </div>
                <CheckCircle2 class="w-10 h-10 text-emerald-400 opacity-60" />
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                  :style="`width:${completionPct}%`"
                />
              </div>
            </div>
          </div>

          <!-- ── Resumen por año ────────────────────────────── -->
          <div v-if="availableYears.length > 0">
            <SectionTitle>Resumen por año</SectionTitle>

            <!-- Year selector -->
            <div class="flex flex-wrap gap-1.5 mb-4">
              <button
                v-for="year in availableYears"
                :key="year"
                @click="selectedYear = selectedYear === year ? null : year"
                class="px-3 py-1 rounded-lg text-xs font-bold border transition-all"
                :class="selectedYear === year
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                  : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'"
              >
                {{ year }}
              </button>
            </div>

            <!-- Year detail -->
            <div v-if="selectedYear !== null && yearItems.length > 0" class="space-y-3">

              <!-- Counts by type -->
              <div class="grid grid-cols-3 gap-2">
                <div class="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3 text-center">
                  <p class="text-xl font-extrabold text-white">{{ yearByType.movie }}</p>
                  <p class="text-[10px] text-gray-500 mt-0.5">🎬 Películas</p>
                </div>
                <div class="bg-violet-500/8 border border-violet-500/20 rounded-xl p-3 text-center">
                  <p class="text-xl font-extrabold text-white">{{ yearByType.series }}</p>
                  <p class="text-[10px] text-gray-500 mt-0.5">📺 Series</p>
                </div>
                <div class="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-center">
                  <p class="text-xl font-extrabold text-white">{{ yearByType.book }}</p>
                  <p class="text-[10px] text-gray-500 mt-0.5">📚 Libros</p>
                </div>
              </div>

              <!-- Avg rating + top genre -->
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-white/5 border border-white/5 rounded-xl p-3">
                  <p class="text-[10px] text-gray-500 mb-1">Nota media</p>
                  <p class="text-2xl font-extrabold text-white leading-none">
                    {{ yearAvgRating ?? '—' }}<span class="text-sm text-gray-500 ml-0.5">/10</span>
                  </p>
                </div>
                <div class="bg-white/5 border border-white/5 rounded-xl p-3">
                  <p class="text-[10px] text-gray-500 mb-1">Género favorito</p>
                  <p class="text-sm font-semibold text-white truncate">{{ yearTopGenre ?? '—' }}</p>
                </div>
              </div>

              <!-- Monthly activity chart -->
              <div class="bg-white/3 rounded-xl p-4 border border-white/5">
                <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Actividad mensual</p>
                <div class="flex items-end gap-0.5 h-14">
                  <div
                    v-for="(count, i) in monthlyData"
                    :key="i"
                    class="flex-1 flex flex-col items-center gap-1 min-w-0"
                  >
                    <div
                      class="w-full rounded-t transition-all duration-500"
                      :class="count > 0 ? 'bg-violet-500/70' : 'bg-white/6'"
                      :style="{ height: count > 0 ? Math.max(4, Math.round(count / maxMonth * 44)) + 'px' : '3px' }"
                    />
                    <span class="text-[8px] text-gray-600 leading-none">{{ MONTH_LABELS[i] }}</span>
                  </div>
                </div>
              </div>

              <!-- Top 3 rated that year -->
              <div v-if="yearTopRated.length">
                <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Mejores del año</p>
                <div class="space-y-1.5">
                  <div
                    v-for="(item, i) in yearTopRated"
                    :key="item.$id"
                    class="flex items-center gap-3 p-2.5 rounded-xl bg-white/4 border border-white/5"
                  >
                    <span class="text-base leading-none shrink-0">{{ ['🥇','🥈','🥉'][i] }}</span>
                    <div class="w-7 h-9 rounded-md overflow-hidden shrink-0 border border-white/8">
                      <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
                      <div v-else class="w-full h-full flex items-center justify-center text-xs">
                        {{ item.type === 'movie' ? '🎬' : item.type === 'series' ? '📺' : '📚' }}
                      </div>
                    </div>
                    <p class="text-sm text-white font-medium flex-1 min-w-0 truncate">{{ item.title }}</p>
                    <span class="text-xs font-bold text-amber-400 shrink-0">★ {{ item.rating }}</span>
                  </div>
                </div>
              </div>

            </div>

            <p v-else-if="selectedYear !== null" class="text-xs text-gray-500 text-center py-3">
              Sin títulos terminados en {{ selectedYear }}
            </p>
          </div>

          <!-- ── Actividad reciente ──────────────────────────── -->
          <div v-if="recentActivity.length">
            <SectionTitle>Actividad reciente</SectionTitle>
            <div class="space-y-2">
              <div
                v-for="item in recentActivity"
                :key="item.$id"
                class="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/5"
              >
                <div class="w-8 h-11 rounded-lg overflow-hidden shrink-0 border border-white/5">
                  <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
                  <div v-else class="w-full h-full flex items-center justify-center text-[16px]">
                    {{ item.type === 'movie' ? '🎬' : item.type === 'series' ? '📺' : '📚' }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ item.title }}</p>
                  <p class="text-xs text-gray-500">{{ relativeTime(item.$updatedAt) }}</p>
                </div>
                <span
                  class="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  :class="{
                    'bg-blue-500/10 text-blue-300':       item.status === 'watching',
                    'bg-amber-500/10 text-amber-300':     item.status === 'pending',
                    'bg-emerald-500/10 text-emerald-300': item.status === 'watched',
                    'bg-red-500/10 text-red-300':         item.status === 'dropped',
                  }"
                >{{ { watching: 'Viendo', watched: 'Visto', pending: 'Pendiente', dropped: 'Abandonado' }[item.status] }}</span>
              </div>
            </div>
          </div>

          <!-- ── Logros ──────────────────────────────────── -->
          <div>
            <SectionTitle>Logros</SectionTitle>
            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="a in ACHIEVEMENTS"
                :key="a.id"
                class="flex items-center gap-3 p-3 rounded-xl border transition-colors"
                :class="unlockedIds.has(a.id)
                  ? 'bg-violet-500/10 border-violet-500/25'
                  : 'bg-white/3 border-white/5 opacity-50'"
              >
                <span class="text-2xl leading-none shrink-0">{{ a.emoji }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white">{{ a.name }}</p>
                  <p class="text-[11px] text-gray-500 truncate">{{ a.description }}</p>
                </div>
                <span v-if="unlockedIds.has(a.id)" class="shrink-0 text-[10px] font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-full">
                  ✓
                </span>
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="total === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <Inbox class="w-12 h-12 text-gray-700 mb-4" />
            <p class="text-gray-500">Añade contenido para ver tus estadísticas</p>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, BarChart2, CheckCircle2, Inbox } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { ACHIEVEMENTS, getUnlockedIds } from '@/composables/useAchievements'

/* ── Sub-components (inline for simplicity) ──────────────── */
import { defineComponent, h } from 'vue'

const TotalCard = defineComponent({
  props: ['emoji', 'label', 'count', 'color'],
  setup(p) {
    return () => h('div', { class: `flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-b border p-4 ${p.color}` }, [
      h('span', { class: 'text-2xl' }, p.emoji),
      h('span', { class: 'text-2xl font-extrabold text-white' }, p.count),
      h('span', { class: 'text-xs font-medium opacity-70' }, p.label),
    ])
  },
})

const SectionTitle = defineComponent({
  setup(_, { slots }) {
    return () => h('h3', { class: 'text-xs font-bold uppercase tracking-widest text-gray-500 mb-3' }, slots.default?.())
  },
})

const StatusRow = defineComponent({
  props: ['label', 'count', 'total', 'dot', 'bar'],
  setup(p) {
    const pct = computed(() => p.total ? Math.round((p.count / p.total) * 100) : 0)
    return () => h('div', { class: 'space-y-1.5' }, [
      h('div', { class: 'flex items-center justify-between text-sm' }, [
        h('span', { class: 'flex items-center gap-2 text-gray-300' }, [
          h('span', { class: `w-2 h-2 rounded-full ${p.dot}` }),
          p.label,
        ]),
        h('span', { class: 'text-gray-400 font-medium' }, `${p.count} (${pct.value}%)`),
      ]),
      h('div', { class: 'h-1.5 rounded-full bg-white/8 overflow-hidden' }, [
        h('div', { class: `h-full rounded-full ${p.bar} transition-all duration-700`, style: `width:${pct.value}%` }),
      ]),
    ])
  },
})

const RatingCard = defineComponent({
  props: ['label', 'avg', 'rated', 'total'],
  setup(p) {
    return () => h('div', { class: 'bg-white/5 rounded-xl p-3 border border-white/5 text-center' }, [
      h('p', { class: 'text-xs text-gray-500 mb-1' }, p.label),
      p.avg
        ? h('p', { class: 'text-xl font-extrabold text-white' }, [
            p.avg,
            h('span', { class: 'text-sm text-gray-500 ml-0.5' }, '/10'),
          ])
        : h('p', { class: 'text-lg text-gray-600' }, '—'),
      h('p', { class: 'text-[10px] text-gray-600 mt-1' }, `${p.rated} valorados`),
    ])
  },
})

/* ── Store + computed stats ───────────────────────────────── */
defineEmits<{ 'update:modelValue': [v: boolean] }>()
defineProps<{ modelValue: boolean }>()

const media = useMediaStore()

const unlockedIds = computed(() => getUnlockedIds())

const total = computed(() => media.all.length)

const byType = computed(() => ({
  movie:  media.all.filter(m => m.type === 'movie').length,
  series: media.all.filter(m => m.type === 'series').length,
  book:   media.all.filter(m => m.type === 'book').length,
}))

const byStatus = computed(() => ({
  watched:  media.all.filter(m => m.status === 'watched').length,
  watching: media.all.filter(m => m.status === 'watching').length,
  pending:  media.all.filter(m => m.status === 'pending').length,
  dropped:  media.all.filter(m => m.status === 'dropped').length,
}))

const completionPct = computed(() =>
  total.value ? Math.round((byStatus.value.watched / total.value) * 100) : 0
)

const anyRated = computed(() => media.all.some(m => m.rating))

const ratingsByType = computed(() => (
  [
    { type: 'movie',  label: '🎬 Películas' },
    { type: 'series', label: '📺 Series' },
    { type: 'book',   label: '📚 Libros' },
  ] as const
).map(({ type, label }) => {
  const items = media.all.filter(m => m.type === type)
  const rated = items.filter(m => m.rating)
  const avg   = rated.length ? (rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length).toFixed(1) : null
  return { type, label, avg, rated: rated.length, total: items.length }
}))

const topGenres = computed(() => {
  const map = new Map<string, number>()
  for (const m of media.all) {
    if (!m.genre) continue
    for (const g of m.genre.split(',').map(s => s.trim()).filter(Boolean))
      map.set(g, (map.get(g) ?? 0) + 1)
  }
  const sorted = [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  const max = sorted[0]?.[1] ?? 1
  return sorted.map(([genre, count]) => ({
    genre,
    count,
    pct: Math.round((count / max) * 100),
  }))
})

const genreColors = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4',
  '#10b981', '#f59e0b', '#f97316', '#ef4444',
  '#ec4899', '#a855f7',
]

const recentActivity = computed(() =>
  [...media.all]
    .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
    .slice(0, 8)
)

// ── Year in Review ─────────────────────────────────────────

const MONTH_LABELS = ['E','F','M','A','M','J','J','A','S','O','N','D']

const selectedYear = ref<number | null>(null)

const availableYears = computed(() => {
  const years = new Set<number>()
  for (const m of media.all) {
    if (m.finished_at) years.add(new Date(m.finished_at).getFullYear())
  }
  return [...years].sort((a, b) => b - a)
})

const yearItems = computed(() => {
  if (selectedYear.value === null) return []
  return media.all.filter(m => {
    if (!m.finished_at) return false
    return new Date(m.finished_at).getFullYear() === selectedYear.value
  })
})

const yearByType = computed(() => ({
  movie:  yearItems.value.filter(m => m.type === 'movie').length,
  series: yearItems.value.filter(m => m.type === 'series').length,
  book:   yearItems.value.filter(m => m.type === 'book').length,
}))

const yearAvgRating = computed(() => {
  const rated = yearItems.value.filter(m => m.rating)
  if (!rated.length) return null
  return (rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length).toFixed(1)
})

const yearTopGenre = computed(() => {
  const map = new Map<string, number>()
  for (const m of yearItems.value) {
    if (!m.genre) continue
    for (const g of m.genre.split(',').map(s => s.trim()).filter(Boolean))
      map.set(g, (map.get(g) ?? 0) + 1)
  }
  if (!map.size) return null
  return [...map.entries()].sort(([, a], [, b]) => b - a)[0][0]
})

const monthlyData = computed(() => {
  const months = Array(12).fill(0) as number[]
  for (const m of yearItems.value) {
    if (m.finished_at) months[new Date(m.finished_at).getMonth()]++
  }
  return months
})

const maxMonth = computed(() => Math.max(...monthlyData.value, 1))

const yearTopRated = computed(() =>
  [...yearItems.value]
    .filter(m => m.rating)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3)
)

const platformStats = computed(() => {
  const map = new Map<string | null, number>()
  for (const m of media.all) {
    const platform = m.platform || null
    map.set(platform, (map.get(platform) ?? 0) + 1)
  }
  const sorted = [...map.entries()]
    .sort(([, a], [, b]) => b - a)
  const max = sorted[0]?.[1] ?? 1
  return sorted.map(([platform, count]) => ({
    platform,
    count,
    pct: Math.round((count / max) * 100),
  }))
})

const yearlyTrends = computed(() => {
  const map = new Map<number, number>()
  for (const m of media.all) {
    if (!m.year) continue
    map.set(m.year, (map.get(m.year) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }))
})

const maxYearCount = computed(() => {
  const counts = yearlyTrends.value.map(t => t.count)
  return Math.max(...counts, 1)
})

const avgYearReleased = computed(() => {
  const withYear = media.all.filter(m => m.year)
  if (!withYear.length) return null
  const now = new Date().getFullYear()
  const avgAge = withYear.reduce((sum, m) => sum + (now - (m.year ?? now)), 0) / withYear.length
  return Math.round(avgAge)
})

const mostRecentYear = computed(() => {
  const years = media.all
    .filter(m => m.year)
    .map(m => m.year)
    .sort((a, b) => (b ?? 0) - (a ?? 0))
  return years[0] ?? null
})

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'Ahora mismo'
  if (min < 60)  return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)    return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)     return `Hace ${d}d`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
</script>
