<template>
  <div class="min-h-screen text-white flex flex-col relative">
    <DynamicBackground :type="media.filterType as any" />

    <AppHeader @add="formDrawer = true" @stats="statsDrawer = true" @random="randomDrawer = true" @import="importDrawer = true" @calendar="calendarDrawer = true" />
    <FilterBar ref="filterBarRef" />

    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">

      <!-- Section banner -->
      <SectionBanner :type="media.filterType" />

      <!-- Skeleton -->
      <div v-if="media.loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
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

    <!-- Mobile bottom navigation -->
    <BottomNav
      active="library"
      @library="() => {}"
      @add="formDrawer = true"
      @calendar="calendarDrawer = true"
      @random="randomDrawer = true"
      @stats="statsDrawer = true"
    />

    <!-- Detail drawer -->
    <DetailDrawer
      v-model="detailDrawer"
      :media="detailTarget"
      @edit="openEdit"
      @delete="handleDelete"
    />

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
import { ref, onMounted } from 'vue'
import { Inbox, Plus, SearchX, Trash2 } from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import { useKeyboard }   from '@/composables/useKeyboard'
import type { Media } from '@/types'
import AppHeader          from '@/components/layout/AppHeader.vue'
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
import DynamicBackground  from '@/components/layout/DynamicBackground.vue'

const media = useMediaStore()
const ui    = useUiStore()

const formDrawer   = ref(false)
const detailDrawer = ref(false)
const statsDrawer  = ref(false)
const randomDrawer = ref(false)
const importDrawer  = ref(false)
const calendarDrawer = ref(false)
const editTarget   = ref<Media | null>(null)
const detailTarget = ref<Media | null>(null)
const deleteTarget = ref<string | null>(null)
const filterBarRef = ref<InstanceType<typeof FilterBar>>()

onMounted(() => media.fetch())

useKeyboard({
  onNew:    () => { formDrawer.value = true },
  onSearch: () => { filterBarRef.value?.focusSearch() },
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
</script>

<style scoped>
.scale-enter-active { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
.scale-leave-active { transition: all .15s ease-in; }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(.9); }
</style>
