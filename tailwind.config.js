/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ceramic: 'var(--ceramic)',
        panel: 'var(--panel)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        line: 'var(--line)',
        instrument: {
          DEFAULT: 'var(--instrument)',
          soft: 'var(--instrument-soft)',
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
        sans: ['"Atkinson Hyperlegible"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        chip: '6px',
        input: '6px',
        sheet: '12px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 26, 43, 0.08)',
      },
    },
  },
  plugins: [],
};
