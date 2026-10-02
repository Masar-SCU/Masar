/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8f0fe',
          500: '#1a73e8', // Masar Primary Blue
          600: '#1557b0',
          700: '#174ea6',
        },
        severity: {
          critical: '#d93025',
          moderate: '#f2994a',
          minor: '#f9ab00',
          met: '#1e8e3e',
          strength: '#9333ea',
        }
      }
    },
  },
  plugins: [],
}