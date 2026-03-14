import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366f1',
          secondary: '#a855f7',
          dark: '#0f172a',
          card: '#1e293b'
        },
        git: {
          dark: '#1a1b26',
          panel: '#24283b',
          border: '#414868',
          text: '#a9b1d6',
          accent: '#7aa2f7',
          'commit-main': '#bb9af7',
          'commit-feature': '#7dcfff',
          'commit-hotfix': '#f7768e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: [forms]
}
