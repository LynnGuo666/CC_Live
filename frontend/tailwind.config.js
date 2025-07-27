/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        teams: {
          red: '#FF0000',
          orange: '#FFA500',
          blue: '#0000FF',
          green: '#00FF00',
          yellow: '#FFFF00',
          cyan: '#00FFFF',
          purple: '#800080',
          white: '#FFFFFF',
          pink: '#FFC0CB',
          brown: '#A52A2A',
          lightBlue: '#ADD8E6',
          lightGray: '#D3D3D3',
        }
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        slideUp: {
          'from': { transform: 'translateY(100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgb(59 130 246 / 0.5)' },
          '50%': { boxShadow: '0 0 20px rgb(59 130 246 / 0.8)' }
        }
      }
    },
  },
  plugins: [],
}