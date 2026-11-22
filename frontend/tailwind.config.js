/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kala: {
          terra: '#b94723',
          saffron: '#e86a17',
          gold: '#d99726',
          indigo: '#1c2854',
          slate: '#0f172a',
          sand: '#fbf7ee',
          cream: '#f5edd6',
          teal: '#0e7490',
          forest: '#15803d'
        }
      }
    },
  },
  plugins: [],
}