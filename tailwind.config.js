/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./popup.html",
    "./sidepanel.html",
    "./dashboard.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tabato Light & Dark theme design tokens
        brand: {
          bg: '#F4F5F7',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          hover: '#EEF0F4',
          border: '#ECEEF2',
          borderStrong: '#DCE0E7',
          ink: '#1E2530',
          secondary: '#6B7280',
          muted: '#9CA3AF',
          pillBg: '#F1F3F6',
        },
        darkBrand: {
          bg: '#0E1217',
          surface: '#161B22',
          elevated: '#21262D',
          hover: '#29303C',
          border: '#2B323D',
          borderStrong: '#3B4454',
          ink: '#F0F6FC',
          secondary: '#8B949E',
          muted: '#656D76',
          pillBg: '#1C222C',
        },
        // Tabato Terracotta Accent
        terracotta: {
          50: '#FDF5F3',
          100: '#FCEAE6',
          200: '#F9D5CD',
          400: '#EE7356',
          500: '#E05638', // Iconic Tabato Terracotta
          600: '#CA472A',
          700: '#A9361D',
        },
        // Accents
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // Electric Indigo
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        lime: {
          300: '#EAF8A8',
          400: '#D9F36A',
          500: '#C8F169',
          600: '#A3D936',
          700: '#7FA824',
          800: '#526A08',
        },
        coral: {
          50: '#FFF5F3',
          100: '#FFEBE7',
          400: '#FF8A77',
          500: '#FF735C',
          600: '#EE5B43',
          700: '#C94029',
        },
        // Semantic status tokens
        status: {
          applied: '#4F46E5',
          appliedBg: '#EEF2FF',
          screening: '#0284C7',
          screeningBg: '#F0F9FF',
          assessment: '#EA580C',
          assessmentBg: '#FFF7ED',
          interview: '#7C3AED',
          interviewBg: '#F5F3FF',
          offer: '#16A34A',
          offerBg: '#F0FDF4',
          rejected: '#E11D48',
          rejectedBg: '#FFF1F2',
          withdrawn: '#64748B',
          withdrawnBg: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ]
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(21, 23, 28, 0.04), 0 1px 3px 0 rgba(21, 23, 28, 0.02)',
        'float': '0 4px 16px -2px rgba(21, 23, 28, 0.08), 0 2px 6px -1px rgba(21, 23, 28, 0.04)',
        'modal': '0 12px 36px -4px rgba(21, 23, 28, 0.16), 0 4px 12px -2px rgba(21, 23, 28, 0.08)',
        'dark-float': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
      },
      transitionTimingFunction: {
        'productive': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        'fast': '120ms',
        'normal': '180ms',
        'deliberate': '240ms',
      }
    },
  },
  plugins: [],
}
