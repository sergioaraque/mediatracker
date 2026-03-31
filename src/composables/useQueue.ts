import { ref } from 'vue'
import { getQueue, setQueue, addToQueue, removeFromQueue, moveInQueue } from '@/lib/watchQueue'

// Shared reactive singleton — updates in QueueDrawer are visible in HomeView
const queueIds = ref<string[]>(getQueue())

export function useQueue() {
  function add(id: string) {
    addToQueue(id)
    queueIds.value = getQueue()
  }
  function remove(id: string) {
    removeFromQueue(id)
    queueIds.value = getQueue()
  }
  function move(id: string, dir: -1 | 1) {
    moveInQueue(id, dir)
    queueIds.value = getQueue()
  }
  function reorder(ids: string[]) {
    setQueue(ids)
    queueIds.value = [...ids]
  }
  return { queueIds, add, remove, move, reorder }
}
