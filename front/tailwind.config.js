/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 청담 — 맑은 물 톤의 브랜드 스케일
      colors: {
        brand: {
          50:  '#EDF6FE',
          100: '#DBEAFB',
          200: '#B4D5F6',
          300: '#7FB7EE',
          400: '#4F95E3',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
        },
        ink: {
          DEFAULT: '#0B1B3D',
          2:       '#2A3A5C',
          3:       '#56678A',
          4:       '#8B98B5',
        },
        line: {
          DEFAULT: '#E3EAF4',
          2:       '#EEF2F8',
        },
        surface:   '#FFFFFF',
        'surface-2': '#F8FBFE',
        canvas:    '#F5F9FE',
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"', 'Pretendard',
          '-apple-system', 'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"', '"Noto Sans KR"', 'sans-serif',
        ],
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #5BAEDC 0%, #2563EB 100%)',
        'brand-grad-soft': 'linear-gradient(135deg, #E8F3FD 0%, #DBE9FB 100%)',
      },
      boxShadow: {
        'cd-sm': '0 1px 2px rgba(15, 35, 80, 0.04), 0 1px 1px rgba(15, 35, 80, 0.03)',
        'cd-md': '0 4px 16px rgba(15, 35, 80, 0.06), 0 1px 2px rgba(15, 35, 80, 0.04)',
        'cd-lg': '0 12px 40px rgba(15, 35, 80, 0.10), 0 2px 6px rgba(15, 35, 80, 0.05)',
        'brand-glow': '0 4px 14px rgba(37, 99, 235, 0.25), 0 1px 2px rgba(37, 99, 235, 0.15)',
      },
      borderRadius: {
        'cd-sm': '8px',
        'cd-md': '12px',
        'cd-lg': '16px',
        'cd-xl': '22px',
      },
      animation: {
        ripple:    'cd-ripple 3.6s ease-out infinite',
        'ripple-delayed': 'cd-ripple 3.6s ease-out 1.8s infinite',
        'msg-in':  'cd-msg-in 320ms cubic-bezier(.2,.7,.2,1)',
        'fade-in': 'cd-fade-in 200ms ease-out',
        'scale-in': 'cd-scale-in 240ms cubic-bezier(.2,.7,.2,1)',
        'blink':   'cd-blink 900ms infinite',
        'pulse-soft': 'cd-pulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        'cd-ripple': {
          '0%':   { transform: 'scale(0.45)', opacity: '0.85' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
        'cd-msg-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'cd-fade-in': {
          from: { opacity: '0' }, to: { opacity: '1' },
        },
        'cd-scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'cd-blink': {
          '0%, 50%':   { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'cd-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.9)' },
          '50%':      { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
