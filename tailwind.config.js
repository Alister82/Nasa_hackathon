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
        ink: {
          DEFAULT: 'var(--ink)',
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
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Manrope Variable"', 'Manrope', '"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        chip: '8px',
        input: '12px',
        sheet: '18px',
        panel: '22px',
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
          'radial-gradient(1100px 600px at 78% -12%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0) 62%), radial-gradient(900px 700px at -8% 18%, rgba(198,222,255,0.42) 0%, rgba(198,222,255,0) 58%), linear-gradient(168deg, #fbfdff 0%, #eef5ff 44%, #e7f0fb 100%)',
      },
      screens: {
        '3xl': '1680px',
      },
    },
  },
  plugins: [],
};
