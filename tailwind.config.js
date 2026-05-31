/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rcb: {
          red: {
            DEFAULT: '#C91D2E',
            light: '#E23C4D',
            dark: '#8C101B',
          },
          gold: {
            DEFAULT: '#D1A22C',
            light: '#ECC65D',
            dark: '#977215',
          }
        },
        gt: {
          navy: {
            DEFAULT: '#0B1C33',
            light: '#162C4E',
            dark: '#050D19',
          },
          gold: {
            DEFAULT: '#D9B44A',
            light: '#F3CF6D',
            dark: '#A38128',
          }
        },
        brand: {
          dark: '#080C14',
          card: 'rgba(17, 24, 39, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#F3F4F6',
          muted: '#9CA3AF',
          accent: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(201, 29, 46, 0.2), 0 0 10px rgba(209, 162, 44, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(201, 29, 46, 0.6), 0 0 25px rgba(209, 162, 44, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
