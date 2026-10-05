/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent:      '#F5C400',
        'accent-dk': '#C9A200',
        'accent-lt': '#FFF3C4',
        'accent-text': '#8A6D00',
        surface:     '#0a0a0a',
        'surface-2': '#141414',
        'surface-3': '#1a1a1a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        logo: ['Bodoni Moda', 'Georgia', 'serif'],
      },
      borderRadius: {
        'apple': '2rem',
        '2xl':   '1.25rem',
        '3xl':   '1.5rem',
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'word-in': {
          from: { opacity: '0', transform: 'translateY(60%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 300ms ease-out both',
        'sheet-in': 'sheet-in 300ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'word-in': 'word-in 500ms ease-out both',
      },
      boxShadow: {
        'soft':  '0 2px 15px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        'card':  '0 2px 15px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        'card-lg': '0 8px 30px rgba(0,0,0,0.08)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.10)',
        'input': '0 1px 3px rgba(0,0,0,0.04)',
        'modal': '0 25px 60px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.08)',
        'glow-accent': '0 0 20px rgba(245, 196, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
