<template>
  <div class="landing text-white overflow-x-hidden">

    <!-- ── NAV ──────────────────────────────────────────────────────────────── -->
    <nav class="relative z-20 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Clapperboard class="w-5 h-5 text-white" />
        </div>
        <span class="font-bold text-xl tracking-tight">MediaTracker</span>
      </div>
      <RouterLink to="/login" class="btn-primary text-sm px-5 py-2.5 flex items-center gap-1.5">
        Entrar <ArrowRight class="w-4 h-4" />
      </RouterLink>
    </nav>

    <!-- ── HERO ──────────────────────────────────────────────────────────────── -->
    <section class="relative min-h-[92vh] flex items-center overflow-hidden">

      <!-- Ambient orbs -->
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />

      <!-- Poster-wall background -->
      <div class="poster-wall" aria-hidden="true">
        <div
          v-for="(p, i) in posterWall"
          :key="i"
          class="poster-bg-card"
          :class="p.gradient"
          :style="`--delay:${i * 0.18}s`"
        >
          <component :is="p.icon" class="w-6 h-6 text-white/40" />
        </div>
      </div>

      <!-- Vignette overlays -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#060410] via-[#060410]/80 to-[#060410]/20 pointer-events-none" />
      <div class="absolute inset-0 bg-gradient-to-b from-[#060410]/60 via-transparent to-[#060410] pointer-events-none" />

      <!-- Content -->
      <div class="relative z-10 max-w-7xl mx-auto w-full px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center py-20">

        <!-- Left: headline -->
        <div>
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-sm font-medium mb-8 animate-fade-in">
            <Sparkles class="w-3.5 h-3.5" /> Tu catálogo personal de medios
          </div>

          <h1 class="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 animate-fade-up">
            Cada historia<br/>que has<br/>
            <span class="hero-gradient-text">vivido.</span>
          </h1>

          <p class="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-md mb-10 animate-fade-up" style="animation-delay:.12s">
            Películas, series y libros en un único lugar. Controla lo que ves, gestiona tu lista y valora cada experiencia.
          </p>

          <div class="flex flex-wrap gap-4 mb-10 animate-fade-up" style="animation-delay:.22s">
            <RouterLink to="/login" class="btn-primary text-base px-7 py-3.5 shadow-2xl shadow-violet-900/50 flex items-center gap-2">
              Empezar gratis <ArrowRight class="w-4 h-4" />
            </RouterLink>
          </div>

          <!-- Type badges -->
          <div class="flex flex-wrap items-center gap-2.5 animate-fade-up" style="animation-delay:.32s">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">🎬 Películas</span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">📺 Series</span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">📚 Libros</span>
          </div>
        </div>

        <!-- Right: TV mockup -->
        <div class="flex justify-center lg:justify-end animate-fade-up" style="animation-delay:.18s">
          <div class="tv-wrapper">
            <!-- Glow -->
            <div class="tv-glow" />

            <!-- TV chassis -->
            <div class="tv">
              <div class="tv-screen">
                <!-- App mini-UI inside screen -->
                <div class="p-3 h-full flex flex-col gap-2 overflow-hidden">
                  <!-- Header -->
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-4 h-4 rounded bg-violet-600/80 flex items-center justify-center">
                      <Clapperboard class="w-2.5 h-2.5 text-white" />
                    </div>
                    <div class="flex-1 h-2 rounded bg-white/10" />
                    <div class="w-10 h-3 rounded-full bg-violet-500/50" />
                  </div>
                  <!-- Filter pills -->
                  <div class="flex gap-1.5 shrink-0">
                    <div class="h-2.5 w-8 rounded-full bg-white/20" />
                    <div class="h-2.5 w-12 rounded-full bg-violet-500/60" />
                    <div class="h-2.5 w-8 rounded-full bg-white/10" />
                    <div class="h-2.5 w-8 rounded-full bg-white/10" />
                  </div>
                  <!-- Poster grid -->
                  <div class="grid grid-cols-3 gap-1.5 flex-1">
                    <div
                      v-for="(c, i) in screenCards"
                      :key="i"
                      class="rounded relative overflow-hidden"
                      :class="c.gradient"
                      style="aspect-ratio:2/3"
                    >
                      <div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full" :class="c.dot" />
                      <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  </div>
                </div>
                <div class="scanlines" />
                <div class="screen-glare" />
              </div>
              <!-- Bottom bezel -->
              <div class="tv-bezel-bottom">
                <div class="tv-power" />
              </div>
            </div>
            <!-- Stand -->
            <div class="tv-neck" />
            <div class="tv-base" />
          </div>
        </div>

      </div>
    </section>

    <!-- ── FILM STRIP ─────────────────────────────────────────────────────────── -->
    <div class="film-strip border-y border-white/5">
      <div class="sprockets"><div v-for="n in 40" :key="n" class="sprocket" /></div>
      <div class="film-track-outer">
        <div class="film-track">
          <div
            v-for="(p, i) in [...filmPosters, ...filmPosters]"
            :key="i"
            class="film-frame"
            :class="p.gradient"
          >
            <component :is="p.icon" class="w-4 h-4 text-white/25 relative z-10" />
            <span class="film-label">{{ p.title }}</span>
          </div>
        </div>
      </div>
      <div class="sprockets"><div v-for="n in 40" :key="n" class="sprocket" /></div>
      <!-- Edge fades -->
      <div class="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[#060410] to-transparent pointer-events-none z-10" />
      <div class="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[#060410] to-transparent pointer-events-none z-10" />
    </div>

    <!-- ── FEATURES BENTO ─────────────────────────────────────────────────────── -->
    <section class="max-w-6xl mx-auto px-6 py-28">

      <div class="text-center mb-16">
        <h2 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Todo en un solo lugar</h2>
        <p class="text-gray-400 text-lg max-w-xl mx-auto">Tres tipos de contenido. Un catálogo personal. Sin complicaciones.</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">

        <!-- Card: Películas (tall, posters tilted bg) -->
        <div class="bento-card overflow-hidden" style="min-height:400px">
          <div class="relative h-56 overflow-hidden">
            <!-- Tilted poster grid -->
            <div class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div class="grid grid-cols-3 gap-2.5 rotate-[8deg] scale-[1.4] opacity-40">
                <div v-for="(c, i) in cinemaBg" :key="i" class="rounded-lg" :class="c" style="aspect-ratio:2/3;width:48px" />
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0e0b18] via-[#0e0b18]/50 to-transparent" />
            <div class="absolute bottom-5 left-5">
              <Film class="w-8 h-8 text-blue-400 mb-2" />
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/15 border border-blue-500/25 px-2 py-0.5 rounded-full">🎬 Películas</span>
              </div>
            </div>
          </div>
          <div class="p-5">
            <h3 class="text-xl font-bold mb-2">Tu archivo cinematográfico</h3>
            <p class="text-gray-400 text-sm leading-relaxed">Guarda cada película, añade tu valoración, el género y una sinopsis. Sabe en todo momento qué has visto y qué tienes pendiente.</p>
          </div>
        </div>

        <!-- Card: Series (TV mockup centrado) -->
        <div class="bento-card overflow-hidden" style="min-height:400px">
          <div class="relative bg-[#0a0712] h-56 flex items-center justify-center overflow-hidden">
            <!-- Ambient glow -->
            <div class="absolute inset-0 bg-radial-violet pointer-events-none" />
            <!-- Mini TV -->
            <div class="mini-tv">
              <div class="mini-tv-screen">
                <div class="p-2.5 flex flex-col gap-1.5">
                  <div class="text-[7px] text-violet-300 font-bold uppercase tracking-wider mb-0.5">Viendo ahora</div>
                  <div class="bg-white/8 rounded-md p-2 border border-white/5">
                    <div class="text-[8px] text-white font-semibold">Breaking Bad</div>
                    <div class="text-[6px] text-gray-400 mt-0.5">Temporada 4 · Episodio 11</div>
                    <div class="h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                      <div class="h-full bg-violet-500 rounded-full" style="width:72%" />
                    </div>
                  </div>
                  <div class="bg-white/5 rounded-md p-2 border border-white/5">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-[8px] text-white font-semibold">Dark</div>
                        <div class="text-[6px] text-gray-500 mt-0.5">T2 · Ep 4</div>
                      </div>
                      <div class="text-[6px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">Pendiente</div>
                    </div>
                  </div>
                  <div class="bg-white/5 rounded-md p-2 border border-white/5">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-[8px] text-white font-semibold">Severance</div>
                        <div class="text-[6px] text-gray-500 mt-0.5">T1 · Ep 9</div>
                      </div>
                      <div class="text-[6px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">Visto</div>
                    </div>
                  </div>
                </div>
                <div class="mini-scanlines" />
              </div>
              <div class="mini-bezel">
                <div class="mini-power" />
              </div>
            </div>
            <!-- TV stand -->
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div style="width:12px;height:16px;background:linear-gradient(to bottom,#1a1625,#100d1a);border-left:1px solid rgba(255,255,255,0.04);border-right:1px solid rgba(255,255,255,0.04)" />
              <div style="width:50px;height:5px;background:linear-gradient(to bottom,#1e1830,#130f20);border-radius:3px;border:1px solid rgba(255,255,255,0.04)" />
            </div>
          </div>
          <div class="p-5">
            <h3 class="text-xl font-bold mb-2 flex items-center gap-2"><Tv class="w-4 h-4 text-violet-400" /> Sigue tus series</h3>
            <p class="text-gray-400 text-sm leading-relaxed">Controla temporadas y episodios al detalle. Nunca perderás el hilo de dónde te quedaste ni olvidarás qué tienes pendiente.</p>
          </div>
        </div>

        <!-- Card: Libros (estantería) -->
        <div class="bento-card overflow-hidden md:col-span-2 lg:col-span-1" style="min-height:400px">
          <div class="relative bg-[#0d0a08] h-56 flex items-end overflow-hidden">
            <!-- Ambient warm light -->
            <div class="absolute inset-0 bg-radial-amber pointer-events-none" />
            <!-- Bookshelf -->
            <div class="shelf-container w-full px-5">
              <!-- Books -->
              <div class="flex items-end gap-1 justify-center">
                <div
                  v-for="b in bookSpines"
                  :key="b.title"
                  class="book-spine"
                  :style="`height:${b.h}px;width:${b.w}px;background:${b.color}`"
                >
                  <span class="book-title">{{ b.title }}</span>
                </div>
              </div>
              <!-- Plank -->
              <div class="shelf-plank" />
              <div class="shelf-shadow" />
            </div>
          </div>
          <div class="p-5">
            <h3 class="text-xl font-bold mb-2 flex items-center gap-2"><BookOpen class="w-4 h-4 text-amber-400" /> Tu biblioteca personal</h3>
            <p class="text-gray-400 text-sm leading-relaxed">Construye tu biblioteca digital. Valora cada lectura, organiza por géneros y nunca olvides qué libro tenías pendiente.</p>
          </div>
        </div>

      </div>
    </section>

    <!-- ── HOW IT WORKS ───────────────────────────────────────────────────────── -->
    <section class="max-w-4xl mx-auto px-6 pb-28">
      <div class="text-center mb-14">
        <h2 class="text-4xl font-extrabold tracking-tight mb-4">Tan simple como parece</h2>
        <p class="text-gray-400 max-w-md mx-auto">Empieza en segundos, sin configuraciones ni curva de aprendizaje.</p>
      </div>
      <div class="grid sm:grid-cols-3 gap-6 relative">
        <!-- Connecting line -->
        <div class="hidden sm:block absolute top-8 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <StepCard number="1" icon="🔑" title="Crea tu cuenta" desc="Regístrate con tu email en segundos. Tus datos son privados y solo tuyos." />
        <StepCard number="2" icon="➕" title="Añade contenido" desc="Películas, series o libros. Añade portada, valoración, género y estado." />
        <StepCard number="3" icon="📊" title="Sigue tu progreso" desc="Filtra, busca y lleva el control de todo lo que consumes culturalmente." />
      </div>
    </section>

    <!-- ── DISCLAIMER ────────────────────────────────────────────────────────── -->
    <section class="max-w-3xl mx-auto px-6 pb-20">
      <div class="flex gap-4 bg-white/3 border border-white/8 rounded-2xl px-6 py-5">
        <Info class="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-gray-300 mb-1">Solo seguimiento, sin contenido</p>
          <p class="text-sm text-gray-500 leading-relaxed">
            MediaTracker es una herramienta de <strong class="text-gray-400">organización personal</strong>.
            No almacena, distribuye ni enlaza películas, series ni libros.
            Para ver el contenido necesitas acceder a tu plataforma habitual (Netflix, HBO, biblioteca…).
            Aquí solo llevas el registro de lo que ya consumes.
          </p>
        </div>
      </div>
    </section>

    <!-- ── CTA ────────────────────────────────────────────────────────────────── -->
    <section class="relative overflow-hidden py-28">
      <div class="cta-orb" />
      <div class="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <p class="text-violet-300 text-sm font-semibold uppercase tracking-widest mb-4">Empieza hoy</p>
        <h2 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
          Organiza tu<br/>
          <span class="hero-gradient-text">mundo cultural</span>
        </h2>
        <p class="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Gratuito, privado y accesible desde cualquier dispositivo. Sin anuncios, sin vender tus datos.
        </p>
        <RouterLink to="/login" class="btn-primary text-lg px-9 py-4 shadow-2xl shadow-violet-900/50 inline-flex items-center gap-2">
          Crear cuenta gratis <ArrowRight class="w-5 h-5" />
        </RouterLink>
      </div>
    </section>

    <!-- ── FOOTER ─────────────────────────────────────────────────────────────── -->
    <footer class="border-t border-white/5 py-8 text-center text-gray-600 text-sm">
      MediaTracker · Hecho con Vue 3 + Appwrite
    </footer>

  </div>
</template>

<script setup lang="ts">
import { Clapperboard, ArrowRight, Sparkles, Film, Tv, BookOpen, Info } from 'lucide-vue-next'
import StepCard from '@/components/landing/StepCard.vue'

// Background poster wall (6-col grid, rotated/blurred)
const posterWall = Array.from({ length: 30 }, (_, i) => ({
  icon: [Film, Tv, BookOpen][i % 3],
  gradient: [
    'bg-gradient-to-br from-blue-900/70 to-blue-800/50',
    'bg-gradient-to-br from-violet-900/70 to-violet-800/50',
    'bg-gradient-to-br from-amber-900/70 to-amber-800/50',
    'bg-gradient-to-br from-rose-900/70 to-rose-800/50',
    'bg-gradient-to-br from-emerald-900/70 to-emerald-800/50',
    'bg-gradient-to-br from-indigo-900/70 to-indigo-800/50',
  ][i % 6],
}))

// TV screen mini poster cards
const screenCards = [
  { gradient: 'bg-gradient-to-br from-blue-900 to-blue-800',    dot: 'bg-emerald-400' },
  { gradient: 'bg-gradient-to-br from-violet-900 to-violet-800', dot: 'bg-blue-400' },
  { gradient: 'bg-gradient-to-br from-rose-900 to-rose-800',    dot: 'bg-amber-400' },
  { gradient: 'bg-gradient-to-br from-amber-900 to-amber-800',  dot: 'bg-emerald-400' },
  { gradient: 'bg-gradient-to-br from-emerald-900 to-emerald-800', dot: 'bg-blue-400' },
  { gradient: 'bg-gradient-to-br from-indigo-900 to-indigo-800', dot: 'bg-violet-400' },
]

// Scrolling film strip
const filmPosters = [
  { title: 'Interstellar', icon: Film,     gradient: 'bg-gradient-to-br from-blue-950 to-indigo-900' },
  { title: 'Breaking Bad', icon: Tv,       gradient: 'bg-gradient-to-br from-emerald-950 to-emerald-900' },
  { title: 'Dune',         icon: BookOpen, gradient: 'bg-gradient-to-br from-amber-950 to-amber-900' },
  { title: 'Inception',    icon: Film,     gradient: 'bg-gradient-to-br from-violet-950 to-violet-900' },
  { title: 'Dark',         icon: Tv,       gradient: 'bg-gradient-to-br from-slate-900 to-gray-900' },
  { title: '1984',         icon: BookOpen, gradient: 'bg-gradient-to-br from-red-950 to-red-900' },
  { title: 'The Matrix',   icon: Film,     gradient: 'bg-gradient-to-br from-green-950 to-green-900' },
  { title: 'Severance',    icon: Tv,       gradient: 'bg-gradient-to-br from-zinc-900 to-zinc-800' },
  { title: 'Sapiens',      icon: BookOpen, gradient: 'bg-gradient-to-br from-orange-950 to-orange-900' },
  { title: 'Oppenheimer',  icon: Film,     gradient: 'bg-gradient-to-br from-yellow-950 to-orange-950' },
  { title: 'Chernobyl',    icon: Tv,       gradient: 'bg-gradient-to-br from-gray-900 to-slate-900' },
  { title: 'Cosmos',       icon: BookOpen, gradient: 'bg-gradient-to-br from-cyan-950 to-blue-950' },
]

// Movies bento card background grid
const cinemaBg = [
  'bg-gradient-to-br from-blue-900 to-blue-800',
  'bg-gradient-to-br from-rose-900 to-rose-800',
  'bg-gradient-to-br from-violet-900 to-violet-800',
  'bg-gradient-to-br from-indigo-900 to-indigo-800',
  'bg-gradient-to-br from-amber-900 to-amber-800',
  'bg-gradient-to-br from-emerald-900 to-emerald-800',
  'bg-gradient-to-br from-pink-900 to-pink-800',
  'bg-gradient-to-br from-teal-900 to-teal-800',
  'bg-gradient-to-br from-sky-900 to-sky-800',
]

// Book spines for the shelf
const bookSpines = [
  { title: 'Dune',                 h: 115, w: 24, color: '#92400e' },
  { title: 'Sapiens',              h: 98,  w: 20, color: '#1d4ed8' },
  { title: '1984',                 h: 125, w: 18, color: '#6d28d9' },
  { title: 'El señor de los anillos', h: 145, w: 22, color: '#15803d' },
  { title: 'Cosmos',               h: 104, w: 26, color: '#0e7490' },
  { title: 'Don Quijote',          h: 136, w: 20, color: '#be185d' },
  { title: 'Cien años de soledad', h: 120, w: 22, color: '#b45309' },
  { title: 'Neuromancer',          h: 90,  w: 16, color: '#475569' },
  { title: 'Fahrenheit 451',       h: 108, w: 20, color: '#dc2626' },
  { title: 'El principito',        h: 80,  w: 16, color: '#d97706' },
  { title: 'Fundación',            h: 118, w: 22, color: '#7c3aed' },
  { title: 'Juego de Tronos',      h: 155, w: 26, color: '#1f2937' },
]
</script>

<style scoped>
.landing { background: #060410; }

/* ── Ambient orbs ─────────────────────────────────────────────── */
.orb { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; }
.orb-1 { top: -15%; left: 28%; width: 700px; height: 700px; background: rgba(109,40,217,.12); }
.orb-2 { top: 35%; right: -12%; width: 500px; height: 500px; background: rgba(79,70,229,.09); }
.orb-3 { bottom: 0; left: -5%; width: 350px; height: 350px; background: rgba(147,51,234,.07); }

/* ── Poster wall ──────────────────────────────────────────────── */
.poster-wall {
  position: absolute; inset: 0; overflow: hidden;
  display: grid; grid-template-columns: repeat(6, 1fr);
  gap: 10px; padding: 16px;
  transform: rotate(8deg) scale(1.4);
  opacity: .18;
}
.poster-bg-card {
  aspect-ratio: 2/3; border-radius: 8px;
  border: 1px solid rgba(255,255,255,.05);
  display: flex; align-items: center; justify-content: center;
  animation: float 5s ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

/* ── Gradient text ────────────────────────────────────────────── */
.hero-gradient-text {
  background: linear-gradient(135deg, #a78bfa, #c084fc, #818cf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ── TV mockup ────────────────────────────────────────────────── */
.tv-wrapper { display: flex; flex-direction: column; align-items: center; }

.tv-glow {
  position: absolute; inset: -20px; border-radius: 50%;
  background: rgba(109,40,217,.25); filter: blur(60px); pointer-events: none;
}

.tv {
  position: relative; width: 320px;
  background: linear-gradient(160deg, #1e1830, #110d1e);
  border-radius: 20px; padding: 14px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 40px 80px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.06);
}

.tv-screen {
  background: #07040e; border-radius: 8px; overflow: hidden;
  position: relative; height: 220px;
  box-shadow: 0 0 0 1px rgba(255,255,255,.05), inset 0 0 40px rgba(109,40,217,.12);
}

.scanlines {
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.09) 2px, rgba(0,0,0,.09) 4px);
}
.screen-glare {
  position: absolute; top: 0; left: 0; right: 0; height: 40%;
  background: linear-gradient(to bottom, rgba(255,255,255,.04), transparent);
  border-radius: 8px 8px 0 0; pointer-events: none;
}

.tv-bezel-bottom { height: 18px; display: flex; align-items: center; justify-content: center; margin-top: 8px; }
.tv-power { width: 6px; height: 6px; background: rgba(109,40,217,.85); border-radius: 50%; box-shadow: 0 0 8px rgba(109,40,217,.7); }

.tv-neck { width: 20px; height: 24px; background: linear-gradient(to bottom, #1e1830, #110d1e); border-left: 1px solid rgba(255,255,255,.04); border-right: 1px solid rgba(255,255,255,.04); }
.tv-base { width: 90px; height: 7px; background: linear-gradient(to bottom, #1e1830, #130f20); border-radius: 4px; border: 1px solid rgba(255,255,255,.05); box-shadow: 0 4px 16px rgba(0,0,0,.5); }

/* ── Film strip ───────────────────────────────────────────────── */
.film-strip { background: #04030a; padding: 6px 0; position: relative; overflow: hidden; }

.sprockets { display: flex; gap: 16px; padding: 3px 0; overflow: hidden; }
.sprocket { width: 12px; height: 8px; background: rgba(255,255,255,.07); border-radius: 2px; flex-shrink: 0; }

.film-track-outer { overflow: hidden; padding: 5px 0; }
.film-track {
  display: flex; gap: 6px; width: max-content;
  animation: marquee 30s linear infinite;
}
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

.film-frame {
  width: 76px; height: 108px; border-radius: 4px; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  padding: 6px; gap: 3px; border: 1px solid rgba(255,255,255,.06); position: relative; overflow: hidden;
}
.film-frame::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.75));
}
.film-label {
  position: relative; z-index: 1;
  font-size: 6.5px; color: rgba(255,255,255,.55); font-weight: 700;
  text-align: center; line-height: 1.3; letter-spacing: .4px; text-transform: uppercase;
}

/* ── Bento feature cards ──────────────────────────────────────── */
.bento-card {
  background: #0e0b18; border: 1px solid rgba(255,255,255,.06); border-radius: 20px; overflow: hidden;
  transition: border-color .25s, transform .25s;
}
.bento-card:hover { border-color: rgba(255,255,255,.13); transform: translateY(-3px); }

.bg-radial-violet {
  background: radial-gradient(ellipse at 50% 100%, rgba(109,40,217,.2) 0%, transparent 70%);
}
.bg-radial-amber {
  background: radial-gradient(ellipse at 50% 100%, rgba(180,83,9,.18) 0%, transparent 70%);
}

/* ── Mini TV (series card) ────────────────────────────────────── */
.mini-tv {
  width: 155px;
  background: linear-gradient(160deg, #1e1830, #110d1e);
  border-radius: 12px; padding: 7px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 20px 50px rgba(0,0,0,.6), 0 0 30px rgba(109,40,217,.18);
}
.mini-tv-screen {
  background: #07040e; border-radius: 6px; height: 118px; overflow: hidden;
  position: relative; box-shadow: inset 0 0 20px rgba(109,40,217,.1);
}
.mini-scanlines {
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.1) 2px, rgba(0,0,0,.1) 4px);
}
.mini-bezel { height: 14px; display: flex; align-items: center; justify-content: center; margin-top: 5px; }
.mini-power { width: 4px; height: 4px; background: rgba(109,40,217,.9); border-radius: 50%; box-shadow: 0 0 6px rgba(109,40,217,.7); }

/* ── Bookshelf ────────────────────────────────────────────────── */
.shelf-container { position: relative; padding-bottom: 0; }

.book-spine {
  flex-shrink: 0; border-radius: 2px 2px 0 0; position: relative;
  display: flex; align-items: flex-start; justify-content: center; padding-top: 5px;
  cursor: default; transition: transform .25s ease;
  box-shadow: 2px 0 4px rgba(0,0,0,.5), inset -2px 0 4px rgba(0,0,0,.25), inset 1px 0 rgba(255,255,255,.07);
}
.book-spine:hover { transform: translateY(-8px); }

.book-title {
  writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg);
  font-size: 5.5px; font-weight: 700; color: rgba(255,255,255,.35);
  letter-spacing: .5px; max-height: 90%; overflow: hidden;
}

.shelf-plank {
  height: 13px;
  background: linear-gradient(to bottom, #8b6338, #5c3d1e);
  border-top: 2px solid #a07850;
  box-shadow: 0 6px 16px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.1);
}
.shelf-shadow { height: 10px; background: linear-gradient(to bottom, rgba(0,0,0,.5), transparent); }

/* ── CTA ──────────────────────────────────────────────────────── */
.cta-orb {
  position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
  width: 600px; height: 400px; border-radius: 50%;
  background: radial-gradient(ellipse, rgba(109,40,217,.15) 0%, transparent 70%);
  filter: blur(40px); pointer-events: none;
}

/* ── Responsive ───────────────────────────────────────────────── */
@media (max-width: 640px) {
  .tv { width: 280px; }
  .tv-screen { height: 190px; }
}
</style>
