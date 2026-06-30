import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base:     '#0d0d12',
        elevated: '#13131a',
        overlay:  '#1a1a24',
        accent:   '#7c6dfa',
        green:    '#34d399',
        border:   'rgba(255,255,255,0.06)',
        't1':     '#f0f0f5',
        't2':     '#9090a8',
        't3':     '#55556a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease both',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'blink':    'blink 1s step-end infinite',
        'spin-slow':'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
    },
  },
  plugins: [],
}

export default config
