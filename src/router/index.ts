import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }                   from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',      name: 'landing', component: () => import('@/views/LandingView.vue') },
    { path: '/login', name: 'login',   component: () => import('@/views/LoginView.vue') },
    { path: '/app',   name: 'app',     component: () => import('@/views/HomeView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Esperar a que la sesión se resuelva
  if (auth.loading) {
    await new Promise<void>(resolve => {
      const unwatch = setInterval(() => {
        if (!auth.loading) { clearInterval(unwatch); resolve() }
      }, 50)
    })
  }

  if (to.meta.requiresAuth && !auth.user) return { name: 'login' }
  if (to.name === 'login' && auth.user)   return { name: 'app' }
})

export default router
