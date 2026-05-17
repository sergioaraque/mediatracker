import { ref, onMounted } from 'vue'

export function useLazyImage(src: string | null | undefined) {
  const loaded = ref(false)
  const error = ref(false)

  onMounted(() => {
    if (!src) return

    const img = new Image()
    img.onload = () => {
      loaded.value = true
    }
    img.onerror = () => {
      error.value = true
    }
    img.src = src
  })

  return { loaded, error }
}

/**
 * Lazy load image using Intersection Observer
 * Useful for lists with many images
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const target = ref<HTMLElement | null>(null)
  const isVisible = ref(false)

  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    ...options,
  }

  onMounted(() => {
    if (!target.value) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        callback()
        observer.unobserve(target.value!)
      }
    }, defaultOptions)

    observer.observe(target.value)

    return () => observer.disconnect()
  })

  return { target, isVisible }
}
