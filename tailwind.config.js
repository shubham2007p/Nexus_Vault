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
        workspace: {
          bg: '#111113',
          surface: '#17171a',
          sidebar: '#151518',
          editor: '#131316',
          header: '#141417',
          card: '#1c1c20',
          'card-hover': '#232328',
          active: '#27272e',
          border: '#26262c',
          'border-subtle': '#1f1f24',
          'border-focus': 'rgba(167, 139, 250, 0.45)',
          text: '#f4f4f5',
          'text-secondary': '#d4d4d8',
          muted: '#8e8e98',
          faint: '#5a5a64',
          accent: '#8b5cf6',
          'accent-light': '#a78bfa',
          'accent-muted': 'rgba(139, 92, 246, 0.12)',
          'accent-border': 'rgba(139, 92, 246, 0.32)',
        },
        editorial: {
          bg: '#FAF8F5',
          paper: '#F4EFEA',
          surface: '#FFFFFF',
          border: '#E7E2DA',
          'border-subtle': '#F0EBE1',
          text: '#1C1917',
          'text-muted': '#66605A',
          'text-faint': '#9C958D',
          sage: '#2D5A43',
          'sage-dark': '#1C3A2B',
          'sage-light': '#EBF2EE',
          'sage-border': '#B7D0C2',
          accent: '#9A3412',
          sand: '#ECE7DF'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
