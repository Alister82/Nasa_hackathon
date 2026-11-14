/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Surfaces ──
        'bg-app':      'var(--bg-app)',
        'bg-surface':  'var(--bg-surface)',
        'bg-surface-2':'var(--bg-surface-2)',
        'bg-surface-3':'var(--bg-surface-3)',
        'bg-glass':    'var(--bg-glass)',
        // ── Backward compat ──
        ceramic:  'var(--bg-app)',
        panel:    'var(--bg-surface)',
        // ── Text ──
        ink: {
          DEFAULT: 'var(--text-primary)',
          soft:    'var(--text-secondary)',
          muted:   'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        // ── Borders ──
        line:     'var(--border-default)',
        border:   {
          DEFAULT: 'var(--border-default)',
          strong:  'var(--border-strong)',
          subtle:  'var(--border-subtle)',
        },
        // ── Brand accent ──
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover:   'var(--accent-hover)',
          soft:    'var(--accent-soft)',
          'soft-2':'var(--accent-soft-2)',
        },
        // ── Backward compat ──
        instrument: {
          DEFAULT: 'var(--accent-primary)',
          soft:    'var(--accent-soft)',
        },
        // ── Status ──
        status: {
          ok:     { DEFAULT: 'var(--status-ok)',     soft: 'var(--status-ok-bg)' },
          watch:  { DEFAULT: 'var(--status-watch)',  soft: 'var(--status-watch-bg)' },
          review: { DEFAULT: 'var(--status-review)', soft: 'var(--status-review-bg)' },
          urgent: { DEFAULT: 'var(--status-urgent)', soft: 'var(--status-urgent-bg)' },
          info:   { DEFAULT: 'var(--status-info)',   soft: 'var(--status-info-bg)' },
        },
        // ── Chart palette ──
        chart: {
          blue:   'var(--chart-blue)',
          teal:   'var(--chart-teal)',
          violet: 'var(--chart-violet)',
          amber:  'var(--chart-amber)',
          coral:  'var(--chart-coral)',
          sky:    'var(--chart-sky)',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"SF Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        chip:  '6px',
        input: '8px',
        card:  '12px',
        sheet: '14px',
        xl2:   '20px',
        pill:  '9999px',
      },
      boxShadow: {
        'xs':    '0 1px 2px rgba(16, 37, 68, 0.06)',
        'card':  '0 1px 4px rgba(16, 37, 68, 0.08), 0 1px 2px rgba(16, 37, 68, 0.04)',
        'md':    '0 4px 12px rgba(16, 37, 68, 0.10), 0 1px 4px rgba(16, 37, 68, 0.06)',
        'lg':    '0 8px 24px rgba(16, 37, 68, 0.12), 0 2px 8px rgba(16, 37, 68, 0.06)',
        'glass': '0 2px 16px rgba(40, 105, 216, 0.08), 0 1px 4px rgba(16, 37, 68, 0.06)',
        'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      width: {
        sidebar: '240px',
      },
      minWidth: {
        sidebar: '240px',
      },
      maxWidth: {
        content: '1200px',
      },
      screens: {
        'xs': '390px',
      },
      spacing: {
        'topbar': '56px',
        'sidebar': '240px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
