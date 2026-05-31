import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock tmdb helpers and media store
vi.mock('@/lib/tmdb', () => ({
  fetchRecommendations: vi.fn(async () => []),
  fetchTrending: vi.fn(async () => [{ id: 999, title: 'Trending', media_type: 'movie' }]),
}))

vi.mock('@/stores/media', () => ({
  useMediaStore: () => ({ all: [
    { $id: '10', title: 'Local Show', type: 'series', status: 'pending', cover_url: null, year: 2022 } as any,
  ] })
}))

import { useRecommendationsStore } from '../recommendations'

describe('recommendations store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('returns local mapped recommendations when TMDB empty', async () => {
    const store = useRecommendationsStore()
    const res = await store.combinedFor({ title: 'Local Show', type: 'series' }, 6)
    expect(res.length).toBeGreaterThan(0)
    expect(res.find(r => r.title === 'Local Show')).toBeTruthy()
  })
})
