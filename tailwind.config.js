/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ceramic: 'var(--ceramic)',
        panel: 'var(--panel)',
        canvas: 'var(--bg-1)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        surface3: 'var(--surface-3)',
        s2: 'var(--surface-2)',
        s3: 'var(--surface-3)',
        blue: {
          DEFAULT: 'var(--instrument)',
          deep: 'var(--instrument-deep)',
          soft: 'var(--instrument-soft)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        instrument: {
          DEFAULT: 'var(--instrument)',
          deep: 'var(--instrument-deep)',
          soft: 'var(--instrument-soft)',
        },
        accent: {
          teal: 'var(--teal)',
          violet: 'var(--violet)',
          amber: 'var(--amber)',
          coral: 'var(--coral)',
        },
        status: {
          ok: {
            DEFAULT: 'var(--status-ok)',
            soft: 'var(--status-ok-soft)',
          },
          info: {
            DEFAULT: 'var(--status-info)',
            soft: 'var(--status-info-soft)',
          },
          watch: {
            DEFAULT: 'var(--status-watch)',
            soft: 'var(--status-watch-soft)',
          },
          review: {
            DEFAULT: 'var(--status-review)',
            soft: 'var(--status-review-soft)',
          },
          urgent: {
            DEFAULT: 'var(--status-urgent)',
            soft: 'var(--status-urgent-soft)',
          },
        },
      },
      fontFamily: {
        sans: ['"SF Pro Text"', '"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Inter Variable"', 'Inter', '"Segoe UI Variable Text"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        chip: '8px',
        input: '10px',
        sheet: '16px',
        panel: '18px',
        pill: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
        sm: 'var(--shadow-sm)',
        xs: 'var(--shadow-xs)',
      },
      backgroundImage: {
        'app-wash':
          'radial-gradient(1200px 680px at 50% -18%, #ffffff 0%, rgba(255,255,255,0) 62%), linear-gradient(180deg, #f7f7f9 0%, #f5f5f7 58%, #f2f2f5 100%)',
      },
      screens: {
        '3xl': '1680px',
      },
    },
  },
  plugins: [],
};
