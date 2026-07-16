/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './packages/ui/src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151d35',
          600: '#1a2540',
          500: '#243052',
        },
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          orange: '#f59e0b',
          purple: '#8b5cf6',
          red: '#ef4444',
          yellow: '#eab308',
        },
        ds: {
          primary: 'var(--ds-primary)',
          secondary: 'var(--ds-secondary)',
          bg: 'var(--ds-bg)',
          surface: 'var(--ds-surface)',
          border: 'var(--ds-border)',
          ink: 'var(--ds-ink)',
          muted: 'var(--ds-muted)',
          success: 'var(--ds-success)',
          warning: 'var(--ds-warning)',
          danger: 'var(--ds-danger)',
          info: 'var(--ds-info)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          'SF Pro Display',
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      fontSize: {
        'ds-display': ['var(--ds-font-display)', { lineHeight: '1.25', fontWeight: '700' }],
        'ds-h1': ['var(--ds-font-h1)', { lineHeight: '1.25', fontWeight: '700' }],
        'ds-h2': ['var(--ds-font-h2)', { lineHeight: '1.25', fontWeight: '600' }],
        'ds-h3': ['var(--ds-font-h3)', { lineHeight: '1.25', fontWeight: '600' }],
        'ds-body-lg': ['var(--ds-font-body-lg)', { lineHeight: '1.5', fontWeight: '400' }],
        'ds-body': ['var(--ds-font-body)', { lineHeight: '1.5', fontWeight: '400' }],
        'ds-small': ['var(--ds-font-small)', { lineHeight: '1.4', fontWeight: '400' }],
        'ds-caption': ['var(--ds-font-caption)', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'ds-sidebar': 'var(--ds-sidebar-expanded)',
        'ds-sidebar-mini': 'var(--ds-sidebar-collapsed)',
        'ds-header': 'var(--ds-header-h)',
      },
      borderRadius: {
        'ds-sm': 'var(--ds-radius-sm)',
        'ds-md': 'var(--ds-radius-md)',
        'ds-lg': 'var(--ds-radius-lg)',
        'ds-xl': 'var(--ds-radius-xl)',
        'ds-hero': 'var(--ds-radius-hero)',
      },
      boxShadow: {
        'ds-xs': 'var(--ds-shadow-xs)',
        'ds-sm': 'var(--ds-shadow-sm)',
        'ds-md': 'var(--ds-shadow-md)',
        'ds-lg': 'var(--ds-shadow-lg)',
        'ds-xl': 'var(--ds-shadow-xl)',
      },
      minHeight: {
        control: 'var(--ds-control-h)',
      },
      height: {
        control: 'var(--ds-control-h)',
        header: 'var(--ds-header-h)',
      },
      width: {
        sidebar: 'var(--ds-sidebar-expanded)',
        'sidebar-mini': 'var(--ds-sidebar-collapsed)',
      },
      transitionDuration: {
        hover: '150ms',
        dropdown: '200ms',
        drawer: '250ms',
        page: '300ms',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1100',
        drawer: '1200',
        modal: '1300',
        toast: '1400',
        command: '1500',
      },
    },
  },
  plugins: [],
}
