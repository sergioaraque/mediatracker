<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <!-- Background glow -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-sm animate-fade-up">

      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-4">
          <Clapperboard class="w-7 h-7 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white">MediaTracker</h1>
        <p class="text-gray-400 text-sm mt-1">Tu catálogo personal</p>
      </div>

      <!-- Card -->
      <div class="surface rounded-2xl p-8 shadow-2xl">

        <!-- Mode toggle -->
        <div class="flex bg-white/5 rounded-xl p-1 mb-6">
          <button
            @click="mode = 'login'"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150"
            :class="mode === 'login' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'"
          >Entrar</button>
          <button
            @click="mode = 'register'"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150"
            :class="mode === 'register' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'"
          >Registrarse</button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">

          <div>
            <label class="label">Email</label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                class="input pl-10"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label class="label">Contraseña</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                autocomplete="current-password"
                class="input pl-10 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                @click="showPw = !showPw"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Eye v-if="!showPw" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <Transition name="fade">
            <p v-if="error" class="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0" /> {{ error }}
            </p>
          </Transition>

          <button type="submit" :disabled="loading" class="btn-primary w-full mt-2 py-3">
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" />
              {{ mode === 'login' ? 'Entrando…' : 'Creando cuenta…' }}
            </span>
            <span v-else>
              {{ mode === 'login' ? 'Entrar' : 'Crear cuenta' }}
            </span>
          </button>

        </form>
      </div>

      <p class="text-center text-gray-600 text-xs mt-6">
        <RouterLink to="/" class="hover:text-gray-400 transition-colors">← Volver al inicio</RouterLink>
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clapperboard, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const mode     = ref<'login' | 'register'>('login')
const email    = ref('')
const password = ref('')
const showPw   = ref(false)
const loading  = ref(false)
const error    = ref('')

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(email.value, password.value)
    } else {
      await auth.register(email.value, password.value)
    }
    router.push('/app')
  } catch (e: any) {
    const msg = e?.message ?? ''
    error.value = msg.includes('Invalid URL') || msg.includes('Failed to fetch')
      ? 'No se puede conectar con el servidor. Revisa tu configuración de Appwrite.'
      : msg || 'Error de autenticación'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all .2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; transform: translateY(-.25rem); }
</style>
