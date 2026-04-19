<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="m" class="fixed inset-0 bg-black/80 backdrop-blur-md z-[70]" @click="skip" />
    </Transition>

    <Transition name="scale-up">
      <div
        v-if="m"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        @click.self="skip"
      >
        <div class="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

          <!-- Cover hero -->
          <div class="relative h-36 overflow-hidden">
            <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="w-full h-full object-cover scale-110" />
            <div v-else class="w-full h-full" :class="gradient" />
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
            <div class="absolute bottom-4 left-5 right-5">
              <p class="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mb-1">
                <CheckCheck class="w-3.5 h-3.5" /> ¡Completado!
              </p>
              <p class="text-white text-lg font-bold leading-tight line-clamp-1">{{ m.title }}</p>
            </div>
          </div>

          <div class="px-6 pt-5 pb-6 space-y-5">

            <!-- Star rating -->
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">¿Qué nota le pones?</p>
              <div class="flex items-center gap-1 justify-center">
                <button
                  v-for="n in 10"
                  :key="n"
                  @click="rating = n"
                  @mouseenter="hovered = n"
                  @mouseleave="hovered = 0"
                  class="transition-transform hover:scale-110"
                >
                  <Star
                    class="w-7 h-7 transition-colors"
                    :class="n <= (hovered || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-700 fill-gray-700'"
                  />
                </button>
              </div>
              <p v-if="rating" class="text-center text-sm font-bold mt-2" :class="ratingColor">
                {{ ratingLabel }} · {{ rating }}/10
              </p>
            </div>

            <!-- Review textarea -->
            <div>
              <label class="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                Tu reseña <span class="text-gray-600 normal-case">(opcional)</span>
              </label>
              <textarea
                v-model="review"
                class="input resize-none text-sm"
                rows="3"
                placeholder="¿Qué te ha parecido? ¿Lo recomendarías?…"
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button @click="skip" class="btn-secondary flex-1 text-sm">
                Saltar
              </button>
              <button
                @click="save"
                :disabled="saving || !rating"
                class="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                <span v-else>Guardar</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Star, CheckCheck, Loader2 } from 'lucide-vue-next'
import { useUiStore }    from '@/stores/ui'
import { useMediaStore } from '@/stores/media'
import { databases, DB_ID, COLL_MEDIA } from '@/lib/appwrite'

const ui    = useUiStore()
const media = useMediaStore()

const rating  = ref(0)
const hovered = ref(0)
const review  = ref('')
const saving  = ref(false)

// Shorthand for the pending media
const m = computed(() => ui.pendingRatingMedia)

// Reset fields each time a new item triggers the dialog
watch(m, (val) => {
  if (val) {
    rating.value  = val.rating ?? 0
    review.value  = val.review ?? ''
    hovered.value = 0
  }
})

const gradient = computed(() => m.value ? ({
  movie:  'bg-gradient-to-br from-blue-900 to-blue-800',
  series: 'bg-gradient-to-br from-violet-900 to-violet-800',
  book:   'bg-gradient-to-br from-amber-900 to-amber-800',
}[m.value.type]) : '')

const ratingColor = computed(() => {
  if (!rating.value) return ''
  if (rating.value >= 8) return 'text-emerald-400'
  if (rating.value >= 6) return 'text-amber-400'
  return 'text-red-400'
})

const ratingLabel = computed(() => {
  if (!rating.value) return ''
  if (rating.value >= 9) return 'Obra maestra'
  if (rating.value >= 7) return 'Muy buena'
  if (rating.value >= 5) return 'Correcta'
  if (rating.value >= 3) return 'Floja'
  return 'Mala'
})

async function save() {
  if (!m.value || !rating.value || saving.value) return

  const mediaId = m.value.$id
  const nextRating = rating.value
  const nextReview = review.value.trim() || null

  // Optimistic local update so the dialog closes instantly.
  const item = media.all.find(i => i.$id === mediaId)
  const prevRating = item?.rating ?? null
  const prevReview = item?.review ?? null
  if (item) {
    item.rating = nextRating
    item.review = nextReview
  }

  ui.toast('Valoración guardada')
  close()

  saving.value = true
  try {
    await databases.updateDocument(DB_ID, COLL_MEDIA, mediaId, {
      rating: nextRating,
      review: nextReview,
    })
  } catch {
    if (item) {
      item.rating = prevRating
      item.review = prevReview
    }
    ui.toast('Error al guardar la valoración', 'error')
  } finally {
    saving.value = false
  }
}

function skip() { close() }

function close() {
  ui.pendingRatingMedia = null
}
</script>

<style scoped>
.scale-up-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.scale-up-leave-active { transition: all .2s ease-in; }
.scale-up-enter-from, .scale-up-leave-to { opacity: 0; transform: scale(.9); }
</style>
