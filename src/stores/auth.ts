import { defineStore } from 'pinia'
import { ref }          from 'vue'
import { account }      from '@/lib/appwrite'
import type { Models }  from 'appwrite'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<Models.User<Models.Preferences> | null>(null)
  const loading = ref(true)
  const initialized = ref(false)
  let initPromise: Promise<void> | null = null

  function isTransientAuthError(rawError: unknown) {
    const error = rawError as { message?: string; code?: number; type?: string }
    const msg = (error?.message ?? '').toLowerCase()
    const type = (error?.type ?? '').toLowerCase()

    return (
      error?.code === 0 ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network error') ||
      msg.includes('err_failed') ||
      msg.includes('cors') ||
      type.includes('network')
    )
  }

  async function resolveCurrentUser(retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await account.get()
      } catch (error) {
        if (attempt === retries || !isTransientAuthError(error)) throw error
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
      }
    }

    return null
  }

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

  async function login(email: string, password: string, retries = 2) {
    loading.value = true
    try {
      let sessionCreated = false
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          await account.createEmailPasswordSession(email, password)
          sessionCreated = true
          break
        } catch (error) {
          if (attempt === retries || !isTransientAuthError(error)) throw error
          console.warn('[Auth] Reintentando login después de fallo transitorio...')
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
        }
      }

      if (sessionCreated) {
        user.value = await resolveCurrentUser()
      }
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, retries = 2) {
    loading.value = true
    try {
      const name = email.split('@')[0]

      await account.create('unique()', email, password, name)

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          await account.createEmailPasswordSession(email, password)
          break
        } catch (error) {
          if (attempt === retries || !isTransientAuthError(error)) throw error
          console.warn('[Auth] Reintentando sesión tras registrar cuenta...')
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
        }
      }

      user.value = await resolveCurrentUser()
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try { await account.deleteSession('current') } catch (e) { console.warn('[Auth] Failed to delete session during logout', e) }
    user.value = null
    initialized.value = true
    loading.value = false
  }

  async function changePassword(current: string, next: string) {
    await account.updatePassword(next, current)
  }

  return { user, loading, initialized, init, login, register, logout, changePassword }
})
