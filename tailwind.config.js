/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        fadeIn: 'fadeIn 0.5s ease-out',
        neon: 'neonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        neonPulse: {
          '0%, 100%': {
            textShadow:
              '0 0 7px #f5576c, 0 0 10px #f5576c, 0 0 21px #f5576c, 0 0 42px #f093fb',
          },
          '50%': {
            textShadow:
              '0 0 10px #f5576c, 0 0 20px #f5576c, 0 0 40px #f093fb, 0 0 80px #f093fb',
          },
        },
      },
      colors: {
        cyber: {
          pink: '#f5576c',
          purple: '#f093fb',
          dark: '#0a0a12',
        },
      },
    },
  },
  plugins: [],
};
