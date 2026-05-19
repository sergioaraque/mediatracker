import { createApp }             from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App                       from './App.vue'
import router                    from './router'
import './assets/main.css'

// Create and activate pinia BEFORE the router is installed so that
// router guards (beforeEach) can call useXxxStore() without errors.
const pinia = createPinia()
setActivePinia(pinia)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')

// Only register the service worker in production.
// In dev the SW cache interferes with Vite's hot-reload and causes
// stale/HTML responses for files like config.js.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(registration => {
    const notifyUpdate = () => {
      if (!registration.waiting) return
      window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: { registration } }))
    }

    if (registration.waiting) notifyUpdate()

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing
      if (!installing) return

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          notifyUpdate()
        }
      })
    })
  }).catch(() => {})
}
