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
      animation: {
        first:  'moveVertical 10s ease infinite',
        second: 'moveInCircle 8s reverse infinite',
        third:  'moveInCircle 14s linear infinite',
        fourth: 'moveHorizontal 12s ease infinite',
        fifth:  'moveInCircle 9s ease infinite',
      },
      keyframes: {
        moveHorizontal: {
          '0%':   { transform: 'translateX(-50%) translateY(-10%)' },
          '50%':  { transform: 'translateX(50%) translateY(10%)' },
          '100%': { transform: 'translateX(-50%) translateY(-10%)' },
        },
        moveInCircle: {
          '0%':   { transform: 'rotate(0deg)' },
          '50%':  { transform: 'rotate(180deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        moveVertical: {
          '0%':   { transform: 'translateY(-50%)' },
          '50%':  { transform: 'translateY(50%)' },
          '100%': { transform: 'translateY(-50%)' },
        },
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
