import { defineStore }                                        from 'pinia'
import { ref, computed }                                       from 'vue'
import Fuse from 'fuse.js'
import { databases, DB_ID, COLL_MEDIA, COLL_PROGRESS, COLL_STATUS_HISTORY, Query, ID, Permission, Role } from '@/lib/appwrite'
import { hasAppwriteDatabaseConfig, getMissingAppwriteDatabaseConfigMessage } from '@/lib/appwrite'
import type { Media, Progress, MediaFormData, StatusHistory }  from '@/types'
import { useAuthStore }                                        from './auth'
import { useUiStore }                                          from './ui'
import { addWatchEntry }                                       from '@/lib/watchHistory'
import { withRetry, withTimeout }                              from '@/lib/retry'
import { useRecentMedia }                                      from '@/composables/useRecentMedia'

export type SortField = '$createdAt' | 'title' | 'year' | 'rating'
export type SortOrder = 'ASC' | 'DESC'

export const useMediaStore = defineStore('media', () => {
  const auth = useAuthStore()
  const recent = useRecentMedia()

  const all       = ref<Media[]>([])
  const loading   = ref(false)
  const error     = ref<string | null>(null)
  const syncing   = ref(false)  // Track if syncing with server
  const _updating = ref<Set<string>>(new Set())  // Track updating items to prevent race conditions

  const filterType      = ref<string | null>(null)
  const filterStatus    = ref<string | null>(null)
  const filterMinRating = ref<number | null>(null)
  const filterPlatform  = ref<string | null>(null)
  const search          = ref('')
  const sortField       = ref<SortField>('$createdAt')
  const sortOrder       = ref<SortOrder>('DESC')
  const totalCount = ref<number | null>(null)
  const currentPage = ref(1)
  const pageSize = ref(50)
  const lastCursorCreatedAt = ref<string | null>(null)

  const sorted = computed(() => {
    const r = [...all.value]

    r.sort((a, b) => {
      let va: string | number, vb: string | number
      switch (sortField.value) {
        case 'title':  va = a.title?.toLowerCase() ?? '';  vb = b.title?.toLowerCase() ?? '';  break
        case 'year':   va = a.year   ?? 0;                 vb = b.year   ?? 0;                 break
        case 'rating': va = a.rating ?? 0;                 vb = b.rating ?? 0;                 break
        default:       va = a.$createdAt;                  vb = b.$createdAt
      }
      if (va < vb) return sortOrder.value === 'ASC' ? -1 : 1
      if (va > vb) return sortOrder.value === 'ASC' ?  1 : -1
      return 0
    })

    return r
  })

  // Map of document id -> { key: [[start,end], ...] }
  const searchMatches = ref<Record<string, Record<string, number[][]>>>({})
  // Fuse.js index cache to avoid rebuilding on every search
  const _fuseIndex = ref<any | null>(null)
  let _fuseSourceSig = ''
  const fuseOptions: any = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'genre',  weight: 0.2 },
      { name: 'year',   weight: 0.1 }
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
  }

  function ensureFuseIndex(list: Media[]) {
    const sig = list.map(i => i.$id).join('|')
    if (!_fuseIndex.value || sig !== _fuseSourceSig) {
      _fuseSourceSig = sig
      _fuseIndex.value = new Fuse(list as unknown as object[], fuseOptions)
    }
    return _fuseIndex.value
  }

  const filtered = computed(() => {
    let r = sorted.value


    // Apply basic filters first
    if (filterType.value)      r = r.filter(m => m.type     === filterType.value)
    if (filterStatus.value)    r = r.filter(m => m.status   === filterStatus.value)
    if (filterMinRating.value) r = r.filter(m => (m.rating ?? 0) >= filterMinRating.value!)
    if (filterPlatform.value)  r = r.filter(m => m.platform === filterPlatform.value)

    // Fuzzy search: use Fuse.js for better matching across title, genre and year
    if (search.value) {
      try {
        const fuse = ensureFuseIndex(r)
        const results = fuse.search(search.value)

        // Save match indices per id for UI highlighting
        const matchesPerId: Record<string, Record<string, number[][]>> = {}
        r = results.map((res: any) => {
          const id = (res.item as Media).$id
          matchesPerId[id] = {}
          if (Array.isArray(res.matches)) {
            for (const m of res.matches) {
              const key = String(m.key)
              matchesPerId[id][key] = (m.indices || []).map((pair: number[]) => [pair[0], pair[1]])
            }
          }
          return res.item as Media
        })

        searchMatches.value = matchesPerId
      } catch (e) {
        // Fallback to basic substring match on error
        const q = search.value.toLowerCase()
        r = r.filter(m => (m.title?.toLowerCase() ?? '').includes(q) || (m.genre?.toLowerCase() ?? '').includes(q))
        searchMatches.value = {}
      }
    } else {
      searchMatches.value = {}
    }

    return r
  })

  function fetchErrorMessage(rawError: unknown) {
    const e = rawError as { message?: string; code?: number; type?: string }
    const msg  = (e?.message ?? '').toLowerCase()
    const type = (e?.type ?? '').toLowerCase()

    if (
      e?.code === 0 ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network error') ||
      msg.includes('timeout') ||
      msg.includes('err_failed') ||
      type.includes('network')
    ) {
      return 'No se pudo conectar con el servidor. Revisa tu red e inténtalo de nuevo.'
    }

    if (msg.includes('invalid url') || msg.includes('missing required parameter')) {
      return 'La configuración de Appwrite parece incompleta o inválida.'
    }

    return e?.message || 'No se pudo cargar tu colección'
  }

  async function fetch(pageSizeArg?: number) {
    const limit = typeof pageSizeArg === 'number' ? pageSizeArg : pageSize.value
    if (!hasAppwriteDatabaseConfig) {
      error.value = getMissingAppwriteDatabaseConfigMessage()
      throw new Error(error.value)
    }
    loading.value = true
    error.value = null
    try {
      const queries: any[] = [Query.limit(limit), Query.orderDesc('$createdAt')]
      if (lastCursorCreatedAt.value) {
        queries.push(Query.lessThan('$createdAt', lastCursorCreatedAt.value))
      } else if ((Query as any).offset) {
        queries.push((Query as any).offset((currentPage.value - 1) * limit))
      }

      const res = await withRetry(() => databases.listDocuments(DB_ID, COLL_MEDIA, queries), { maxAttempts: 3, initialDelay: 250 })
      const docs = res.documents as unknown as Media[]
      if (currentPage.value === 1) all.value = docs
      else {
        const existing = new Set(all.value.map(d => d.$id))
        for (const d of docs) if (!existing.has(d.$id)) all.value.push(d)
      }
      totalCount.value = typeof res.total === 'number' ? res.total : null

      // Update cursor for next page when using cursor pagination
      if (docs.length > 0) {
        lastCursorCreatedAt.value = docs[docs.length - 1].$createdAt
      }

      if (totalCount.value && totalCount.value > limit) {
        console.warn(`[MediaTracker] ${totalCount.value} items exist but only ${limit} loaded. Pagination active.`)
      }
    } catch (e) {
      error.value = fetchErrorMessage(e)
      console.error('[MediaTracker] Failed to fetch media:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (loading.value) return
    if (totalCount.value !== null && all.value.length >= totalCount.value) return
    currentPage.value += 1
    try {
      await fetch(pageSize.value)
    } catch (e) {
      currentPage.value -= 1
      throw e
    }
  }

  const hasMore = computed(() => totalCount.value === null ? false : all.value.length < totalCount.value)

  function isUpdating(id: string) {
    return _updating.value.has(id)
  }

  function perms() {
    const uid = auth.user?.$id
    if (!uid) {
      console.error('[MediaTracker] perms() called without authenticated user')
      return []
    }
    return [Permission.read(Role.user(uid)), Permission.update(Role.user(uid)), Permission.delete(Role.user(uid))]
  }

  function stripMeta(obj: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('$')))
  }

  async function create(data: MediaFormData) {
    if (!hasAppwriteDatabaseConfig) throw new Error(getMissingAppwriteDatabaseConfigMessage())

    const { total_seasons, total_episodes, progress_notes, ...rawData } = data
    const mediaData = stripMeta(rawData as Record<string, unknown>)
    try {
      const doc = await databases.createDocument(DB_ID, COLL_MEDIA, ID.unique(), mediaData, perms())
      recent.saveRecentMediaId(doc.$id)
      if (data.type === 'series') await upsertProgress(doc.$id, { current_season: data.current_season, current_episode: data.current_episode, total_seasons, total_episodes, notes: progress_notes }, perms())
      currentPage.value = 1
      lastCursorCreatedAt.value = null
      await fetch()
    } catch (e) {
      console.error('[MediaTracker] Failed to create media:', e)
      throw e
    }
  }

  async function update(id: string, data: MediaFormData) {
    if (!hasAppwriteDatabaseConfig) throw new Error(getMissingAppwriteDatabaseConfigMessage())

    const { total_seasons, total_episodes, progress_notes, ...rawData } = data
    const mediaData = stripMeta(rawData as Record<string, unknown>)
    try {
      await databases.updateDocument(DB_ID, COLL_MEDIA, id, mediaData)
      recent.saveRecentMediaId(id)
      if (data.type === 'series') await upsertProgress(id, { current_season: data.current_season, current_episode: data.current_episode, total_seasons, total_episodes, notes: progress_notes }, perms())
      currentPage.value = 1
      lastCursorCreatedAt.value = null
      await fetch()
    } catch (e) {
      console.error('[MediaTracker] Failed to update media:', e)
      throw e
    }
  }

  async function remove(id: string) {
    if (!hasAppwriteDatabaseConfig) throw new Error(getMissingAppwriteDatabaseConfigMessage())

    await databases.deleteDocument(DB_ID, COLL_MEDIA, id)
    try {
      const r = await databases.listDocuments(DB_ID, COLL_PROGRESS, [Query.equal('media_id', id), Query.limit(1)])
      if (r.total > 0) await databases.deleteDocument(DB_ID, COLL_PROGRESS, r.documents[0].$id)
    } catch {}
    currentPage.value = 1
    lastCursorCreatedAt.value = null
    await fetch()
  }

  async function cycleStatus(id: string) {
    if (!hasAppwriteDatabaseConfig) throw new Error(getMissingAppwriteDatabaseConfigMessage())

    // Prevent race condition from multiple clicks
    if (_updating.value.has(id)) return
    _updating.value.add(id)

    try {
      const cycle: Record<string, string> = { pending: 'watching', watching: 'watched', watched: 'pending', dropped: 'watching' }
      const item = all.value.find(m => m.$id === id)
      if (!item) return
      const prev           = item.status
      const prevFinishedAt = item.finished_at          // save before mutation
      const next = cycle[prev] as Media['status']
      const finished_at = next === 'watched' ? new Date().toISOString()
                        : next === 'pending' || next === 'watching' ? null
                        : item.finished_at
      // Optimistic update
      item.status      = next
      item.finished_at = finished_at ?? null
      try {
        syncing.value = true
        await withTimeout(
          databases.updateDocument(DB_ID, COLL_MEDIA, id, { status: next, finished_at }),
          10000,
          'Timeout al cambiar estado del item'
        )
        recent.saveRecentMediaId(id)
        logStatusChange(id, prev, next)
        if (next === 'watched') {
          addWatchEntry(id)
          useUiStore().pendingRatingMedia = item
        }
      } catch (e) {
        // Revert to original values on failure
        item.status      = prev
        item.finished_at = prevFinishedAt
        syncing.value    = false
        throw e
      }
    } finally {
      syncing.value = false
      _updating.value.delete(id)
    }
  }

  async function rewatch(id: string) {
    if (!hasAppwriteDatabaseConfig) throw new Error(getMissingAppwriteDatabaseConfigMessage())

    // Prevent race condition from multiple clicks
    if (_updating.value.has(id)) return
    _updating.value.add(id)

    try {
      const item = all.value.find(m => m.$id === id)
      if (!item) return
      const prev = item.status
      item.status = 'watching'
      try {
        await databases.updateDocument(DB_ID, COLL_MEDIA, id, { status: 'watching' })
        recent.saveRecentMediaId(id)
        logStatusChange(id, prev, 'watching')
      } catch (e) {
        item.status = prev
        throw e
      }
    } finally {
      _updating.value.delete(id)
    }
  }

  async function setStatus(id: string, status: Media['status']) {
    if (!hasAppwriteDatabaseConfig) throw new Error(getMissingAppwriteDatabaseConfigMessage())

    // Prevent race condition from multiple clicks
    if (_updating.value.has(id)) return
    _updating.value.add(id)

    try {
      const item = all.value.find(m => m.$id === id)
      if (!item) return
      const prev = item.status
      const prevFinishedAt = item.finished_at
      const finished_at = status === 'watched' ? new Date().toISOString()
                        : status === 'pending' || status === 'watching' ? null
                        : item.finished_at
      item.status      = status
      item.finished_at = finished_at ?? null
      try {
        await databases.updateDocument(DB_ID, COLL_MEDIA, id, { status, finished_at })
        recent.saveRecentMediaId(id)
        logStatusChange(id, prev, status)
        if (status === 'watched') {
          addWatchEntry(id)
          useUiStore().pendingRatingMedia = item
        }
      } catch (e) {
        item.status      = prev
        item.finished_at = prevFinishedAt
        throw e
      }
    } finally {
      _updating.value.delete(id)
    }
  }

  function logStatusChange(mediaId: string, from: string, to: string) {
    const uid = auth.user?.$id
    if (!uid) return
    const p = [Permission.read(Role.user(uid)), Permission.delete(Role.user(uid))]
    databases.createDocument(DB_ID, COLL_STATUS_HISTORY, ID.unique(), {
      media_id:    mediaId,
      from_status: from,
      to_status:   to,
      changed_at:  new Date().toISOString(),
    }, p).catch(() => { /* non-critical */ })
  }

  async function getStatusHistory(mediaId: string): Promise<StatusHistory[]> {
    const r = await databases.listDocuments(DB_ID, COLL_STATUS_HISTORY, [
      Query.equal('media_id', mediaId),
      Query.orderDesc('changed_at'),
      Query.limit(20),
    ])
    return r.documents as unknown as StatusHistory[]
  }

  async function checkReminders() {
    // Skip if permission not granted, but offer to request it
    if (Notification.permission === 'denied') {
      console.info('[MediaTracker] Notifications denied by user')
      return
    }
    
    // Request permission if not yet asked
    if (Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
      } catch {
        return
      }
    }
    
    const now = new Date()
    for (const m of all.value) {
      if (!m.remind_at) continue
      const due = new Date(m.remind_at)
      if (due <= now) {
        try {
          new Notification(`⏰ Recordatorio: ${m.title}`, {
            body: m.type === 'movie' ? 'Tienes pendiente ver esta película' : m.type === 'series' ? 'Continúa con esta serie' : 'Retoma este libro',
            icon: m.cover_url ?? '/icon.svg',
            tag:  m.$id,
          })
          // Clear the reminder after firing
          try {
            await databases.updateDocument(DB_ID, COLL_MEDIA, m.$id, { remind_at: null })
            m.remind_at = null
          } catch (e) {
            console.warn('[MediaTracker] Failed to clear reminder:', e)
          }
        } catch (e) {
          console.warn('[MediaTracker] Failed to show notification:', e)
        }
      }
    }
  }

  async function getProgress(mediaId: string): Promise<Progress | null> {
    const r = await databases.listDocuments(DB_ID, COLL_PROGRESS, [Query.equal('media_id', mediaId), Query.limit(1)])
    return r.total > 0 ? (r.documents[0] as unknown as Progress) : null
  }

  async function upsertProgress(mediaId: string, data: Partial<Progress>, p?: string[]) {
    const r = await databases.listDocuments(DB_ID, COLL_PROGRESS, [Query.equal('media_id', mediaId), Query.limit(1)])
    if (r.total > 0) {
      await databases.updateDocument(DB_ID, COLL_PROGRESS, r.documents[0].$id, data)
    } else {
      await databases.createDocument(DB_ID, COLL_PROGRESS, ID.unique(), { ...data, media_id: mediaId }, p)
    }
  }

  return {
    all,
    loading,
    error,
    syncing,
    fetch,
    create,
    update,
    remove,
    cycleStatus,
    rewatch,
    setStatus,
    isUpdating,
    getProgress,
    upsertProgress,
    filterType,
    filterStatus,
    filterMinRating,
    filterPlatform,
    search,
    sortField,
    sortOrder,
    sorted,
    filtered,
    searchMatches,
    totalCount,
    currentPage,
    pageSize,
    loadMore,
    hasMore,
  }
})
