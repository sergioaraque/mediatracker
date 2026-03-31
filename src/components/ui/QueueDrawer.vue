<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="close" />
    </Transition>

    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-900 border-l border-white/10 z-50 flex flex-col"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div class="flex items-center gap-2.5">
            <ListOrdered class="w-4.5 h-4.5 text-violet-400" />
            <div>
              <h2 class="text-sm font-semibold text-white">Cola de reproducción</h2>
              <p class="text-[11px] text-gray-500">{{ queue.length }} elementos</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="queue.length"
              @click="clearAll"
              class="text-[11px] font-medium text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Limpiar
            </button>
            <button @click="close" class="btn-ghost p-2 rounded-xl">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Add pending bulk button -->
        <div v-if="pendingNotInQueue.length" class="px-4 py-3 border-b border-white/5 shrink-0">
          <button
            @click="addAllPending"
            class="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-500/10 hover:border-violet-400/40 transition-colors"
          >
            <ListPlus class="w-3.5 h-3.5" />
            Añadir {{ pendingNotInQueue.length }} pendientes a la cola
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="!queue.length" class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div class="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <ListOrdered class="w-7 h-7 text-violet-400/60" />
          </div>
          <div>
            <p class="text-white font-semibold mb-1">Cola vacía</p>
            <p class="text-gray-500 text-sm">Añade elementos pendientes para ordenar qué ver a continuación</p>
          </div>
          <button v-if="pendingNotInQueue.length" @click="addAllPending" class="btn-primary text-sm px-4 py-2">
            Añadir todos los pendientes
          </button>
        </div>

        <!-- Queue list -->
        <div v-else class="flex-1 overflow-y-auto p-4 space-y-2">

          <!-- Siguiente badge -->
          <p class="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 pb-1">Orden de visionado</p>

          <div
            v-for="(item, i) in queueItems"
            :key="item?.$id ?? i"
            class="flex items-center gap-3 p-3 rounded-xl border transition-colors"
            :class="i === 0
              ? 'bg-violet-500/12 border-violet-500/30'
              : item ? 'bg-white/4 border-white/6' : 'bg-white/2 border-white/5 opacity-40'"
          >
            <!-- Position -->
            <span class="w-6 text-center shrink-0"
              :class="i === 0 ? 'text-violet-400 font-bold text-sm' : 'text-gray-600 text-xs font-medium'">
              {{ i === 0 ? '▶' : i + 1 }}
            </span>

            <!-- Cover -->
            <div class="w-9 h-12 rounded-lg overflow-hidden shrink-0 border border-white/8">
              <img v-if="item?.cover_url" :src="item.cover_url" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-base">
                {{ item?.type === 'series' ? '📺' : item?.type === 'book' ? '📚' : '🎬' }}
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate leading-snug">
                {{ item?.title ?? '(Eliminado)' }}
              </p>
              <div v-if="item" class="flex items-center gap-2 mt-0.5">
                <span class="text-[11px] text-gray-500">{{ item.year ?? '' }}</span>
                <span v-if="item.status !== 'pending'"
                  class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                  :class="item.status === 'watching' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'">
                  {{ item.status === 'watching' ? 'Viendo' : item.status }}
                </span>
              </div>
            </div>

            <!-- Move + remove -->
            <div class="flex flex-col gap-0.5 shrink-0">
              <button
                @click="q.move(queueIds[i], -1)"
                :disabled="i === 0"
                class="p-1 rounded text-gray-600 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronUp class="w-3.5 h-3.5" />
              </button>
              <button
                @click="q.move(queueIds[i], 1)"
                :disabled="i === queueIds.length - 1"
                class="p-1 rounded text-gray-600 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronDown class="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              @click="q.remove(queueIds[i])"
              class="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, ListOrdered, ListPlus, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useQueue }      from '@/composables/useQueue'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const media = useMediaStore()
const q     = useQueue()
const { queueIds } = q

const queue = computed(() => queueIds.value)

const queueItems = computed(() =>
  queueIds.value.map(id => media.all.find(m => m.$id === id) ?? null)
)

const pendingNotInQueue = computed(() =>
  media.all.filter(m => m.status === 'pending' && !queueIds.value.includes(m.$id))
)

function addAllPending() {
  for (const m of pendingNotInQueue.value) q.add(m.$id)
}

function clearAll() {
  for (const id of [...queueIds.value]) q.remove(id)
}

function close() { emit('update:modelValue', false) }
</script>
