import { defineStore }                                        from 'pinia'
import { ref, computed }                                       from 'vue'
import { databases, DB_ID, COLL_MEDIA, COLL_PROGRESS, COLL_STATUS_HISTORY, Query, ID, Permission, Role } from '@/lib/appwrite'
import type { Media, Progress, MediaFormData, StatusHistory }  from '@/types'
import { useAuthStore }                                        from './auth'

export type SortField = '$createdAt' | 'title' | 'year' | 'rating'
export type SortOrder = 'ASC' | 'DESC'

export const useMediaStore = defineStore('media', () => {
  const auth = useAuthStore()

  const all     = ref<Media[]>([])
  const loading = ref(false)

  const filterType      = ref<string | null>(null)
  const filterStatus    = ref<string | null>(null)
  const filterMinRating = ref<number | null>(null)
  const filterPlatform  = ref<string | null>(null)
  const search          = ref('')
  const sortField       = ref<SortField>('$createdAt')
  const sortOrder       = ref<SortOrder>('DESC')

  const filtered = computed(() => {
    let r = [...all.value]

    if (filterType.value)      r = r.filter(m => m.type     === filterType.value)
    if (filterStatus.value)    r = r.filter(m => m.status   === filterStatus.value)
    if (filterMinRating.value) r = r.filter(m => (m.rating ?? 0) >= filterMinRating.value!)
    if (filterPlatform.value)  r = r.filter(m => m.platform === filterPlatform.value)

    if (search.value) {
      const q = search.value.toLowerCase()
      r = r.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.genre?.toLowerCase().includes(q)
      )
    }

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

  async function fetch() {
    loading.value = true
    try {
      const res = await databases.listDocuments(DB_ID, COLL_MEDIA, [
        Query.limit(500),
        Query.orderDesc('$createdAt'),
      ])
      all.value = res.documents as unknown as Media[]
    } finally {
      loading.value = false
    }
  }

  function perms() {
    const uid = auth.user!.$id
    return [Permission.read(Role.user(uid)), Permission.update(Role.user(uid)), Permission.delete(Role.user(uid))]
  }

  function stripMeta(obj: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('$')))
  }

  async function create(data: MediaFormData) {
    const { total_seasons, total_episodes, progress_notes, ...rawData } = data
    const mediaData = stripMeta(rawData as Record<string, unknown>)
    const doc = await databases.createDocument(DB_ID, COLL_MEDIA, ID.unique(), mediaData, perms())
    if (data.type === 'series') await upsertProgress(doc.$id, { current_season: data.current_season, current_episode: data.current_episode, total_seasons, total_episodes, notes: progress_notes }, perms())
    await fetch()
  }

  async function update(id: string, data: MediaFormData) {
    const { total_seasons, total_episodes, progress_notes, ...rawData } = data
    const mediaData = stripMeta(rawData as Record<string, unknown>)
    await databases.updateDocument(DB_ID, COLL_MEDIA, id, mediaData)
    if (data.type === 'series') await upsertProgress(id, { current_season: data.current_season, current_episode: data.current_episode, total_seasons, total_episodes, notes: progress_notes })
    await fetch()
  }

  async function remove(id: string) {
    await databases.deleteDocument(DB_ID, COLL_MEDIA, id)
    try {
      const r = await databases.listDocuments(DB_ID, COLL_PROGRESS, [Query.equal('media_id', id), Query.limit(1)])
      if (r.total > 0) await databases.deleteDocument(DB_ID, COLL_PROGRESS, r.documents[0].$id)
    } catch {}
    await fetch()
  }

  async function cycleStatus(id: string) {
    const cycle: Record<string, string> = { pending: 'watching', watching: 'watched', watched: 'pending' }
    const item = all.value.find(m => m.$id === id)
    if (!item) return
    const prev = item.status
    const next = cycle[prev] as Media['status']
    const finished_at = next === 'watched' ? new Date().toISOString()
                      : next === 'pending' ? null
                      : item.finished_at
    // Optimistic update
    item.status      = next
    item.finished_at = finished_at ?? null
    try {
      await databases.updateDocument(DB_ID, COLL_MEDIA, id, { status: next, finished_at })
      logStatusChange(id, prev, next)
    } catch (e) {
      // Revert on failure
      item.status      = prev
      item.finished_at = prev === 'watched' ? finished_at ?? null : item.finished_at
      throw e
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
    if (Notification.permission !== 'granted') return
    const now = new Date()
    for (const m of all.value) {
      if (!m.remind_at) continue
      const due = new Date(m.remind_at)
      if (due <= now) {
        new Notification(`⏰ Recordatorio: ${m.title}`, {
          body: m.type === 'movie' ? 'Tienes pendiente ver esta película' : m.type === 'series' ? 'Continúa con esta serie' : 'Retoma este libro',
          icon: m.cover_url ?? '/icon.svg',
          tag:  m.$id,
        })
        // Clear the reminder after firing
        await databases.updateDocument(DB_ID, COLL_MEDIA, m.$id, { remind_at: null })
        m.remind_at = null
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
    all, loading, filtered,
    filterType, filterStatus, filterMinRating, filterPlatform, search, sortField, sortOrder,
    fetch, create, update, remove, cycleStatus, getProgress, getStatusHistory, checkReminders,
  }
})
