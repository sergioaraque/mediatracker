import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }                   from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',      name: 'landing', component: () => import('@/views/LandingView.vue') },
    { path: '/login', name: 'login',   component: () => import('@/views/LoginView.vue') },
    { path: '/app',      name: 'app',      component: () => import('@/views/HomeView.vue'),     meta: { requiresAuth: true } },
    { path: '/upcoming', name: 'upcoming', component: () => import('@/views/UpcomingView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Ensure auth state is resolved before applying route rules.
  await auth.init()

  if (to.meta.requiresAuth && !auth.user) return { name: 'login' }
  if (to.name === 'login' && auth.user)   return { name: 'app' }
})

export default router
