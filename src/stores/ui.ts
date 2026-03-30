import { defineStore } from 'pinia'
import { ref }          from 'vue'
import type { Media }   from '@/types'

export interface Toast {
  id:      string
  message: string
  type:    'success' | 'error'
}

export const useUiStore = defineStore('ui', () => {
  const toasts               = ref<Toast[]>([])
  const viewMode             = ref<'grid' | 'list'>('grid')
  const pendingRatingMedia   = ref<Media | null>(null)
  const showCommandPalette   = ref(false)

  function toast(message: string, type: Toast['type'] = 'success') {
    const id = Math.random().toString(36).slice(2)
    toasts.value.push({ id, message, type })
    setTimeout(() => dismiss(id), 3200)
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, toast, dismiss, viewMode, pendingRatingMedia, showCommandPalette }
})
