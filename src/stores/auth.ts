import { defineStore } from 'pinia'
import { ref }          from 'vue'
import { account }      from '@/lib/appwrite'
import type { Models }  from 'appwrite'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<Models.User<Models.Preferences> | null>(null)
  const loading = ref(true)
  const initialized = ref(false)
  let initPromise: Promise<void> | null = null

  async function init() {
    if (initialized.value) return
    if (initPromise) return initPromise

    loading.value = true
    initPromise = (async () => {
      try   { user.value = await account.get() }
      catch { user.value = null }
      finally {
        loading.value = false
        initialized.value = true
      }
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  }

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password)
    user.value = await account.get()
    initialized.value = true
    loading.value = false
  }

  async function register(email: string, password: string) {
    const name = email.split('@')[0]
    await account.create('unique()', email, password, name)
    await account.createEmailPasswordSession(email, password)
    user.value = await account.get()
    initialized.value = true
    loading.value = false
  }

  async function logout() {
    try { await account.deleteSession('current') } catch {}
    user.value = null
    initialized.value = true
    loading.value = false
  }

  async function changePassword(current: string, next: string) {
    await account.updatePassword(next, current)
  }

  return { user, loading, init, login, register, logout, changePassword }
})
