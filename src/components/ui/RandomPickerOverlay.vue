<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50" @click="close" />
    </Transition>

    <Transition name="scale-up">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <div class="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <Dices class="w-5 h-5 text-violet-400" /> ¿Qué {{ typeLabel }} esta noche?
              </h2>
              <p class="text-gray-500 text-sm mt-0.5">{{ pool.length }} opción{{ pool.length === 1 ? '' : 'es' }} disponibles</p>
            </div>
            <button @click="close" class="btn-ghost p-2 rounded-xl"><X class="w-5 h-5" /></button>
          </div>

          <!-- Filters -->
          <div class="px-6 pb-4 flex gap-2 flex-wrap">
            <button
              v-for="t in typeOpts"
              :key="t.value ?? 'all'"
              @click="filterType = t.value"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
              :class="filterType === t.value
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                : 'bg-white/5 border-white/8 text-gray-400 hover:text-white'"
            >{{ t.label }}</button>

            <div class="w-px bg-white/10 mx-1 self-stretch" />

            <button
              v-for="s in statusOpts"
              :key="s.value ?? 'all'"
              @click="filterStatus = s.value"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
              :class="filterStatus === s.value
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-200'
                : 'bg-white/5 border-white/8 text-gray-400 hover:text-white'"
            >{{ s.label }}</button>
          </div>

          <!-- Card display -->
          <div class="px-6 pb-6">
            <!-- No results -->
            <div v-if="pool.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
              <span class="text-4xl mb-3">😶</span>
              <p class="text-gray-400 text-sm">Nada que mostrar con estos filtros</p>
            </div>

            <!-- Result card -->
            <div v-else-if="picked" class="relative">
              <Transition name="card-flip" mode="out-in">
                <div :key="picked.$id" class="relative rounded-2xl overflow-hidden border border-white/10" style="aspect-ratio: 16/9">
                  <!-- Cover -->
                  <img
                    v-if="picked.cover_url"
                    :src="picked.cover_url"
                    :alt="picked.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full" :class="pickedGradient" />

                  <!-- Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  <!-- Platform badge -->
                  <div v-if="picked.platform" class="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
                    <span class="text-xs font-bold text-white/80">{{ PLATFORM_EMOJI[picked.platform] ?? '📺' }} {{ picked.platform }}</span>
                  </div>

                  <!-- Info -->
                  <div class="absolute bottom-0 inset-x-0 p-4">
                    <p class="text-white text-lg font-bold leading-tight mb-1">{{ picked.title }}</p>
                    <div class="flex items-center gap-2 text-sm text-gray-300 flex-wrap">
                      <span v-if="picked.year">{{ picked.year }}</span>
                      <span v-if="picked.genre" class="text-gray-400">· {{ picked.genre.split(',')[0].trim() }}</span>
                      <span v-if="picked.rating" class="flex items-center gap-1 text-amber-400">
                        <Star class="w-3.5 h-3.5 fill-amber-400" />{{ picked.rating }}
                      </span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Action buttons -->
            <div v-if="pool.length > 0" class="flex gap-3 mt-4">
              <button
                @click="rollRandom"
                class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all"
                :class="rolling
                  ? 'bg-violet-500/30 border border-violet-500/40 text-violet-300'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40'"
              >
                <Dices class="w-4 h-4" :class="rolling ? 'animate-spin' : ''" />
                {{ picked ? 'Dame otra' : 'Elegir' }}
              </button>
              <button
                v-if="picked"
                @click="$emit('detail', picked)"
                class="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm bg-white/8 border border-white/10 hover:bg-white/15 text-white transition-colors"
              >
                <Eye class="w-4 h-4" /> Ver
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Dices, Star, Eye } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import type { Media } from '@/types'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  detail: [m: Media]
}>()

const media = useMediaStore()

const filterType   = ref<string | null>(null)
const filterStatus = ref<string | null>('pending')
const rolling      = ref(false)
const picked       = ref<Media | null>(null)

const typeOpts = [
  { value: null,     label: 'Todo' },
  { value: 'movie',  label: '🎬 Pelis' },
  { value: 'series', label: '📺 Series' },
  { value: 'book',   label: '📚 Libros' },
]
const statusOpts = [
  { value: null,       label: 'Todos' },
  { value: 'pending',  label: 'Pendientes' },
  { value: 'watching', label: 'En curso' },
]

const typeLabel = computed(() => ({
  movie: 'peli', series: 'serie', book: 'libro', null: 'ver',
}[String(filterType.value)] ?? 'ver'))

const pool = computed(() => {
  let r = [...media.all]
  if (filterType.value)   r = r.filter(m => m.type   === filterType.value)
  if (filterStatus.value) r = r.filter(m => m.status === filterStatus.value)
  return r
})

const pickedGradient = computed(() => picked.value ? ({
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}[picked.value.type]) : '')

const PLATFORM_EMOJI: Record<string, string> = {
  'Netflix': '🎬', 'HBO Max': '🟣', 'Prime Video': '📦', 'Disney+': '✨',
  'Apple TV+': '🍎', 'Movistar+': '📡', 'Crunchyroll': '🍥', 'Filmin': '🎭',
  'Mubi': '🎞️', 'YouTube': '▶️', 'Físico': '💿', 'Otro': '📌',
}

// Reset picked when filters change
watch([filterType, filterStatus], () => { picked.value = null })

async function rollRandom() {
  if (!pool.value.length) return
  rolling.value = true
  picked.value  = null

  // Small delay for the animation to feel like it's "thinking"
  await new Promise(r => setTimeout(r, 380))

  const candidates = pool.value.filter(m => m.$id !== picked.value?.$id)
  const source = candidates.length > 0 ? candidates : pool.value
  picked.value  = source[Math.floor(Math.random() * source.length)]
  rolling.value = false
}

function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.scale-up-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.scale-up-leave-active { transition: all .2s ease-in; }
.scale-up-enter-from, .scale-up-leave-to { opacity: 0; transform: scale(.9); }

.card-flip-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.card-flip-leave-active { transition: all .15s ease-in; }
.card-flip-enter-from   { opacity: 0; transform: scale(.92) translateY(8px); }
.card-flip-leave-to     { opacity: 0; transform: scale(1.04) translateY(-4px); }
</style>
