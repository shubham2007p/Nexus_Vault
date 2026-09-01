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
        obsidian: {
          bg: '#1e1e1e',
          sidebar: '#181818',
          card: '#262626',
          border: '#2e2e2e',
          hover: '#2a2a2a',
          active: '#363636',
          text: '#dcddde',
          muted: '#999999',
          accent: '#70a5fd',
        }
      }
    },
  },
  plugins: [],
}
