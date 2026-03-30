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

              <!-- Autocomplete TMDB (solo películas y series) -->
              <div v-if="form.type !== 'book'" class="relative" ref="searchRef">
                <label class="label">Autocompletar desde TMDB</label>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      v-model="searchQ"
                      type="text"
                      class="input pl-9"
                      :placeholder="searchPlaceholder"
                      @keydown.enter.prevent="runSearch"
                      @focus="searchOpen = !!searchResults.length"
                    />
                  </div>
                  <button
                    type="button"
                    :disabled="!hasTmdbKey || searchLoading || searchQ.trim().length < 2"
                    class="btn-secondary px-4 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="runSearch"
                  >
                    <Loader2 v-if="searchLoading" class="w-4 h-4 animate-spin" />
                    <Search v-else class="w-4 h-4" />
                  </button>
                </div>
                <!-- No TMDB key notice -->
                <p v-if="!hasTmdbKey" class="text-amber-400/80 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3 shrink-0" />
                  Añade <code class="bg-white/5 px-1 rounded">VITE_TMDB_API_KEY</code> en .env.local
                </p>
                <!-- Dropdown -->
                <Transition name="fade">
                  <div
                    v-if="searchOpen && searchResults.length"
                    class="absolute top-full left-0 right-0 mt-1 bg-gray-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-10 max-h-64 overflow-y-auto"
                  >
                    <button
                      v-for="r in searchResults"
                      :key="r.id"
                      class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition-colors"
                      @click="applyResult(r)"
                    >
                      <img v-if="r.poster" :src="r.poster" class="w-9 shrink-0 rounded object-cover" style="aspect-ratio:2/3" />
                      <div v-else class="w-9 shrink-0 rounded bg-white/10" style="aspect-ratio:2/3" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">{{ r.title }}</p>
                        <p class="text-xs text-gray-500 truncate">{{ [r.year, r.genre].filter(Boolean).join(' · ') }}</p>
                      </div>
                    </button>
                  </div>
                </Transition>
              </div>

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

              <!-- Genre + Platform -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Género</label>
                  <input v-model="form.genre" type="text" class="input" placeholder="ej. Sci-Fi, Drama…" />
                </div>
                <div>
                  <label class="label">Plataforma</label>
                  <div class="relative">
                    <select v-model="form.platform" class="input appearance-none pr-8">
                      <option :value="null">—</option>
                      <option v-for="p in PLATFORMS" :key="p.value" :value="p.value">{{ p.label }}</option>
                    </select>
                    <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
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

              <!-- Reminder -->
              <div class="border border-amber-500/20 rounded-xl p-4 bg-amber-500/5">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-amber-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Bell class="w-3.5 h-3.5" /> Recordatorio
                  </label>
                  <button
                    v-if="form.remind_at"
                    type="button"
                    @click="form.remind_at = null"
                    class="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  :value="form.remind_at ? form.remind_at.slice(0, 16) : ''"
                  @change="e => { form.remind_at = (e.target as HTMLInputElement).value ? new Date((e.target as HTMLInputElement).value).toISOString() : null; requestNotifPermission() }"
                  type="datetime-local"
                  class="input text-sm"
                  :min="minDateTime"
                />
                <p v-if="!notifGranted && form.remind_at" class="text-amber-400/70 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3 shrink-0" /> Necesitas permitir notificaciones en tu navegador
                </p>
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
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { X, ChevronDown, Star, Tv, Loader2, Search, AlertTriangle, Bell } from 'lucide-vue-next'
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
  cover_url: null, rating: null, description: null, platform: null, remind_at: null,
  current_season: null, current_episode: null,
  total_seasons: null, total_episodes: null, progress_notes: null,
})

const form = ref<MediaFormData>(blank())

