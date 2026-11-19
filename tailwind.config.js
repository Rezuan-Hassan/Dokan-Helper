/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF7',
          100: '#FBF9F1',
          200: '#F5F2E7',
          300: '#ECE6D6',
          400: '#DFD8C4',
        },
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        coral: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.06)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.1)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.04)',
        'glow-emerald': '0 0 24px rgba(16, 185, 129, 0.28)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
