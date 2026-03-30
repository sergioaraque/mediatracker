<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modelValue" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="close" />
    </Transition>

    <Transition name="drawer">
      <div v-if="modelValue" class="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-900 border-l border-white/10 z-50 flex flex-col" @click.stop>

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <Upload class="w-5 h-5 text-violet-400" />
            <h2 class="text-lg font-semibold text-white">Importar colección</h2>
          </div>
          <button @click="close" class="btn-ghost p-2 rounded-xl"><X class="w-5 h-5" /></button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          <!-- Step 1: drop zone -->
          <div v-if="!rows.length">
            <p class="text-sm text-gray-400 mb-4">
              Importa tu colección desde un archivo <strong class="text-white">CSV</strong> o <strong class="text-white">JSON</strong>.
              Las columnas reconocidas son: <code class="bg-white/5 px-1 rounded text-xs">title</code>,
              <code class="bg-white/5 px-1 rounded text-xs">type</code>,
              <code class="bg-white/5 px-1 rounded text-xs">status</code>,
              <code class="bg-white/5 px-1 rounded text-xs">year</code>,
              <code class="bg-white/5 px-1 rounded text-xs">genre</code>,
              <code class="bg-white/5 px-1 rounded text-xs">rating</code>,
              <code class="bg-white/5 px-1 rounded text-xs">platform</code>,
              <code class="bg-white/5 px-1 rounded text-xs">cover_url</code>.
            </p>

            <!-- Drop zone -->
            <div
              class="border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer"
              :class="dragging ? 'border-violet-500 bg-violet-500/10' : 'border-white/15 hover:border-white/30 hover:bg-white/3'"
              @dragover.prevent="dragging = true"
              @dragleave="dragging = false"
              @drop.prevent="onDrop"
              @click="fileInput?.click()"
            >
              <FileUp class="w-10 h-10 text-gray-600 mx-auto mb-3" :class="dragging && 'text-violet-400'" />
              <p class="text-white font-medium mb-1">Arrastra aquí tu archivo</p>
              <p class="text-gray-500 text-sm">o haz clic para seleccionarlo</p>
              <p class="text-gray-600 text-xs mt-3">CSV · JSON</p>
            </div>
            <input ref="fileInput" type="file" accept=".csv,.json" class="hidden" @change="onFileChange" />

            <p v-if="parseError" class="mt-3 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 shrink-0" /> {{ parseError }}
            </p>
          </div>

          <!-- Step 2: preview table -->
          <div v-else>
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-white">
                {{ validRows.length }} elemento{{ validRows.length === 1 ? '' : 's' }} listos para importar
                <span v-if="invalidRows.length" class="text-amber-400"> · {{ invalidRows.length }} sin título (se ignorarán)</span>
              </p>
              <button @click="reset" class="btn-ghost text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                <RotateCcw class="w-3 h-3" /> Cambiar archivo
              </button>
            </div>

            <!-- Table -->
            <div class="rounded-xl border border-white/10 overflow-hidden">
              <div class="overflow-x-auto max-h-72 overflow-y-auto">
                <table class="w-full text-xs">
                  <thead class="bg-white/5 sticky top-0">
                    <tr>
                      <th class="text-left px-3 py-2 text-gray-400 font-semibold">Título</th>
                      <th class="text-left px-3 py-2 text-gray-400 font-semibold">Tipo</th>
                      <th class="text-left px-3 py-2 text-gray-400 font-semibold">Estado</th>
                      <th class="text-left px-3 py-2 text-gray-400 font-semibold">Año</th>
                      <th class="text-left px-3 py-2 text-gray-400 font-semibold">Plataforma</th>
                      <th class="text-left px-3 py-2 text-gray-400 font-semibold">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(r, i) in validRows"
                      :key="i"
                      class="border-t border-white/5 hover:bg-white/3"
                    >
                      <td class="px-3 py-2 text-white font-medium truncate max-w-[180px]">{{ r.title }}</td>
                      <td class="px-3 py-2 text-gray-400">{{ typeEmoji(r.type) }}</td>
                      <td class="px-3 py-2" :class="statusColor(r.status)">{{ statusLabel(r.status) }}</td>
                      <td class="px-3 py-2 text-gray-400">{{ r.year ?? '—' }}</td>
                      <td class="px-3 py-2 text-gray-400 truncate max-w-[120px]">{{ r.platform ?? '—' }}</td>
                      <td class="px-3 py-2">
                        <span v-if="importedIds.has(i)" class="text-emerald-400 font-bold">✓</span>
                        <span v-else-if="errorIds.has(i)" class="text-red-400">✗</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Progress bar during import -->
            <div v-if="importing" class="mt-4">
              <div class="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span>Importando… {{ importedIds.size }} / {{ validRows.length }}</span>
                <span>{{ Math.round((importedIds.size / validRows.length) * 100) }}%</span>
              </div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                  :style="`width: ${(importedIds.size / validRows.length) * 100}%`"
                />
              </div>
            </div>

            <!-- Done summary -->
            <div v-if="importDone" class="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
              <p class="text-sm text-emerald-300">
                Importados <strong>{{ importedIds.size }}</strong> elementos correctamente.
                <span v-if="errorIds.size"> {{ errorIds.size }} fallaron.</span>
              </p>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div v-if="validRows.length && !importDone" class="px-6 py-4 border-t border-white/5 shrink-0 flex gap-3">
          <button @click="close" class="btn-secondary flex-1">Cancelar</button>
          <button
            @click="runImport"
            :disabled="importing || validRows.length === 0"
            class="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="importing" class="w-4 h-4 animate-spin" />
            <Upload v-else class="w-4 h-4" />
            {{ importing ? 'Importando…' : `Importar ${validRows.length} elementos` }}
          </button>
        </div>
        <div v-else-if="importDone" class="px-6 py-4 border-t border-white/5 shrink-0">
          <button @click="close" class="btn-primary w-full">Cerrar</button>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Upload, FileUp, AlertTriangle, RotateCcw, Loader2, CheckCircle2 } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import type { MediaFormData } from '@/types'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const store = useMediaStore()
