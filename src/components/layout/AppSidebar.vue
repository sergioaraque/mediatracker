<template>
  <aside
    class="hidden md:flex flex-col shrink-0 bg-gray-950 border-r border-white/8 h-screen sticky top-0 z-30 overflow-hidden transition-[width] duration-200 ease-in-out"
    :class="ui.sidebarExpanded ? 'w-56' : 'w-[60px]'"
  >

    <!-- Header: logo when expanded, just toggle when collapsed -->
    <div
      class="flex items-center h-16 border-b border-white/5 shrink-0"
      :class="ui.sidebarExpanded ? 'px-3 gap-2' : 'justify-center px-0'"
    >
      <div v-show="ui.sidebarExpanded" class="flex items-center gap-2.5 flex-1 min-w-0">
        <div class="relative shrink-0">
          <div class="absolute inset-0 rounded-xl bg-violet-500/30 blur-md" />
          <div class="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Clapperboard class="w-4 h-4 text-white" />
          </div>
        </div>
        <span class="font-bold text-white tracking-tight whitespace-nowrap">MediaTracker</span>
      </div>

      <button
        @click="ui.sidebarExpanded = !ui.sidebarExpanded"
        class="btn-ghost p-1.5 rounded-lg shrink-0"
        :title="ui.sidebarExpanded ? 'Colapsar menú' : 'Expandir menú'"
      >
        <PanelLeft
          class="w-4 h-4 transition-transform duration-200"
          :class="!ui.sidebarExpanded && 'rotate-180'"
        />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto overflow-x-hidden scrollbar-none">

      <!-- Colección — active page indicator -->
      <div
        class="flex items-center h-10 rounded-xl bg-violet-500/15 text-violet-300 mb-1 shrink-0"
        :class="ui.sidebarExpanded ? 'gap-3 px-2' : 'justify-center px-0'"
      >
        <LayoutGrid class="w-5 h-5 shrink-0" />
        <span v-show="ui.sidebarExpanded" class="text-sm font-semibold whitespace-nowrap">Colección</span>
      </div>

      <button
        v-for="item in navItems"
        :key="item.id"
        @click="handleNav(item.emit)"
        class="flex items-center h-10 w-full rounded-xl btn-ghost shrink-0"
        :class="ui.sidebarExpanded ? 'gap-3 px-2 justify-start' : 'justify-center px-0'"
        :title="!ui.sidebarExpanded ? item.label : undefined"
      >
        <component :is="item.icon" class="w-5 h-5 shrink-0" :class="item.iconColor ?? 'text-gray-400'" />
        <span v-show="ui.sidebarExpanded" class="text-sm text-gray-300 whitespace-nowrap">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Add button -->
    <div class="px-2 pb-4 shrink-0">
      <button
        @click="emit('add')"
        class="btn-primary w-full flex items-center gap-2 py-2.5"
        :class="ui.sidebarExpanded ? 'px-4 justify-start' : 'px-0 justify-center'"
        :title="!ui.sidebarExpanded ? 'Añadir' : undefined"
      >
        <Plus class="w-4 h-4 shrink-0" />
        <span v-show="ui.sidebarExpanded" class="whitespace-nowrap">Añadir</span>
      </button>
    </div>

  </aside>
</template>

<script setup lang="ts">
import {
  Clapperboard, LayoutGrid, Search, Compass, CalendarDays,
  ListOrdered, History, BarChart2, Dices, Upload, Plus, PanelLeft,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const emit = defineEmits<{
  add:                  []
  search:               []
  discover:             []
  advancedDiscovery:    []
  upcoming:             []
  queue:                []
  calendar:             []
  stats:                []
  random:               []
  import:               []
}>()

type NavEmit = 'search' | 'discover' | 'advancedDiscovery' | 'upcoming' | 'queue' | 'calendar' | 'stats' | 'random' | 'import'

const navItems: { id: string; icon: unknown; label: string; emit: NavEmit; iconColor?: string }[] = [
  { id: 'search',             icon: Search,       label: 'Buscar',           emit: 'search'           },
  { id: 'discover',           icon: Compass,      label: 'Descubrir',        emit: 'discover'         },
  { id: 'advancedDiscovery',  icon: Search,       label: 'Buscar experto',   emit: 'advancedDiscovery', iconColor: 'text-violet-400' },
  { id: 'upcoming',           icon: CalendarDays, label: 'Estrenos',         emit: 'upcoming', iconColor: 'text-rose-400' },
  { id: 'queue',              icon: ListOrdered,  label: 'Cola',             emit: 'queue'    },
  { id: 'calendar',           icon: History,      label: 'Historial',        emit: 'calendar' },
  { id: 'stats',              icon: BarChart2,    label: 'Stats',            emit: 'stats'    },
  { id: 'random',             icon: Dices,        label: 'Aleatorio',        emit: 'random'   },
  { id: 'import',             icon: Upload,       label: 'Importar',         emit: 'import'   },
]

function handleNav(ev: NavEmit) {
  emit(ev)
}
</script>
