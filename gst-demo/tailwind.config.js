/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gst: {
          blue: '#0b3c68',
          saffron: '#f37021',
          green: '#138808',
          light: '#f0f5fa',
        }
      }
    },
  },
  plugins: [],
}