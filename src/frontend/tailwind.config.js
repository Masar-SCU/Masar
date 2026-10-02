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
          50: '#E6F7F5',  // Light tint
          600: '#0F766E', // Primary Teal (Main Brand Color)
          700: '#115E59',
        },
        severity: {
         critical: '#B91C1C', 
          moderate: '#C2410C',
          minor: '#A16207',
          met: '#15803D',
          strength: '#9333ea', 
        }
      }
    },
  },
  plugins: [],
}