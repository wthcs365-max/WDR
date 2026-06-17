/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1A2026',
          dark: '#0F1316',
          light: '#2D353F',
        },
        gold: {
          DEFAULT: '#C5A059',
          dark: '#9E7E43',
          light: '#DCC389',
        },
        softgrey: {
          DEFAULT: '#F4F7F9',
          dark: '#E2E8F0',
        },
        surface: '#FFFFFF',
        offblack: '#2D3436',
        emerald: {
          DEFAULT: '#00B894',
          dark: '#009475',
          light: '#55EFC4',
        },
        marigold: {
          DEFAULT: '#FDCB6E',
          dark: '#E1B12C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 2px 4px rgba(0,0,0,0.05)',
        medium: '0 4px 8px rgba(0,0,0,0.1)',
        glow: '0 0 15px rgba(197, 160, 89, 0.3)',
      }
    },
  },
  plugins: [],
}
