/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 🎨 COLORS
      colors: {
        // BRAND — Teal (LOCKED)
        brand: {
          50:  '#E6F7F5',   // Light tint
          100: '#CCFBF1',   // Subtle tint (avatars, badges)
          500: '#14B8A6',   // Medium teal (focus rings)
          600: '#0F766E',   // ⭐ Primary Teal (Main Brand Color)
          700: '#115E59',   // Hover / Active / Focus border
          800: '#134E4A',   // Active outline text
        },

        // 🏢 NEUTRAL
        neutral: {
          background: '#F8FAFC',
          surface:    '#FFFFFF',
          border:     '#E2E8F0',
          muted:      '#64748B',
          text:       '#0F172A',
          50:         '#F8FAFC',
          100:        '#F1F5F9',
          200:        '#E2E8F0',
          300:        '#CBD5E1',
          400:        '#94A3B8',
          500:        '#64748B',
          600:        '#475569',
          700:        '#334155',
          800:        '#1E293B',
          900:        '#0F172A',
        },

        // 🚨 ERROR / DESTRUCTIVE
        error: {
          DEFAULT: '#B91C1C',
          100:     '#FEE2E2',
          700:     '#B91C1C',
          800:     '#991B1B',
          bg:      '#FEF2F2',
        },

        // 🚦 SEVERITY (Gap Engine) — WCAG AA Validated
        severity: {
          critical: { DEFAULT: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5', 800: '#991B1B' },
          moderate: { DEFAULT: '#C2410C', bg: '#FFF7ED', border: '#FDBA74', 800: '#9A3412' },
          minor:    { DEFAULT: '#A16207', bg: '#FEFCE8', border: '#FDE047', 800: '#854D0E' },
          met:      { DEFAULT: '#15803D', bg: '#F0FDF4', border: '#86EFAC', 800: '#166534' },
          strength: { DEFAULT: '#9333EA', bg: '#FAF5FF', border: '#D8B4FE', 800: '#7E22CE' },
        },
      },

      // ✍️ TYPOGRAPHY
      fontFamily: {
        sans: ['"Thmanyah Sans"', 'Inter', 'Cairo', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1':      ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2':      ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h3':      ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h4':      ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'b1':      ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'b2':      ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'b3':      ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'body':    ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'small':   ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'label':   ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'button':  ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },

      // 🔲 BORDER RADIUS
      borderRadius: {
        'md': '8px',
        'lg': '12px',
      },
    },
  },
  plugins: [],
};