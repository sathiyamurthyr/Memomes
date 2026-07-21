/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0B0F17',
          container: '#10141F',
          card: '#161C2C',
          hover: '#1E263B'
        },
        primary: {
          DEFAULT: '#A00D3A',
          hover: '#BD1045',
          light: '#E61E58'
        },
        accent: {
          gold: '#FFC928',
          blue: '#3B82F6',
          green: '#10B981',
          purple: '#8B5CF6'
        },
        stroke: {
          default: '#232836',
          light: '#2E3547'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
