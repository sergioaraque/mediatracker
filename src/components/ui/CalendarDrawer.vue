<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        @click="$emit('update:modelValue', false)"
      />
    </Transition>

    <Transition name="drawer">
      <div v-if="modelValue" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-900 border-l border-white/10 z-50 flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <CalendarDays class="w-5 h-5 text-violet-400" />
            <h2 class="text-lg font-semibold text-white">Historial</h2>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1 bg-white/5 rounded-xl px-2 py-1">
              <button @click="year--" class="p-1 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft class="w-3.5 h-3.5" />
              </button>
              <span class="text-sm font-bold text-white w-10 text-center">{{ year }}</span>
              <button
                @click="year++"
                :disabled="year >= currentYear"
                class="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
            <button @click="$emit('update:modelValue', false)" class="btn-ghost p-2 rounded-xl">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Year summary -->
        <div class="px-6 py-3 border-b border-white/5 flex items-center gap-5 shrink-0 text-sm">
          <div class="flex items-center gap-1.5">
            <Trophy class="w-4 h-4 text-amber-400" />
            <span class="text-white font-bold">{{ yearStats.total }}</span>
            <span class="text-gray-400">vistos en {{ year }}</span>
          </div>
          <div v-if="yearStats.total > 0" class="flex items-center gap-3 text-xs">
            <span v-if="yearStats.movies" class="text-blue-300">🎬 {{ yearStats.movies }}</span>
            <span v-if="yearStats.series" class="text-violet-300">📺 {{ yearStats.series }}</span>
            <span v-if="yearStats.books"  class="text-amber-300">📚 {{ yearStats.books }}</span>
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="flex-1 overflow-y-auto px-4 py-4">
          <div v-if="yearStats.total === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays class="w-12 h-12 text-gray-700 mb-4" />
            <p class="text-gray-500 text-sm">Sin registros de visionado en {{ year }}</p>
            <p class="text-gray-600 text-xs mt-1">Los títulos marcados como "Visto" aparecerán aquí</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="month in 12"
              :key="month"
              class="rounded-2xl p-3 border transition-colors"
              :class="hasItemsInMonth(month)
                ? 'bg-white/4 border-violet-500/20'
                : 'bg-white/2 border-white/5 opacity-40'"
            >
              <!-- Month name -->
              <p
                class="text-[11px] font-bold uppercase tracking-widest mb-2"
                :class="hasItemsInMonth(month) ? 'text-violet-300' : 'text-gray-600'"
              >{{ monthName(month) }}</p>

              <!-- Weekday headers -->
              <div class="grid grid-cols-7 mb-0.5">
                <span
                  v-for="d in WEEKDAYS"
                  :key="d"
                  class="text-[9px] text-gray-600 text-center font-medium"
                >{{ d }}</span>
              </div>

              <!-- Day cells -->
              <div class="grid grid-cols-7 gap-px">
                <div
                  v-for="(day, i) in calendarDays(month)"
                  :key="i"
                  class="aspect-square flex flex-col items-center justify-center text-[10px] rounded relative"
                  :class="day ? getDayClasses(month, day) : ''"
                  @click="day && getDayItems(month, day).length && selectDay(month, day)"
                >
                  <span v-if="day">{{ day }}</span>
                  <span
                    v-if="day && getDayItems(month, day).length"
                    class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    :class="getDotColor(month, day)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected day panel -->
        <Transition name="slide-up">
          <div
            v-if="selectedDay"
            class="shrink-0 border-t border-white/10 bg-gray-950 px-5 py-4 max-h-52 overflow-y-auto"
          >
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-semibold text-white capitalize">{{ formatSelectedDay }}</p>
              <button @click="selectedDay = null" class="text-gray-500 hover:text-white transition-colors">
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="item in selectedDayItems"
                :key="item.$id"
                class="flex items-center gap-3 p-2 rounded-xl bg-white/5"
              >
                <div class="w-7 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-sm">
                    {{ item.type === 'movie' ? '🎬' : item.type === 'series' ? '📺' : '📚' }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ item.title }}</p>
                  <p class="text-xs text-gray-500">{{ item.type === 'movie' ? 'Película' : item.type === 'series' ? 'Serie' : 'Libro' }}</p>
                </div>
                <div v-if="item.rating" class="flex items-center gap-1 text-amber-400 text-xs font-bold shrink-0">
                  <Star class="w-3 h-3 fill-current" />{{ item.rating }}
                </div>
              </div>
            </div>
          </div>
        </Transition>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, CalendarDays, ChevronLeft, ChevronRight, Trophy, Star } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import type { Media } from '@/types'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()

