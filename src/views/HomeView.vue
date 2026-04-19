<template>
  <div class="min-h-screen text-white flex relative">
    <DynamicBackground :type="media.filterType as any" />

    <!-- Desktop sidebar -->
    <AppSidebar
      @add="formDrawer = true"
      @search="searchDrawer = true"
      @upcoming="router.push('/upcoming')"
      @tools="toolsDrawer = true"
    />

    <!-- Main column -->
    <div class="flex-1 flex flex-col min-w-0">
    <AppHeader />
    <FilterBar ref="filterBarRef" />

    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">

      <!-- Siguiente a ver banner -->
      <Transition name="fade-down">
        <div
          v-if="nextInQueue"
          class="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/25 hover:border-violet-400/40 transition-colors"
        >
          <div class="w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
            <img v-if="nextInQueue.cover_url" :src="nextInQueue.cover_url" :alt="nextInQueue.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center bg-gray-800 text-lg">
              {{ nextInQueue.type === 'series' ? '📺' : nextInQueue.type === 'book' ? '📚' : '🎬' }}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">Siguiente a ver</p>
            <p class="text-sm font-semibold text-white truncate">{{ nextInQueue.title }}</p>
            <p v-if="nextInQueue.year" class="text-xs text-gray-500 mt-0.5">{{ nextInQueue.year }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="openDetail(nextInQueue!)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-violet-500/40 text-violet-300 hover:bg-violet-500/20 transition-colors"
            >
              Ver detalle
            </button>
            <button
              @click="q.remove(nextInQueue!.$id)"
              class="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
              title="Saltar de la cola"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Section banner -->
      <SectionBanner :type="media.filterType" />

      <!-- Skeleton -->
      <div v-if="media.loading" :class="gridCols">
        <div
          v-for="n in 12"
          :key="n"
          class="rounded-2xl bg-white/5 animate-skeleton"
          style="aspect-ratio: 2/3"
        />
      </div>

      <!-- Empty state: no items at all -->
      <div v-else-if="media.all.length === 0" class="flex flex-col items-center justify-center py-32 text-center">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mb-6">
          <Inbox class="w-9 h-9 text-violet-400" />
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">Colección vacía</h2>
        <p class="text-gray-400 max-w-sm mb-8">Empieza añadiendo tu primera película, serie o libro.</p>
        <button @click="formDrawer = true" class="btn-primary px-6 py-3 flex items-center gap-2">
          <Plus class="w-5 h-5" /> Añadir ahora
        </button>
      </div>

      <!-- Empty state: filters -->
      <div v-else-if="media.filtered.length === 0" class="flex flex-col items-center justify-center py-32 text-center">
        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
          <SearchX class="w-7 h-7 text-gray-500" />
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Sin resultados</h2>
        <p class="text-gray-400 text-sm mb-6">Prueba a cambiar los filtros o la búsqueda.</p>
        <button @click="clearFilters" class="btn-secondary text-sm px-4 py-2">Limpiar filtros</button>
      </div>

      <!-- Grid view -->
      <TransitionGroup
        v-else-if="ui.viewMode === 'grid'"
        name="cards"
        tag="div"
        :class="gridCols"
      >
        <MediaCard
          v-for="(item, i) in media.filtered"
          :key="item.$id"
          :media="item"
          :style="{ transitionDelay: `${Math.min(i * 25, 300)}ms` }"
          @detail="openDetail"
          @edit="openEdit"
          @delete="handleDelete"
        />
      </TransitionGroup>

      <!-- List view -->
      <TransitionGroup name="cards" tag="div" class="flex flex-col gap-1.5" v-else>
        <MediaRow
          v-for="(item, i) in media.filtered"
          :key="item.$id"
          :media="item"
          :style="{ transitionDelay: `${Math.min(i * 20, 200)}ms` }"
          @detail="openDetail"
          @edit="openEdit"
          @delete="handleDelete"
        />
      </TransitionGroup>

    </main>
    </div><!-- /main column -->

    <!-- Add / Edit drawer -->
    <MediaFormDrawer
      v-model="formDrawer"
      :editMedia="editTarget"
      @saved="editTarget = null"
    />

    <!-- Stats drawer -->
    <StatsDrawer v-model="statsDrawer" />

    <!-- Random picker -->
    <RandomPickerOverlay v-model="randomDrawer" @detail="openDetail" />

    <!-- Import -->
    <ImportDrawer v-model="importDrawer" />

    <!-- Calendar -->
    <CalendarDrawer v-model="calendarDrawer" />

    <!-- Discover drawer -->
    <DiscoverDrawer v-model="discoverDrawer" />

    <!-- Advanced Discovery drawer -->
    <AdvancedDiscoveryDrawer v-model="advancedDiscoveryDrawer" />

    <!-- Search drawer -->
    <SearchDrawer v-model="searchDrawer" />

    <!-- Queue drawer -->
    <QueueDrawer v-model="queueDrawer" />

    <!-- Mobile bottom navigation -->
    <BottomNav
      active="library"
      @library="() => {}"
      @add="formDrawer = true"
      @calendar="calendarDrawer = true"
      @search="searchDrawer = true"
      @tools="toolsDrawer = true"
    />

    <!-- Tools hub -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="toolsDrawer" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[58]" @click="toolsDrawer = false" />
      </Transition>
      <Transition name="scale">
        <div
          v-if="toolsDrawer"
          class="fixed inset-0 z-[58] flex items-center justify-center p-4"
          @click.self="toolsDrawer = false"
        >
          <div class="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-2xl">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-white">Herramientas</h3>
              <button @click="toolsDrawer = false" class="btn-ghost p-2 rounded-lg"><X class="w-4 h-4" /></button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button @click="openTool('discover')" class="tool-btn"><Compass class="w-4 h-4" /> Descubrir</button>
              <button @click="openTool('advanced')" class="tool-btn"><Sparkles class="w-4 h-4" /> Buscar experto</button>
              <button @click="openTool('queue')" class="tool-btn"><ListOrdered class="w-4 h-4" /> Cola</button>
              <button @click="openTool('calendar')" class="tool-btn"><CalendarDays class="w-4 h-4" /> Historial</button>
              <button @click="openTool('stats')" class="tool-btn"><BarChart2 class="w-4 h-4" /> Estadísticas</button>
              <button @click="openTool('random')" class="tool-btn"><Dices class="w-4 h-4" /> Aleatorio</button>
              <button @click="openTool('import')" class="tool-btn"><Upload class="w-4 h-4" /> Importar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Detail drawer -->
    <DetailDrawer
      v-model="detailDrawer"
      :media="detailTarget"
      @edit="openEdit"
      @delete="handleDelete"
    />

    <!-- Command palette -->
    <CommandPalette v-model="showCommandPalette" @detail="openDetail" />

    <!-- Delete confirm -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="deleteTarget" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" @click="deleteTarget = null" />
      </Transition>
      <Transition name="scale">
        <div
          v-if="deleteTarget"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4"
          @click.self="deleteTarget = null"
        >
          <div class="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
              <Trash2 class="w-6 h-6 text-red-400" />
            </div>
            <h3 class="text-lg font-bold text-white text-center mb-2">¿Eliminar?</h3>
            <p class="text-gray-400 text-sm text-center mb-6">Esta acción no se puede deshacer.</p>
            <div class="flex gap-3">
              <button @click="deleteTarget = null" class="btn-secondary flex-1">Cancelar</button>
              <button @click="confirmDelete" class="btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Inbox, Plus, SearchX, Trash2, X, Compass, Sparkles, ListOrdered, CalendarDays, BarChart2, Dices, Upload } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import { storeToRefs }   from 'pinia'
import { useKeyboard }   from '@/composables/useKeyboard'
import { useAchievements } from '@/composables/useAchievements'
import { useQueue }        from '@/composables/useQueue'
import type { Media } from '@/types'
import AppHeader          from '@/components/layout/AppHeader.vue'
import AppSidebar         from '@/components/layout/AppSidebar.vue'
import FilterBar          from '@/components/layout/FilterBar.vue'
import SectionBanner      from '@/components/layout/SectionBanner.vue'
import BottomNav          from '@/components/layout/BottomNav.vue'
import MediaCard          from '@/components/media/MediaCard.vue'
import MediaRow           from '@/components/media/MediaRow.vue'
import MediaFormDrawer    from '@/components/media/MediaFormDrawer.vue'
import DetailDrawer       from '@/components/media/DetailDrawer.vue'
import StatsDrawer           from '@/components/ui/StatsDrawer.vue'
import RandomPickerOverlay   from '@/components/ui/RandomPickerOverlay.vue'
import ImportDrawer           from '@/components/ui/ImportDrawer.vue'
import CalendarDrawer         from '@/components/ui/CalendarDrawer.vue'
import CommandPalette         from '@/components/ui/CommandPalette.vue'
import DiscoverDrawer         from '@/components/ui/DiscoverDrawer.vue'
import AdvancedDiscoveryDrawer from '@/components/ui/AdvancedDiscoveryDrawer.vue'
import SearchDrawer           from '@/components/ui/SearchDrawer.vue'
import QueueDrawer            from '@/components/ui/QueueDrawer.vue'
import DynamicBackground  from '@/components/layout/DynamicBackground.vue'

const router = useRouter()
const media  = useMediaStore()
const ui     = useUiStore()
const { showCommandPalette, sidebarExpanded } = storeToRefs(ui)

// Adjust grid columns based on sidebar state so cards don't get squished
const gridCols = computed(() =>
  sidebarExpanded.value
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
)
const q = useQueue()
const { queueIds } = q

const nextInQueue = computed(() => {
  for (const id of queueIds.value) {
    const item = media.all.find(m => m.$id === id && m.status === 'pending')
    if (item) return item
  }
  return null
})

const formDrawer    = ref(false)
const detailDrawer  = ref(false)
const statsDrawer   = ref(false)
const randomDrawer  = ref(false)
const importDrawer  = ref(false)
const toolsDrawer   = ref(false)
const calendarDrawer  = ref(false)
const discoverDrawer  = ref(false)
const advancedDiscoveryDrawer = ref(false)
const searchDrawer    = ref(false)
const queueDrawer     = ref(false)
const editTarget   = ref<Media | null>(null)
const detailTarget = ref<Media | null>(null)
const deleteTarget = ref<string | null>(null)
const filterBarRef = ref<InstanceType<typeof FilterBar>>()

useAchievements()

onMounted(async () => {
  try {
    await media.fetch()
  } catch {
    ui.toast('No se pudo cargar tu colección', 'error')
  }
})

useKeyboard({
  onNew:     () => { formDrawer.value = true },
  onSearch:  () => { filterBarRef.value?.focusSearch() },
  onPalette: () => { showCommandPalette.value = true },
})

function openDetail(m: Media) {
  detailTarget.value = m
  detailDrawer.value = true
}

function openEdit(m: Media) {
  detailDrawer.value = false
  editTarget.value   = m
  formDrawer.value   = true
}

function handleDelete(id: string) {
  deleteTarget.value = id
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await media.remove(deleteTarget.value)
    ui.toast('Eliminado correctamente')
  } catch {
    ui.toast('Error al eliminar', 'error')
  }
  deleteTarget.value = null
}

