import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMediaStore } from '../media'

describe('media store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sorts by title ASC and DESC', () => {
    const store = useMediaStore()
    store.all = [
      { $id: '1', title: 'BBB', $createdAt: '2020-01-01', rating: 0 } as any,
      { $id: '2', title: 'AAA', $createdAt: '2021-01-01', rating: 0 } as any,
    ]
    store.sortField = 'title'
    store.sortOrder = 'ASC'
    expect(store.sorted[0].title).toBe('AAA')
    store.sortOrder = 'DESC'
    expect(store.sorted[0].title).toBe('BBB')
  })

  it('filters by status and search', () => {
    const store = useMediaStore()
    store.all = [
      { $id: '1', title: 'My Movie', status: 'pending', genre: 'Drama', $createdAt: 'a', rating: 0 } as any,
      { $id: '2', title: 'Other', status: 'watched', genre: 'Action', $createdAt: 'b', rating: 0 } as any,
    ]
    store.filterStatus = 'pending'
    expect(store.filtered.length).toBe(1)
    store.filterStatus = null
    store.search = 'my'
    expect(store.filtered.length).toBe(1)
  })
})