const media       = useMediaStore()
const currentYear = new Date().getFullYear()
const year        = ref(currentYear)

const WEEKDAYS    = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function monthName(month: number) { return MONTH_NAMES[month - 1] }

// Map from "YYYY-MM-DD" → Media[]
const byDay = computed(() => {
  const map = new Map<string, Media[]>()
  for (const m of media.all) {
    if (!m.finished_at) continue
    const key = m.finished_at.slice(0, 10)
    const arr = map.get(key)
    if (arr) arr.push(m)
    else map.set(key, [m])
  }
  return map
})

const yearStats = computed(() => {
  const items = media.all.filter(m => m.finished_at && new Date(m.finished_at).getFullYear() === year.value)
  return {
    total:  items.length,
    movies: items.filter(m => m.type === 'movie').length,
    series: items.filter(m => m.type === 'series').length,
    books:  items.filter(m => m.type === 'book').length,
  }
})

function hasItemsInMonth(month: number) {
  const prefix = `${year.value}-${String(month).padStart(2, '0')}-`
  for (const key of byDay.value.keys()) {
    if (key.startsWith(prefix)) return true
  }
  return false
}

function calendarDays(month: number): (number | null)[] {
  const firstDay = new Date(year.value, month - 1, 1).getDay()
  const total    = new Date(year.value, month, 0).getDate()
  const offset   = (firstDay + 6) % 7 // Monday = 0
  const cells: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
}

function dayKey(month: number, day: number) {
  return `${year.value}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDayItems(month: number, day: number) {
  return byDay.value.get(dayKey(month, day)) ?? []
}

const todayKey = new Date().toISOString().slice(0, 10)

function getDayClasses(month: number, day: number) {
  const key      = dayKey(month, day)
  const hasItems = (byDay.value.get(key)?.length ?? 0) > 0
  const isSelected = selectedDay.value === key
  const isToday    = key === todayKey

  if (isSelected) return 'bg-violet-500 text-white cursor-pointer font-bold'
  if (hasItems)   return 'text-white font-medium cursor-pointer hover:bg-white/15 bg-white/8'
  if (isToday)    return 'text-violet-400 ring-1 ring-inset ring-violet-500/40'
  return 'text-gray-700'
}

function getDotColor(month: number, day: number) {
  const items = getDayItems(month, day)
  const types = new Set(items.map(i => i.type))
  if (types.size > 1)      return 'bg-white/50'
  if (types.has('movie'))  return 'bg-blue-400'
  if (types.has('series')) return 'bg-violet-400'
  return 'bg-amber-400'
}

const selectedDay     = ref<string | null>(null)
const selectedDayItems = computed(() => byDay.value.get(selectedDay.value ?? '') ?? [])

const formatSelectedDay = computed(() => {
  if (!selectedDay.value) return ''
  return new Date(selectedDay.value + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

function selectDay(month: number, day: number) {
  const key = dayKey(month, day)
  selectedDay.value = selectedDay.value === key ? null : key
}
</script>

<style scoped>
.slide-up-enter-active { transition: all .25s cubic-bezier(.34, 1.56, .64, 1); }
.slide-up-leave-active { transition: all .2s ease-in; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(1rem); }
</style>
