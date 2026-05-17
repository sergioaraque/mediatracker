export interface WatchEntry {
  watchedAt: string
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
  catch { return {} }
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
