import { ref, computed } from 'vue'
import type { Media } from '@/types'

const KEY = 'mt_recent_media_id'

export function useRecentMedia() {
  const recentMediaId = ref<string | null>(getRecentMediaId())

  function saveRecentMediaId(mediaId: string) {
    recentMediaId.value = mediaId
    localStorage.setItem(KEY, mediaId)
  }

  function getRecentMediaId(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  }

  function clearRecentMediaId() {
    recentMediaId.value = null
    localStorage.removeItem(KEY)
  }

  function getRecentMedia(allMedia: Media[]): Media | null {
    if (!recentMediaId.value) return null
    return allMedia.find(m => m.$id === recentMediaId.value) ?? null
  }

  return {
    recentMediaId: computed(() => recentMediaId.value),
    saveRecentMediaId,
    clearRecentMediaId,
    getRecentMedia,
  }
}
