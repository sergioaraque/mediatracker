const KEY = 'mt_ep_tracker'

// { mediaId: { "season": [ep1, ep2, ...] } }  — season key is string (JSON)
type EpData = Record<string, Record<string, number[]>>

function load(): EpData {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

function save(data: EpData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getWatched(mediaId: string): Record<string, number[]> {
  return load()[mediaId] ?? {}
}

export function isEpisodeWatched(mediaId: string, season: number, ep: number): boolean {
  return (load()[mediaId]?.[String(season)] ?? []).includes(ep)
}

/** Returns true if the episode was just marked watched, false if it was unmarked. */
export function toggleEpisode(mediaId: string, season: number, ep: number): boolean {
  const data = load()
  if (!data[mediaId]) data[mediaId] = {}
  const key = String(season)
  if (!data[mediaId][key]) data[mediaId][key] = []
  const list = data[mediaId][key]
  const idx  = list.indexOf(ep)
  if (idx === -1) {
    list.push(ep)
    list.sort((a, b) => a - b)
    save(data)
    return true
  }
  list.splice(idx, 1)
  save(data)
  return false
}

export function markSeasonComplete(mediaId: string, season: number, total: number): void {
  const data = load()
  if (!data[mediaId]) data[mediaId] = {}
  data[mediaId][String(season)] = Array.from({ length: total }, (_, i) => i + 1)
  save(data)
}

export function clearSeason(mediaId: string, season: number): void {
  const data = load()
  if (data[mediaId]) {
    delete data[mediaId][String(season)]
    save(data)
  }
}

export function countWatchedInSeason(mediaId: string, season: number): number {
  return (load()[mediaId]?.[String(season)] ?? []).length
}

export function countTotalWatched(mediaId: string): number {
  const seasons = load()[mediaId] ?? {}
  return Object.values(seasons).reduce((sum, eps) => sum + eps.length, 0)
}
