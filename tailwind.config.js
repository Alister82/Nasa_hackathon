/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ceramic: 'var(--ceramic)',
        panel: {
          DEFAULT: 'var(--panel)',
          solid: 'var(--panel-solid)',
          strong: 'var(--panel-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          muted: 'var(--ink-muted)',
        },
        line: 'var(--line)',
        glass: {
          border: 'var(--glass-border)',
          ring: 'var(--glass-ring)',
        },
        instrument: {
          DEFAULT: 'var(--instrument)',
          hover: 'var(--instrument-hover)',
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
        sans: ['"Inter Variable"', '"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        chip: '8px',
        input: '10px',
        sheet: '16px',
        card: '20px',
        panel: '24px',
        pill: '9999px',
      },
      boxShadow: {
        card: 'var(--card-shadow)',
        glass: '0 8px 32px 0 rgba(40, 70, 140, 0.08), 0 1px 3px 0 rgba(40, 70, 140, 0.04)',
        glow: '0 0 20px rgba(47, 107, 255, 0.25)',
      },
    },
  },
  plugins: [],
};
