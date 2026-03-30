<template>
  <header class="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">

        <!-- Logo -->
        <div class="flex items-center gap-2.5 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Clapperboard class="w-4 h-4 text-white" />
          </div>
          <span class="font-bold text-white tracking-tight hidden sm:block">MediaTracker</span>
        </div>

        <!-- Stats pills -->
        <div class="hidden md:flex items-center gap-2">
          <StatPill :count="counts.movie"  :avg="avgRatings.movie"  label="Películas" color="bg-blue-500/10 text-blue-300   border-blue-500/20" />
          <StatPill :count="counts.series" :avg="avgRatings.series" label="Series"    color="bg-violet-500/10 text-violet-300 border-violet-500/20" />
          <StatPill :count="counts.book"   :avg="avgRatings.book"   label="Libros"    color="bg-amber-500/10 text-amber-300  border-amber-500/20" />
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="$emit('import')"
            class="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl"
            title="Importar colección"
          >
            <Upload class="w-4 h-4" />
            <span class="hidden lg:inline">Importar</span>
          </button>
          <button
            @click="$emit('random')"
            class="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl"
            title="¿Qué veo esta noche?"
          >
            <Dices class="w-4 h-4" />
            <span class="hidden sm:inline">Aleatorio</span>
          </button>
          <button
            @click="$emit('calendar')"
            class="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl"
            title="Historial"
          >
            <CalendarDays class="w-4 h-4" />
            <span class="hidden sm:inline">Historial</span>
          </button>
          <button
            @click="$emit('stats')"
            class="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl"
            title="Estadísticas"
          >
            <BarChart2 class="w-4 h-4" />
            <span class="hidden sm:inline">Stats</span>
          </button>
          <button
            @click="$emit('add')"
            class="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Añadir</span>
          </button>

          <!-- User menu -->
          <div class="relative" ref="menuRef">
            <button
              @click="open = !open"
              class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {{ initial }}
            </button>

            <Transition name="dropdown">
              <div
                v-if="open"
                class="absolute right-0 mt-2 w-52 rounded-xl bg-gray-900 border border-white/10 shadow-2xl py-1 text-sm"
              >
                <div class="px-4 py-2.5 border-b border-white/5">
                  <p class="text-white font-medium truncate">{{ auth.user?.name }}</p>
                  <p class="text-gray-400 text-xs truncate">{{ auth.user?.email }}</p>
                </div>

                <button
                  @click="openPassword = true; open = false"
                  class="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <KeyRound class="w-4 h-4" /> Cambiar contraseña
                </button>

                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut class="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Change password drawer -->
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="openPassword" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" @click="openPassword = false" />
    </Transition>
    <Transition name="drawer">
      <div v-if="openPassword" class="fixed inset-y-0 right-0 w-full max-w-sm bg-gray-900 border-l border-white/10 z-50 flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-white/5">
          <h2 class="text-lg font-semibold text-white">Cambiar contraseña</h2>
          <button @click="openPassword = false" class="btn-ghost p-2 rounded-lg"><X class="w-5 h-5" /></button>
        </div>
        <div class="flex-1 p-6 flex flex-col gap-4">
          <div>
            <label class="label">Contraseña actual</label>
            <input v-model="pwForm.current" type="password" class="input" placeholder="••••••••" />
          </div>
          <div>
            <label class="label">Nueva contraseña</label>
            <input v-model="pwForm.next" type="password" class="input" placeholder="••••••••" />
          </div>
          <div>
            <label class="label">Confirmar nueva</label>
            <input v-model="pwForm.confirm" type="password" class="input" placeholder="••••••••" />
          </div>
          <p v-if="pwError" class="text-red-400 text-sm">{{ pwError }}</p>
        </div>
        <div class="p-6 border-t border-white/5">
          <button @click="handleChangePassword" :disabled="savingPw" class="btn-primary w-full">
            {{ savingPw ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Clapperboard, Plus, LogOut, KeyRound, X, BarChart2, Dices, Upload, CalendarDays } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'
import StatPill from './StatPill.vue'

defineEmits<{ add: []; stats: []; random: []; import: []; calendar: [] }>()

const auth   = useAuthStore()
const media  = useMediaStore()
const ui     = useUiStore()
const router = useRouter()

const open         = ref(false)
const openPassword = ref(false)
const menuRef      = ref<HTMLElement>()
const savingPw     = ref(false)
const pwError      = ref('')
const pwForm       = ref({ current: '', next: '', confirm: '' })

const initial = computed(() => (auth.user?.name?.[0] ?? auth.user?.email?.[0] ?? '?').toUpperCase())

const counts = computed(() => ({
  movie:  media.all.filter(m => m.type === 'movie').length,
  series: media.all.filter(m => m.type === 'series').length,
  book:   media.all.filter(m => m.type === 'book').length,
}))

const avgRatings = computed(() => {
  const calc = (type: string) => {
    const rated = media.all.filter(m => m.type === type && m.rating)
    if (!rated.length) return null
    return (rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length).toFixed(1)
  }
  return { movie: calc('movie'), series: calc('series'), book: calc('book') }
})

function onClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) open.value = false
}
onMounted(()  => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

async function handleLogout() {
  open.value = false
  await auth.logout()
  router.push('/login')
}

async function handleChangePassword() {
  pwError.value = ''
  if (pwForm.value.next !== pwForm.value.confirm) { pwError.value = 'Las contraseñas no coinciden'; return }
  if (pwForm.value.next.length < 8) { pwError.value = 'Mínimo 8 caracteres'; return }
  savingPw.value = true
  try {
    await auth.changePassword(pwForm.value.current, pwForm.value.next)
    ui.toast('Contraseña actualizada')
    openPassword.value = false
    pwForm.value = { current: '', next: '', confirm: '' }
  } catch (e: any) {
    pwError.value = e?.message ?? 'Error al cambiar contraseña'
  } finally {
    savingPw.value = false
  }
}
</script>

<style scoped>
.dropdown-enter-active { transition: all .15s cubic-bezier(.34,1.56,.64,1); }
.dropdown-leave-active { transition: all .1s ease-in; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: scale(.95) translateY(-.5rem); }
</style>
