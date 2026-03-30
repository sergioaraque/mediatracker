import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(opts: {
  onNew?:     () => void
  onSearch?:  () => void
  onPalette?: () => void
}) {
  function isTyping(): boolean {
    const tag = (document.activeElement as HTMLElement)?.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
  }

  function handler(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      opts.onPalette?.() ?? opts.onSearch?.()
    }
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping()) {
      opts.onNew?.()
    }
  }

  onMounted(()  => document.addEventListener('keydown', handler))
  onUnmounted(() => document.removeEventListener('keydown', handler))
}
