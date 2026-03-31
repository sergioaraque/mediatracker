export interface WatchEntry {
  watchedAt: string
}

const KEY = 'mt_watch_history'

function load(): Record<string, WatchEntry[]> {
  try   { return JSON.parse(localStorage.getItem(KEY) ?? '{}') }
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
