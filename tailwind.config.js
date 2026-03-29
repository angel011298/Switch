/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        zinc: {
          900: "#18181b",
          950: "#09090b",
        },
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-up-1':  'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.08s forwards',
        'fade-up-2':  'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.16s forwards',
        'fade-up-3':  'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.24s forwards',
        'fade-up-4':  'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.32s forwards',
        'fade-in':    'fade-in 0.4s ease-out forwards',
        'scale-in':   'scale-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
      },
    },
  },
  plugins: [],
};