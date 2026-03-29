/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: 'rgb(15 23 42)',   // slate-950
          raised:  'rgb(17 24 39)',   // slate-900 ish
          overlay: 'rgb(30 41 59)',   // slate-800
        },
      },
      animation: {
        'fade-in':    'fadeIn .15s ease',
        'fade-up':    'fadeUp .25s ease',
        'slide-in':   'slideIn .3s cubic-bezier(.32,.72,0,1)',
        'skeleton':   'skeleton 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:  { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        skeleton: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '.35' },
        },
      },
      transitionTimingFunction: {
        drawer: 'cubic-bezier(.32,.72,0,1)',
      },
    },
  },
  plugins: [],
}
