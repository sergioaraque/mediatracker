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
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h2 class="text-lg font-semibold text-white">{{ editId ? 'Editar' : 'Añadir' }} elemento</h2>
          <button @click="close" class="btn-ghost p-2 rounded-xl"><X class="w-5 h-5" /></button>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col lg:flex-row gap-6 p-6">

            <!-- Cover preview -->
            <div class="shrink-0 mx-auto lg:mx-0">
              <div
                class="w-32 rounded-xl overflow-hidden border border-white/10 shadow-xl"
                style="aspect-ratio: 2/3"
              >
                <img
                  v-if="form.cover_url"
                  :src="form.cover_url"
                  :alt="form.title"
                  class="w-full h-full object-cover"
                  @error="imgError = true"
                />
                <div
                  v-else
                  class="w-full h-full flex flex-col items-center justify-center"
                  :class="previewGradient"
                >
                  <component :is="typeIcon" class="w-8 h-8 text-white/25" />
                </div>
              </div>
              <p class="text-gray-500 text-xs text-center mt-2">Vista previa</p>
            </div>

            <!-- Fields -->
            <div class="flex-1 flex flex-col gap-4">

              <!-- Title -->
              <div>
                <label class="label">Título *</label>
                <input v-model="form.title" type="text" class="input" placeholder="ej. Inception" />
              </div>

              <!-- Type + Status -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Tipo</label>
                  <div class="relative">
                    <select v-model="form.type" class="input appearance-none pr-8">
                      <option value="movie">🎬 Película</option>
                      <option value="series">📺 Serie</option>
                      <option value="book">📚 Libro</option>
                    </select>
                    <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label class="label">Estado</label>
                  <div class="relative">
                    <select v-model="form.status" class="input appearance-none pr-8">
                      <option value="pending">⏳ Pendiente</option>
                      <option value="watching">▶️ Viendo</option>
                      <option value="watched">✅ Visto</option>
                    </select>
                    <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <!-- Year + Rating -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Año</label>
                  <input v-model.number="form.year" type="number" class="input" placeholder="2024" min="1888" :max="currentYear + 2" />
                </div>
                <div>
                  <label class="label">Valoración (1-10)</label>
                  <div class="relative">
                    <input v-model.number="form.rating" type="number" class="input" placeholder="—" min="1" max="10" step="0.5" />
                    <Star v-if="form.rating" class="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400 fill-amber-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <!-- Genre -->
              <div>
                <label class="label">Género</label>
                <input v-model="form.genre" type="text" class="input" placeholder="ej. Sci-Fi, Drama…" />
              </div>

              <!-- Cover URL -->
              <div>
                <label class="label">URL de portada</label>
                <input v-model="form.cover_url" type="url" class="input" placeholder="https://…" @input="imgError = false" />
                <p v-if="imgError" class="text-amber-400 text-xs mt-1">No se pudo cargar la imagen</p>
              </div>

              <!-- Description -->
              <div>
                <label class="label">Descripción</label>
                <textarea v-model="form.description" class="input resize-none" rows="3" placeholder="Sinopsis o notas…" />
              </div>

              <!-- Series section -->
              <Transition name="fade">
                <div v-if="form.type === 'series'" class="border border-violet-500/20 rounded-xl p-4 bg-violet-500/5 flex flex-col gap-3">
                  <p class="text-violet-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Tv class="w-3.5 h-3.5" /> Progreso de la serie
                  </p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="label">Temporada actual</label>
                      <input v-model.number="form.current_season" type="number" class="input" placeholder="1" min="1" />
                    </div>
                    <div>
                      <label class="label">Episodio actual</label>
                      <input v-model.number="form.current_episode" type="number" class="input" placeholder="1" min="1" />
                    </div>
                    <div>
                      <label class="label">Total temporadas</label>
                      <input v-model.number="form.total_seasons" type="number" class="input" placeholder="—" min="1" />
                    </div>
                    <div>
                      <label class="label">Total episodios</label>
                      <input v-model.number="form.total_episodes" type="number" class="input" placeholder="—" min="1" />
                    </div>
                  </div>
                  <div>
                    <label class="label">Notas de progreso</label>
                    <textarea v-model="form.progress_notes" class="input resize-none" rows="2" placeholder="Ej. terminé temp. 2" />
                  </div>
                </div>
              </Transition>

            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-white/5 shrink-0 flex gap-3">
          <button @click="close" class="btn-secondary flex-1">Cancelar</button>
          <button @click="submit" :disabled="saving || !form.title.trim()" class="btn-primary flex-1">
            <span v-if="saving" class="flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" /> Guardando…
            </span>
            <span v-else>{{ editId ? 'Guardar cambios' : 'Añadir' }}</span>
          </button>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, ChevronDown, Star, Tv, Loader2 } from 'lucide-vue-next'
import { Film, BookOpen } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore } from '@/stores/ui'
import type { Media, MediaFormData } from '@/types'

const props = defineProps<{
  modelValue: boolean
  editMedia?: Media | null
}>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  saved: []
}>()

const store   = useMediaStore()
const ui      = useUiStore()
const saving  = ref(false)
const imgError = ref(false)
const editId  = computed(() => props.editMedia?.$id ?? null)
const currentYear = new Date().getFullYear()

const blank = (): MediaFormData => ({
  title: '', type: 'movie', status: 'pending', year: null, genre: null,
  cover_url: null, rating: null, description: null,
  current_season: null, current_episode: null,
  total_seasons: null, total_episodes: null, progress_notes: null,
})

const form = ref<MediaFormData>(blank())

watch(() => props.modelValue, (open) => {
  if (!open) return
  imgError.value = false
  if (props.editMedia) {
    const clean = Object.fromEntries(
      Object.entries(props.editMedia).filter(([k]) => !k.startsWith('$'))
    ) as Partial<MediaFormData>
    form.value = { ...blank(), ...clean, total_seasons: null, total_episodes: null, progress_notes: null }
    if (props.editMedia.type === 'series') loadProgress()
  } else {
    form.value = blank()
  }
})

async function loadProgress() {
  const p = await store.getProgress(props.editMedia!.$id)
  if (p) {
    form.value.total_seasons   = p.total_seasons
    form.value.total_episodes  = p.total_episodes
    form.value.progress_notes  = p.notes
  }
}

const typeIcon = computed(() => ({ movie: Film, series: Tv, book: BookOpen }[form.value.type]))
const previewGradient = computed(() => ({
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}[form.value.type]))

function close() { emit('update:modelValue', false) }

async function submit() {
  if (!form.value.title.trim() || saving.value) return
  saving.value = true
  try {
    const data: MediaFormData = {
      ...form.value,
      year:   form.value.year   || null,
      rating: form.value.rating || null,
    }
    if (editId.value) {
      await store.update(editId.value, data)
      ui.toast('Actualizado correctamente')
    } else {
      await store.create(data)
      ui.toast('Añadido a tu colección')
    }
    emit('saved')
    close()
  } catch (e: any) {
    ui.toast(e?.message ?? 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all .2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; transform: translateY(-.5rem); }
</style>
