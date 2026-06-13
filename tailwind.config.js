/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151d35',
          600: '#1a2540',
          500: '#243052',
        },
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          orange: '#f59e0b',
          purple: '#8b5cf6',
          red: '#ef4444',
          yellow: '#eab308',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