function clearFilters() {
  media.filterType      = null
  media.filterStatus    = null
  media.filterMinRating = null
  media.filterPlatform  = null
  media.search          = ''
}

type ToolKey = 'discover' | 'advanced' | 'queue' | 'calendar' | 'stats' | 'random' | 'import'

function openTool(tool: ToolKey) {
  toolsDrawer.value = false
  if (tool === 'discover') discoverDrawer.value = true
  if (tool === 'advanced') advancedDiscoveryDrawer.value = true
  if (tool === 'queue') queueDrawer.value = true
  if (tool === 'calendar') calendarDrawer.value = true
  if (tool === 'stats') statsDrawer.value = true
  if (tool === 'random') randomDrawer.value = true
  if (tool === 'import') importDrawer.value = true
}
</script>

<style scoped>
.scale-enter-active { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
.scale-leave-active { transition: all .15s ease-in; }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(.9); }

.fade-down-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.fade-down-leave-active { transition: all .2s ease-in; }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-8px); }

.tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  border-radius: .75rem;
  border: 1px solid rgba(255, 255, 255, .08);
  background: rgba(255, 255, 255, .02);
  padding: .65rem .7rem;
  color: rgb(209 213 219);
  font-size: .82rem;
  font-weight: 600;
  transition: all .15s ease;
}

.tool-btn:hover {
  border-color: rgba(139, 92, 246, .35);
  background: rgba(139, 92, 246, .12);
  color: rgb(233 213 255);
}
</style>