watch(() => props.modelValue, (open) => {
  if (!open) {
    searchQ.value = ''; searchResults.value = []; searchOpen.value = false
    return
  }
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

/* ── Reminders ────────────────────────────────────────────── */
const notifGranted = ref(Notification.permission === 'granted')
const minDateTime  = computed(() => new Date(Date.now() + 60_000).toISOString().slice(0, 16))

async function requestNotifPermission() {
  if (Notification.permission === 'granted') return
  const result = await Notification.requestPermission()
  notifGranted.value = result === 'granted'
}

/* ── Platforms ────────────────────────────────────────────── */
const PLATFORMS = [
  { value: 'Netflix',      label: '🎬 Netflix' },
  { value: 'HBO Max',      label: '🟣 HBO Max' },
  { value: 'Prime Video',  label: '📦 Prime Video' },
  { value: 'Disney+',      label: '✨ Disney+' },
  { value: 'Apple TV+',    label: '🍎 Apple TV+' },
  { value: 'Movistar+',    label: '📡 Movistar+' },
  { value: 'Crunchyroll',  label: '🍥 Crunchyroll' },
  { value: 'Filmin',       label: '🎭 Filmin' },
  { value: 'Mubi',         label: '🎞️ Mubi' },
  { value: 'YouTube',      label: '▶️ YouTube' },
  { value: 'Físico',       label: '💿 Físico' },
  { value: 'Otro',         label: '📌 Otro' },
]

/* ── Autocomplete ──────────────────────────────────────────── */
const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY ?? ''
const hasTmdbKey = !!TMDB_KEY

const TMDB_GENRES: Record<number, string> = {
  28:'Acción',12:'Aventura',16:'Animación',35:'Comedia',80:'Crimen',99:'Documental',
  18:'Drama',10751:'Familia',14:'Fantasía',36:'Historia',27:'Terror',9648:'Misterio',
  10749:'Romance',878:'Ciencia ficción',53:'Thriller',10752:'Bélica',37:'Western',
  10759:'Acción y aventura',10765:'Sci-Fi y fantasía',10768:'Guerra y política',
}

interface SearchResult { id: string; title: string; year: string; genre: string; poster: string; cover: string; description: string }

const searchRef     = ref<HTMLElement>()
const searchQ       = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const searchOpen    = ref(false)

const searchPlaceholder = computed(() => ({
  movie:  'Título de película…',
  series: 'Título de serie…',
  book:   '',
}[form.value.type]))

async function runSearch() {
  if (!hasTmdbKey || !searchQ.value.trim() || searchLoading.value) return
  searchLoading.value = true
  searchOpen.value    = false
  try {
    searchResults.value = await searchTmdb(searchQ.value, form.value.type as 'movie' | 'series')
    searchOpen.value    = searchResults.value.length > 0
  } catch { searchResults.value = [] }
  finally { searchLoading.value = false }
}

async function searchTmdb(q: string, type: 'movie' | 'series'): Promise<SearchResult[]> {
  const endpoint = type === 'movie' ? 'movie' : 'tv'
  const res = await fetch(
    `https://api.themoviedb.org/3/search/${endpoint}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=es-ES&page=1`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []).slice(0, 6).map((r: any) => ({
    id:          String(r.id),
    title:       r.title ?? r.name ?? '',
    year:        (r.release_date ?? r.first_air_date ?? '').slice(0, 4),
    genre:       (r.genre_ids ?? []).slice(0, 2).map((id: number) => TMDB_GENRES[id]).filter(Boolean).join(', '),
    poster:      r.poster_path ? `https://image.tmdb.org/t/p/w185${r.poster_path}` : '',
    cover:       r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : '',
    description: r.overview ?? '',
  }))
}


function applyResult(r: SearchResult) {
  form.value.title       = r.title
  form.value.year        = r.year ? parseInt(r.year) : null
  form.value.genre       = r.genre || null
  form.value.cover_url   = r.cover || null
  form.value.description = r.description || null
  imgError.value         = false
  searchQ.value          = ''
  searchOpen.value       = false
  searchResults.value    = []
}

function onClickOutside(e: MouseEvent) {
  if (searchRef.value && !searchRef.value.contains(e.target as Node)) searchOpen.value = false
}
onMounted(()  => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

/* ── ─────────────────────────────────────────────────────── */
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
