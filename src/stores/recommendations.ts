import { defineStore } from 'pinia'
import { ref } from 'vue'
import Fuse from 'fuse.js'
import { fetchRecommendations, fetchTrending, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
import { useMediaStore } from './media'

export const useRecommendationsStore = defineStore('recommendations', () => {
  const cache = ref<Record<string, TmdbRecommendation[]>>({})

  // Simple local-similarity using Fuse on user's collection
  function localSimilar(targetTitle: string, mediaList: any[], limit = 6) {
    try {
      // Exclude already watched items to surface fresh recommendations
      const candidates = (mediaList || []).filter((m: any) => m.status !== 'watched')
      const fuse = new Fuse(candidates, { keys: [
        { name: 'title', weight: 0.6 },
        { name: 'genre', weight: 0.25 },
        { name: 'platform', weight: 0.15 }
      ], threshold: 0.4, ignoreLocation: true })
      const results = fuse.search(targetTitle)
      return results.map(r => r.item).slice(0, limit)
    } catch {
      return []
    }
  }

  async function combinedFor(media: { title: string; type?: string }, limit = 12) {
    const key = `${media.title}::${media.type}`
    if (cache.value[key]) return cache.value[key].slice(0, limit)

    const mediaStore = useMediaStore()
    // 1) TMDB recommendations (preferential)
    let tmdb: TmdbRecommendation[] = []
    try {
      tmdb = await fetchRecommendations(media.title, (media.type === 'movie' ? 'movie' : 'series'))
    } catch {
      // ignore
    }

    // 2) Local similar items (map to tmdb-like shape when possible)
    const locals = localSimilar(media.title, mediaStore.all || [], 8)
    const localMapped: TmdbRecommendation[] = locals.map((l: any) => ({
      id: Number(l.$id || 0),
      title: l.title,
      name: l.title,
      poster_path: l.cover_url ? l.cover_url.replace(/^https?:\/\/image.tmdb.org\/t\/p\//, '') : null,
      release_date: l.year ? `${l.year}-01-01` : undefined,
      vote_average: l.rating ?? 0,
      overview: l.description ?? '',
      genre_ids: [],
      media_type: media.type === 'movie' ? 'movie' : 'tv',
    }))

    // Merge: prefer tmdb, but append locals not already included
    const ids = new Set(tmdb.map(t => t.id))
    const merged = [...tmdb]
    for (const lm of localMapped) {
      if (!ids.has(lm.id)) merged.push(lm)
    }

    // Fallback: trending if empty
    if (merged.length === 0) {
      try {
        const t = await fetchTrending(media.type === 'movie' ? 'movie' : 'tv')
        merged.push(...t)
      } catch {
        // ignore
      }
    }

    cache.value[key] = merged
    return merged.slice(0, limit)
  }

  return { combinedFor }
})
