/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-void': '#050508',
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#12121a',
        'bg-tertiary': '#1a1a25',
        'bg-hover': '#252535',
        'accent-cyan': '#00f0ff',
        'accent-magenta': '#ff00a0',
        'accent-green': '#00ff41',
        'accent-amber': '#ffb000',
        'accent-red': '#ff3333',
        'text-primary': '#e8e8e8',
        'text-secondary': '#a0a0a0',
        'text-tertiary': '#606060',
        'text-dim': '#3a3a3a',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        ui: ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'scan-beam': 'scan-beam 6s linear infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        'scan-beam': {
          '0%': { top: '-4px' },
          '100%': { top: '100vh' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
