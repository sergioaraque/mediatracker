import { defineStore } from 'pinia'
import { ref }          from 'vue'
import { account }      from '@/lib/appwrite'
import type { Models }  from 'appwrite'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<Models.User<Models.Preferences> | null>(null)
  const loading = ref(true)

  async function init() {
    try   { user.value = await account.get() }
    catch { user.value = null }
    finally { loading.value = false }
  }

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password)
    user.value = await account.get()
  }

  async function register(email: string, password: string) {
    const name = email.split('@')[0]
    await account.create('unique()', email, password, name)
    await account.createEmailPasswordSession(email, password)
    user.value = await account.get()
  }

  async function logout() {
    try { await account.deleteSession('current') } catch {}
    user.value = null
  }

  async function changePassword(current: string, next: string) {
    await account.updatePassword(next, current)
  }

  return { user, loading, init, login, register, logout, changePassword }
})
