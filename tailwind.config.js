/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366f1',
          secondary: '#a855f7',
          dark: '#0f172a',
          card: '#1e293b'
        }
      }
    }
  },
  plugins: []
}
