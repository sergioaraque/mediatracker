import { computed } from 'vue'
import type { Media } from '@/types'
import { getWatchActivitySummary } from '@/lib/watchHistory'
import { useQueue } from '@/composables/useQueue'
import { useRecentMedia } from '@/composables/useRecentMedia'
import { useMediaStore } from '@/stores/media'

export type ActivityTitle = { id: string; title: string; count: number }

export type SuggestedNowItem = Media & {
  reason: string
  subtitle: string
  score: number
}

export type ActivitySummary = {
  recentTotal: number
  total: number
  topTitles: ActivityTitle[]
}

function daysSince(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY
  const delta = Date.now() - new Date(value).getTime()
  return Number.isNaN(delta) ? Number.POSITIVE_INFINITY : Math.max(0, delta / (1000 * 60 * 60 * 24))
}

export function useHomeInsights() {
  const media = useMediaStore()
  const q = useQueue()
  const recent = useRecentMedia()

  const queuedIds = computed(() => new Set(q.queueIds.value))

  const nextInQueue = computed(() => {
    for (const id of q.queueIds.value) {
      const item = media.all.find(m => m.$id === id && m.status === 'pending')
      if (item) return item
    }
    return null
  })

  const recentMedia = computed(() => recent.getRecentMedia(media.all))

  const activitySummary = computed<ActivitySummary>(() => {
    const summary = getWatchActivitySummary(7)
    const topTitles = summary.topMediaIds
      .map(mediaId => {
        const item = media.all.find(m => m.$id === mediaId)
        if (!item) return null
        return {
          id: mediaId,
          title: item.title,
          count: summary.recentCounts[mediaId] ?? 0,
        }
      })
      .filter((item): item is ActivityTitle => item !== null)

    return { ...summary, topTitles }
  })

  function recommendationReason(item: Media): string {
    if (queuedIds.value.has(item.$id)) return 'En cola'
    if (item.status === 'watching') return 'En marcha'
    if (item.rating && item.rating >= 8) return 'Top rated'
    if (item.finished_at && daysSince(item.finished_at) <= 30) return 'Reciente'
    return 'Pendiente'
  }

  function recommendationSubtitle(item: Media): string {
    if (item.status === 'watching' && item.type === 'series') {
      return item.current_season && item.current_episode
        ? `T${item.current_season} E${item.current_episode} · sigue donde lo dejaste`
        : 'Serie en progreso'
    }
    if (item.status === 'watching') return 'Lo dejaste a medias y puedes retomarlo ahora'
    if (item.rating && item.rating >= 8) return 'Tiene buena nota en tu colección'
    if (queuedIds.value.has(item.$id)) return 'Está en tu cola de pendientes'
    return 'Una buena candidata para seguir hoy'
  }

  function recommendationScore(item: Media): number {
    let score = 0

    if (queuedIds.value.has(item.$id)) score += 70
    if (item.status === 'watching') score += 60
    if (item.status === 'pending') score += 35
    if (item.type === 'series' && item.status === 'watching') score += 20
    if (item.rating) score += Math.min(item.rating, 10) * 4

    const recentDelta = item.status === 'watching'
      ? daysSince(item.$updatedAt)
      : daysSince(item.finished_at)
    if (Number.isFinite(recentDelta)) score += Math.max(0, 20 - recentDelta)

    return score
  }

  const recommendedNow = computed<SuggestedNowItem[]>(() => {
    return media.all
      .filter(item => item.status !== 'dropped')
      .filter(item => item.$id !== nextInQueue.value?.$id)
      .filter(item => item.$id !== recentMedia.value?.$id)
      .map(item => ({
        ...item,
        reason: recommendationReason(item),
        subtitle: recommendationSubtitle(item),
        score: recommendationScore(item),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  })

  return {
    nextInQueue,
    recentMedia,
    activitySummary,
    recommendedNow,
  }
}