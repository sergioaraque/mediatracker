import { watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useUiStore }    from '@/stores/ui'
import type { Media }    from '@/types'

export interface Achievement {
  id:          string
  emoji:       string
  name:        string
  description: string
  check:       (items: Media[]) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_watch',    emoji: '🌟', name: 'Primer visionado',    description: 'Marca algo como visto por primera vez',  check: (m) => m.some(i => i.status === 'watched') },
  { id: 'ten_movies',     emoji: '🎬', name: 'Cinéfilo',            description: '10 películas vistas',                   check: (m) => m.filter(i => i.type === 'movie'  && i.status === 'watched').length >= 10 },
  { id: 'fifty_movies',   emoji: '🏆', name: 'Gran cinéfilo',       description: '50 películas vistas',                   check: (m) => m.filter(i => i.type === 'movie'  && i.status === 'watched').length >= 50 },
  { id: 'ten_series',     emoji: '📺', name: 'Seriéfilo',           description: '10 series completadas',                 check: (m) => m.filter(i => i.type === 'series' && i.status === 'watched').length >= 10 },
  { id: 'ten_books',      emoji: '📚', name: 'Ratón de biblioteca', description: '10 libros leídos',                     check: (m) => m.filter(i => i.type === 'book'   && i.status === 'watched').length >= 10 },
  { id: 'hundred_items',  emoji: '💯', name: 'Centenario',          description: '100 ítems vistos en total',             check: (m) => m.filter(i => i.status === 'watched').length >= 100 },
  { id: 'critic',         emoji: '⭐', name: 'Crítico',             description: 'Valora 20 ítems',                      check: (m) => m.filter(i => i.rating).length >= 20 },
  { id: 'multiplatform',  emoji: '📡', name: 'Multiplataforma',     description: 'Usa 5 plataformas distintas',           check: (m) => new Set(m.map(i => i.platform).filter(Boolean)).size >= 5 },
  { id: 'perfect_score',  emoji: '💎', name: 'Perfeccionista',      description: 'Da un 10 a algo',                      check: (m) => m.some(i => i.rating === 10) },
  { id: 'dropped_one',    emoji: '🚫', name: 'Sin remordimientos',  description: 'Abandona algo por primera vez',         check: (m) => m.some(i => i.status === 'dropped') },
]

const STORAGE_KEY = 'mt_achievements'

function loadUnlocked(): Set<string> {
  try   { return new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')) }
  catch { return new Set() }
}

function saveUnlocked(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function getUnlockedIds(): Set<string> {
  return loadUnlocked()
}

export function useAchievements() {
  const media = useMediaStore()
  const ui    = useUiStore()

  watch(() => media.all, (items) => {
    if (!items.length) return
    const unlocked = loadUnlocked()
    let changed    = false
    for (const a of ACHIEVEMENTS) {
      if (unlocked.has(a.id)) continue
      if (a.check(items)) {
        unlocked.add(a.id)
        changed = true
        // Slight delay so the achievement toast doesn't collide with action toasts
        setTimeout(() => ui.toast(`${a.emoji} Logro: ${a.name} — ${a.description}`), 600)
      }
    }
    if (changed) saveUnlocked(unlocked)
  }, { deep: true })
}
