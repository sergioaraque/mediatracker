import { ref } from 'vue'

const KEY = 'mt_search_presets'

type Preset = { id: string; name: string; query: string; createdAt: number; filters?: { type?: string | null; status?: string | null; minRating?: number | null; platform?: string | null } }

function load(): Preset[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Preset[]
    return list.sort((a, b) => b.createdAt - a.createdAt)
  } catch { return [] }
}

function saveList(list: Preset[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function useSearchPresets() {
  const presets = ref<Preset[]>(load())

  function list() { return presets.value }

  function add(p: Omit<Preset, 'id'>) {
    const id = (Date.now() + Math.random()).toString(36)
    const preset: Preset = { id, createdAt: Date.now(), ...p }
    presets.value = [preset, ...presets.value].sort((a,b) => b.createdAt - a.createdAt)
    saveList(presets.value)
    return preset
  }

  function remove(id: string) {
    presets.value = presets.value.filter(x => x.id !== id)
    saveList(presets.value)
  }

  function clear() {
    presets.value = []
    saveList(presets.value)
  }

  return { presets, list, add, remove, clear }
}
