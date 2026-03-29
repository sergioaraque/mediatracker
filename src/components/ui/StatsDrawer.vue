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
              <StatusRow label="Visto"     :count="byStatus.watched"  :total="total" dot="bg-emerald-400" bar="bg-emerald-500" />
              <StatusRow label="Viendo"    :count="byStatus.watching" :total="total" dot="bg-blue-400"    bar="bg-blue-500" />
              <StatusRow label="Pendiente" :count="byStatus.pending"  :total="total" dot="bg-amber-400"   bar="bg-amber-500" />
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

          <!-- ── Top géneros ─────────────────────────────────── -->
          <div v-if="topGenres.length">
            <SectionTitle>Géneros</SectionTitle>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="g in topGenres"
                :key="g.genre"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
              >
                {{ g.genre }}
                <span class="text-xs text-gray-500 font-bold">{{ g.count }}</span>
              </span>
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
                    'bg-blue-500/10 text-blue-300':    item.status === 'watching',
                    'bg-amber-500/10 text-amber-300':  item.status === 'pending',
                    'bg-emerald-500/10 text-emerald-300': item.status === 'watched',
                  }"
                >{{ item.status === 'watching' ? 'Viendo' : item.status === 'watched' ? 'Visto' : 'Pendiente' }}</span>
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
import { computed } from 'vue'
import { X, BarChart2, CheckCircle2, Inbox } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'

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
  return [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([genre, count]) => ({ genre, count }))
})

const recentActivity = computed(() =>
  [...media.all]
    .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
    .slice(0, 8)
)

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
