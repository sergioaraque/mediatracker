<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4"
        @mousedown.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

        <!-- Panel -->
        <div
          ref="panelRef"
          class="relative w-full max-w-xl bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          <!-- Search input -->
          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
            <Search class="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Buscar en tu colección…"
              class="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
              @keydown="onKeydown"
            />
            <kbd class="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-[10px] text-gray-500 font-mono shrink-0">Esc</kbd>
          </div>

          <!-- Results -->
          <div ref="listRef" class="max-h-[60vh] overflow-y-auto overscroll-contain py-1.5">

            <!-- Section label -->
            <p v-if="results.length" class="px-4 pt-1 pb-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              {{ query ? `${results.length} resultado${results.length !== 1 ? 's' : ''}` : 'Recientes' }}
            </p>

            <button
              v-for="(item, i) in results"
              :key="item.$id"
              :ref="el => { if (el) itemRefs[i] = el as HTMLElement }"
              class="w-full flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-xl transition-colors duration-100 text-left group"
              style="width: calc(100% - 12px)"
              :class="i === activeIndex ? 'bg-white/8' : 'hover:bg-white/5'"
              @click="select(item)"
              @mouseenter="activeIndex = i"
            >
              <!-- Cover -->
              <div class="w-8 h-11 rounded-lg overflow-hidden shrink-0 border border-white/8">
                <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
                <div v-else class="w-full h-full flex items-center justify-center" :class="gradientMap[item.type]">
                  <component :is="iconMap[item.type]" class="w-3.5 h-3.5 text-white/30" />
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate leading-snug">{{ item.title }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] font-bold uppercase tracking-wide" :class="typeColor[item.type]">{{ typeLabel[item.type] }}</span>
                  <span v-if="item.year" class="text-[10px] text-gray-600">· {{ item.year }}</span>
                  <span class="text-[10px] font-medium" :class="statusColor[item.status]">· {{ statusLabel[item.status] }}</span>
                </div>
              </div>

              <!-- Rating -->
              <div v-if="item.rating" class="flex items-center gap-0.5 shrink-0">
                <Star class="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span class="text-xs font-bold text-white/80">{{ item.rating }}</span>
              </div>

              <!-- Arrow hint -->
              <ArrowRight class="w-3.5 h-3.5 text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <!-- Empty state -->
            <div v-if="!results.length" class="py-10 flex flex-col items-center gap-2 text-center">
              <SearchX class="w-8 h-8 text-gray-700" />
              <p class="text-sm text-gray-500">Sin resultados para "{{ query }}"</p>
            </div>

          </div>

          <!-- Footer hint -->
          <div class="flex items-center gap-4 px-4 py-2.5 border-t border-white/6 text-[10px] text-gray-600">
            <span class="flex items-center gap-1"><kbd class="kbd">↑↓</kbd> navegar</span>
            <span class="flex items-center gap-1"><kbd class="kbd">↵</kbd> abrir</span>
            <span class="flex items-center gap-1"><kbd class="kbd">Esc</kbd> cerrar</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Search, SearchX, Star, Film, Tv, BookOpen, ArrowRight } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import type { Media } from '@/types'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{ 'update:modelValue': [v: boolean]; detail: [m: Media] }>()

const media     = useMediaStore()
const query     = ref('')
const activeIndex = ref(0)
const inputRef  = ref<HTMLInputElement>()
const panelRef  = ref<HTMLElement>()
const listRef   = ref<HTMLElement>()
const itemRefs  = ref<HTMLElement[]>([])

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return [...media.all].slice(0, 8)
  return media.all.filter(m =>
    m.title?.toLowerCase().includes(q) ||
    m.genre?.toLowerCase().includes(q) ||
    m.platform?.toLowerCase().includes(q)
  ).slice(0, 12)
})

watch(() => props.modelValue, async (v) => {
  if (v) {
    query.value   = ''
    activeIndex.value = 0
    itemRefs.value  = []
    await nextTick()
    inputRef.value?.focus()
  }
})

watch(results, () => {
  activeIndex.value = 0
  itemRefs.value  = []
})

function close() {
  emit('update:modelValue', false)
}

function select(item: Media) {
  emit('detail', item)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { close(); return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
    scrollToActive()
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollToActive()
  }
  if (e.key === 'Enter' && results.value[activeIndex.value]) {
    select(results.value[activeIndex.value])
  }
}

function scrollToActive() {
  nextTick(() => {
    itemRefs.value[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
  })
}

const iconMap = { movie: Film, series: Tv, book: BookOpen }
const gradientMap = {
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}
const typeLabel = { movie: 'Película', series: 'Serie', book: 'Libro' }
const typeColor = { movie: 'text-blue-400', series: 'text-violet-400', book: 'text-amber-400' }
const statusLabel = { watching: 'Viendo', pending: 'Pendiente', watched: 'Visto', dropped: 'Abandonado' }
const statusColor = { watching: 'text-blue-300', pending: 'text-amber-300', watched: 'text-emerald-300', dropped: 'text-red-300' }
</script>

<style scoped>
.palette-enter-active { transition: opacity .15s ease, transform .15s cubic-bezier(.34,1.56,.64,1); }
.palette-leave-active { transition: opacity .1s ease, transform .1s ease; }
.palette-enter-from, .palette-leave-to { opacity: 0; transform: translateY(-8px) scale(.97); }

.kbd {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 1px 4px; border-radius: 4px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  font-family: monospace; font-size: 10px;
}
</style>
