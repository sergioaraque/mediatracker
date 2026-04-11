const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string
const BASE    = 'https://api.themoviedb.org/3'

export interface TmdbRecommendation {
  id:               number
  title?:           string
  name?:            string
  poster_path:      string | null
  release_date?:    string
  first_air_date?:  string
  vote_average:     number
  overview:         string
  genre_ids:        number[]
  media_type?:      'movie' | 'tv' | 'person'
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${API_KEY}&language=es-ES`)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

export async function fetchTrending(type: 'movie' | 'tv'): Promise<TmdbRecommendation[]> {
  const res = await get<{ results: TmdbRecommendation[] }>(`/trending/${type}/week?`)
  return res.results?.slice(0, 20) ?? []
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
  if (isNaN(y) || y < 1888 || y > new Date().getFullYear() + 2) return null
  return y
}

export function tmdbDisplayTitle(item: TmdbRecommendation): string {
  return item.title ?? item.name ?? '—'
}

export async function fetchSearch(query: string, type?: 'movie' | 'tv'): Promise<TmdbRecommendation[]> {
  if (!query.trim()) return []
  const endpoint = type ? `/search/${type}` : '/search/multi'
  const res = await get<{ results: TmdbRecommendation[] }>(`${endpoint}?query=${encodeURIComponent(query)}`)
  const results = res.results ?? []
  if (!type) return results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 20)
  return results.slice(0, 20)
}

export async function fetchDiscover(
  type: 'movie' | 'tv',
  opts: {
    genreIds?: number[];
    yearFrom?: number;
    yearTo?: number;
    minRating?: number;
    runtimeMin?: number;
    runtimeMax?: number;
    castIds?: number[];
  },
): Promise<TmdbRecommendation[]> {
  const p = new URLSearchParams()
  if (opts.genreIds?.length)   p.set('with_genres', opts.genreIds.join(','))
  if (opts.minRating) p.set('vote_average.gte', String(opts.minRating))
  if (opts.castIds?.length && type === 'movie') p.set('with_cast', opts.castIds.join(','))
  p.set('sort_by', 'vote_count.desc')
  
  if (type === 'movie') {
    if (opts.yearFrom) p.set('primary_release_date.gte', `${opts.yearFrom}-01-01`)
    if (opts.yearTo)   p.set('primary_release_date.lte', `${opts.yearTo}-12-31`)
    if (opts.runtimeMin) p.set('with_runtime.gte', String(opts.runtimeMin))
    if (opts.runtimeMax) p.set('with_runtime.lte', String(opts.runtimeMax))
  } else {
    if (opts.yearFrom) p.set('first_air_date.gte', `${opts.yearFrom}-01-01`)
    if (opts.yearTo)   p.set('first_air_date.lte', `${opts.yearTo}-12-31`)
  }
  const res = await get<{ results: TmdbRecommendation[] }>(`/discover/${type}?${p.toString()}`)
  return res.results?.slice(0, 20) ?? []
}

export async function searchActors(query: string): Promise<Array<{ id: number; name: string; profile_path: string | null }>> {
  if (!query.trim()) return []
  const res = await get<{ results: Array<{ id: number; name: string; profile_path: string | null }> }>(
    `/search/person?query=${encodeURIComponent(query)}`
  )
  return res.results?.slice(0, 10) ?? []
}

export async function fetchUpcoming(): Promise<TmdbRecommendation[]> {
  const res = await get<{ results: TmdbRecommendation[] }>('/movie/upcoming?')
  return res.results?.slice(0, 20) ?? []
}

export async function fetchOnTheAir(): Promise<TmdbRecommendation[]> {
  const res = await get<{ results: TmdbRecommendation[] }>('/tv/on_the_air?')
  return res.results?.slice(0, 20) ?? []
}
