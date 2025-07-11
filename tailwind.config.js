/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokyo Night color palette
        tokyo: {
          bg: '#1a1b26',
          bgDark: '#16161e',
          bgHighlight: '#292e42',
          terminal: '#15161e',
          fg: '#c0caf5',
          fgDark: '#a9b1d6',
          comment: '#565f89',
          cyan: '#7dcfff',
          blue: '#7aa2f7',
          purple: '#bb9af7',
          magenta: '#c678dd',
          red: '#f7768e',
          orange: '#ff9e64',
          yellow: '#e0af68',
          green: '#9ece6a',
          teal: '#73daca',
          border: '#292e42',
          borderBright: '#3b4261',
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(125, 207, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(125, 207, 255, 0.8)' },
        }
      }
    },
  },
  plugins: [],
};