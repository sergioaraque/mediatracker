export interface WatchEntry {
  watchedAt: string
}

export interface WatchActivitySummary {
  total: number
  recentTotal: number
  topMediaIds: string[]
  recentCounts: Record<string, number>
  lastWatchedAt: string | null
}

const KEY = 'mt_watch_history'

function load(): Record<string, WatchEntry[]> {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    // Validate structure: ensure all values are WatchEntry[] arrays
    if (typeof data !== 'object' || data === null) return {}
    const cleaned: Record<string, WatchEntry[]> = {}
    for (const [mediaId, entries] of Object.entries(data)) {
      if (Array.isArray(entries) && entries.every(e => typeof e === 'object' && e !== null && typeof (e as any).watchedAt === 'string')) {
        cleaned[mediaId] = entries as WatchEntry[]
      }
    }
    return cleaned
  }
  catch (e) { console.warn('[MediaTracker] Failed to parse watch history from localStorage', e); return {} }
}

export function addWatchEntry(mediaId: string): void {
  const data = load()
  if (!data[mediaId]) data[mediaId] = []
  data[mediaId].push({ watchedAt: new Date().toISOString() })
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getWatchHistory(mediaId: string): WatchEntry[] {
  return load()[mediaId] ?? []
}

export function getWatchActivitySummary(days = 7): WatchActivitySummary {
  const data = load()
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
  const recentCounts = new Map<string, number>()

  let total = 0
  let recentTotal = 0
  let lastWatchedAt: string | null = null

  for (const [mediaId, entries] of Object.entries(data)) {
    total += entries.length

    for (const entry of entries) {
      const timestamp = Date.parse(entry.watchedAt)
      if (Number.isNaN(timestamp)) continue

      if (!lastWatchedAt || timestamp > Date.parse(lastWatchedAt)) {
        lastWatchedAt = entry.watchedAt
      }

      if (timestamp >= cutoff) {
        recentTotal += 1
        recentCounts.set(mediaId, (recentCounts.get(mediaId) ?? 0) + 1)
      }
    }
  }

  const topMediaIds = [...recentCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([mediaId]) => mediaId)
    .slice(0, 3)

  return {
    total,
    recentTotal,
    topMediaIds,
    recentCounts: Object.fromEntries(recentCounts),
    lastWatchedAt,
  }
}
