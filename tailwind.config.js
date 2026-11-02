/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terra: {
          bg: '#080c14',
          surface: '#0f172a',
          surfaceBorder: '#1e293b',
          surfaceHover: '#1e293b80',
          muted: '#64748b',
          hydro: '#00e5ff',
          strata: '#f59e0b',
          mineral: '#a855f7',
          ai: '#6366f1',
          observed: '#10b981',
          modelled: '#38bdf8',
          predicted: '#fbbf24',
          simulated: '#ec4899',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