const ui    = useUiStore()

const fileInput  = ref<HTMLInputElement>()
const dragging   = ref(false)
const parseError = ref('')
const rows       = ref<Partial<MediaFormData>[]>([])
const importing  = ref(false)
const importDone = ref(false)
const importedIds = ref(new Set<number>())
const errorIds    = ref(new Set<number>())

const VALID_TYPES   = new Set(['movie', 'series', 'book'])
const VALID_STATUSES = new Set(['watched', 'watching', 'pending'])

const validRows   = computed(() => rows.value.filter(r => r.title?.trim()))
const invalidRows = computed(() => rows.value.filter(r => !r.title?.trim()))

// ── File handling ──────────────────────────────────────────
function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function processFile(file: File) {
  parseError.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    try {
      if (file.name.endsWith('.json')) rows.value = parseJSON(text)
      else                             rows.value = parseCSV(text)
    } catch (err: any) {
      parseError.value = err.message ?? 'Error al parsear el archivo'
    }
  }
  reader.readAsText(file, 'utf-8')
}

// ── Parsers ────────────────────────────────────────────────
function parseJSON(text: string): Partial<MediaFormData>[] {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('El JSON debe ser un array de objetos')
  return data.map(normalizeRow)
}

function parseCSV(text: string): Partial<MediaFormData>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error('El CSV debe tener cabecera y al menos una fila')
  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = splitCSVLine(line)
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = values[i]?.trim() ?? '' })
      return normalizeRow(obj)
    })
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQ = !inQ; continue }
    if (c === ',' && !inQ) { result.push(cur); cur = ''; continue }
    cur += c
  }
  result.push(cur)
  return result
}

function normalizeRow(obj: Record<string, any>): Partial<MediaFormData> {
  const type   = VALID_TYPES.has(obj.type)     ? obj.type   : 'movie'
  const status = VALID_STATUSES.has(obj.status) ? obj.status : 'pending'
  return {
    title:       String(obj.title ?? obj.titulo ?? '').trim() || undefined,
    type,
    status,
    year:        obj.year   ? parseInt(obj.year)    : null,
    rating:      obj.rating ? parseFloat(obj.rating) : null,
    genre:       obj.genre       || obj.genero   || null,
    platform:    obj.platform    || obj.plataforma || null,
    cover_url:   obj.cover_url   || obj.cover    || null,
    description: obj.description || obj.sinopsis || null,
    remind_at:   null,
    current_season: null, current_episode: null,
    total_seasons: null, total_episodes: null, progress_notes: null,
  }
}

// ── Import ─────────────────────────────────────────────────
async function runImport() {
  if (importing.value) return
  importing.value = true
  importedIds.value = new Set()
  errorIds.value    = new Set()

  for (let i = 0; i < validRows.value.length; i++) {
    const row = validRows.value[i] as MediaFormData
    try {
      await store.create(row)
      importedIds.value = new Set([...importedIds.value, i])
    } catch {
      errorIds.value = new Set([...errorIds.value, i])
    }
    // Small delay to avoid rate-limiting Appwrite
    await new Promise(r => setTimeout(r, 120))
  }

  importing.value = false
  importDone.value = true
  if (importedIds.value.size > 0) {
    ui.toast(`${importedIds.value.size} elementos importados`)
  }
}

function reset() {
  rows.value       = []
  importDone.value = false
  importedIds.value = new Set()
  errorIds.value    = new Set()
  parseError.value  = ''
  if (fileInput.value) fileInput.value.value = ''
}

function close() {
  if (importDone.value) store.fetch()
  emit('update:modelValue', false)
  setTimeout(reset, 300)
}

// ── Helpers ────────────────────────────────────────────────
function typeEmoji(t?: string) {
  return ({ movie: '🎬 Película', series: '📺 Serie', book: '📚 Libro' }[t ?? ''] ?? '🎬 Película')
}
function statusLabel(s?: string) {
  return ({ watched: 'Visto', watching: 'Viendo', pending: 'Pendiente' }[s ?? ''] ?? 'Pendiente')
}
function statusColor(s?: string) {
  return ({ watched: 'text-emerald-300', watching: 'text-blue-300', pending: 'text-amber-300' }[s ?? ''] ?? 'text-gray-300')
}
</script>
