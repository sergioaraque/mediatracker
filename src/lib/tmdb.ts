const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string
const BASE    = 'https://api.themoviedb.org/3'

export interface TmdbRecommendation {
  id:               number
  title?:           string   // movies
  name?:            string   // tv
  poster_path:      string | null
  release_date?:    string   // movies
  first_air_date?:  string   // tv
  vote_average:     number
  overview:         string
  genre_ids:        number[]
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${API_KEY}&language=es-ES`)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

export async function fetchRecommendations(
  title: string,
  type: 'movie' | 'series',
): Promise<TmdbRecommendation[]> {
  const tmdbType = type === 'movie' ? 'movie' : 'tv'

  // 1. Search to get TMDB id
  const search = await get<{ results: { id: number }[] }>(
    `/search/${tmdbType}?query=${encodeURIComponent(title)}`
  )
  if (!search.results?.length) return []

  const id = search.results[0].id

  // 2. Fetch recommendations for that id
  const recs = await get<{ results: TmdbRecommendation[] }>(
    `/${tmdbType}/${id}/recommendations`
  )
  return recs.results?.slice(0, 16) ?? []
}

export function tmdbPoster(path: string | null, size = 'w300'): string {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : ''
}

export function tmdbYear(item: TmdbRecommendation): number | null {
  const raw = item.release_date ?? item.first_air_date ?? ''
  const y   = parseInt(raw.slice(0, 4))
  return isNaN(y) ? null : y
}

export function tmdbDisplayTitle(item: TmdbRecommendation): string {
  return item.title ?? item.name ?? '—'
}
