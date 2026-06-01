import { defineStore } from 'pinia'
import { ref } from 'vue'
import Fuse from 'fuse.js'
import { fetchRecommendations, fetchTrending, tmdbDisplayTitle, type TmdbRecommendation } from '@/lib/tmdb'
import { useMediaStore } from './media'
import type { Media } from '@/types'

type RecommendationContext = Pick<Media, 'title' | 'type' | 'genre' | 'platform' | 'year' | 'description'>

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function recommendationKey(item: { title?: string; name?: string }) {
  return normalizeText(item.title ?? item.name ?? '')
}

function candidateQuery(media: RecommendationContext) {
  return [media.title, media.genre, media.platform, media.description]
    .filter(Boolean)
    .join(' ')
}

export const useRecommendationsStore = defineStore('recommendations', () => {
  const cache = ref<Record<string, TmdbRecommendation[]>>({})
  const cacheTimestamps = ref<Record<string, number>>({})
  const CACHE_TTL_MS = 1000 * 60 * 60 // 1h

  // Local similarity using Fuse on the user's collection.
  function localSimilar(media: RecommendationContext, mediaList: Media[], limit = 4) {
    try {
      const query = candidateQuery(media)
      const candidates = (mediaList || [])
        .filter((m: Media) => m.title && normalizeText(m.title) !== normalizeText(media.title))
        .filter((m: Media) => m.status !== 'dropped')
        const FuseCtor = Fuse as unknown as new (items: Media[], options: Record<string, unknown>) => {
          search(query: string): Array<{ item: Media }>
        }
        const fuse = new FuseCtor(candidates, {
          keys: [
            { name: 'title', weight: 0.6 },
            { name: 'genre', weight: 0.25 },
            { name: 'platform', weight: 0.15 },
            { name: 'description', weight: 0.1 },
          ],
          threshold: 0.4,
          ignoreLocation: true,
        })
        const results = fuse.search(query)
        return results.map(result => result.item).slice(0, limit)
    } catch {
      return []
    }
  }

  function rankByContext(items: TmdbRecommendation[], media: RecommendationContext, seedTitles: string[]) {
    const normalizedTitle = normalizeText(media.title)
    const normalizedSeeds = seedTitles.map(normalizeText).filter(Boolean)
    return [...items].sort((a, b) => score(b) - score(a))

    function score(item: TmdbRecommendation) {
      const itemTitle = recommendationKey(item)
      let score = 0

      if (itemTitle === normalizedTitle) return -Infinity
      for (const seedTitle of normalizedSeeds) {
        if (itemTitle === seedTitle) return -Infinity
      }

      const titleTokens = new Set(normalizedTitle.split(' ').filter(Boolean))
      const itemTokens = new Set(itemTitle.split(' ').filter(Boolean))
      let titleMatches = 0
      for (const token of titleTokens) if (itemTokens.has(token)) titleMatches += 1
      score += titleMatches * 18

      for (const seedTitle of normalizedSeeds) {
        const seedTokens = new Set(seedTitle.split(' ').filter(Boolean))
        let overlap = 0
        for (const token of seedTokens) if (itemTokens.has(token)) overlap += 1
        score = Math.max(score, overlap * 15)
      }

      if (item.media_type && item.media_type === (media.type === 'movie' ? 'movie' : 'tv')) score += 16
      score += item.vote_average * 2.3

      const year = parseInt((item.release_date ?? item.first_air_date ?? '').slice(0, 4))
      if (!Number.isNaN(year) && media.year) {
        const delta = Math.abs(year - media.year)
        score += Math.max(0, 10 - delta * 2)
      }

      return score
    }
  }

  async function combinedFor(media: RecommendationContext, limit = 12) {
    const key = `${media.title}::${media.type}::${media.year ?? ''}::${media.genre ?? ''}`
    const ts = cacheTimestamps.value[key]
    if (cache.value[key] && ts && (Date.now() - ts) < CACHE_TTL_MS) return cache.value[key].slice(0, limit)

    const mediaStore = useMediaStore()
    // 1) TMDB recommendations from the current title (preferential)
    let tmdb: TmdbRecommendation[] = []
    try {
      tmdb = await fetchRecommendations(media.title, (media.type === 'movie' ? 'movie' : 'series'))
    } catch {
      // ignore
    }

    // 2) Use the user's nearest matches as seeds to fetch more TMDB items.
    const locals = localSimilar(media, mediaStore.all || [], 4)
    const seedTitles = locals.map((item: Media) => item.title).filter((title): title is string => Boolean(title))
    const seedRecommendationLists = await Promise.all(
      locals.map(async (seed: Media) => {
        try {
          return await fetchRecommendations(seed.title, seed.type === 'movie' ? 'movie' : 'series')
        } catch {
          return [] as TmdbRecommendation[]
        }
      })
    )

    // Merge: prefer TMDB from the current item, then recommendations from related seeds.
    const merged: TmdbRecommendation[] = []
    const seenTitles = new Set<string>()
    const existingLibraryTitles = new Set((mediaStore.all || []).map(item => normalizeText(item.title)))

    function pushItem(item: TmdbRecommendation) {
      const key = recommendationKey(item)
      if (!key || seenTitles.has(key)) return
      if (existingLibraryTitles.has(key)) return
      seenTitles.add(key)
      merged.push(item)
    }

    for (const item of rankByContext(tmdb, media, seedTitles)) pushItem(item)
    for (const list of seedRecommendationLists) {
      for (const item of rankByContext(list, media, seedTitles)) pushItem(item)
    }

    // Fallback: trending if empty
    if (merged.length === 0) {
      try {
        const t = await fetchTrending(media.type === 'movie' ? 'movie' : 'tv')
        for (const item of rankByContext(t, media, seedTitles)) pushItem(item)
      } catch {
        // ignore
      }
    }

    cache.value[key] = merged
    return merged.slice(0, limit)
  }

  return { combinedFor }
})
