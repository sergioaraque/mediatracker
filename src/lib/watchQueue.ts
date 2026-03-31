const KEY = 'mt_watch_queue'

export function getQueue(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
  catch { return [] }
}

export function setQueue(ids: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export function addToQueue(id: string): void {
  const q = getQueue()
  if (!q.includes(id)) setQueue([...q, id])
}

export function removeFromQueue(id: string): void {
  setQueue(getQueue().filter(x => x !== id))
}

export function moveInQueue(id: string, dir: -1 | 1): void {
  const q = getQueue()
  const i = q.indexOf(id)
  if (i === -1) return
  const j = i + dir
  if (j < 0 || j >= q.length) return
  const copy = [...q];
  [copy[i], copy[j]] = [copy[j], copy[i]]
  setQueue(copy)
}
