import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { rootMetadata } from '../seo/buildMetadata'
import { BACKGROUND_COLOR, SITE_URL, THEME_COLOR } from '../seo/site'
import SiteShell from '../components/seo/SiteShell'
import AnalyticsScripts from '../components/sales/AnalyticsScripts'
import '../index.css'

/**
 * Site brand font is Poppins (existing design system).
 * Sora is not used in production UI — optimizing Poppins via next/font instead
 * of Google Fonts CSS links (self-hosted, swap, preload, subset).
 */
const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
})

export const metadata: Metadata = rootMetadata

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={poppins.variable}>
      <head>
        <link rel="dns-prefetch" href="https://bachmain.com" />
        <link rel="preconnect" href={SITE_URL} crossOrigin="anonymous" />
        <meta name="theme-color" content={THEME_COLOR} />
        <meta name="msapplication-TileColor" content={THEME_COLOR} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.png?v=2" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-32.png?v=2" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-192.png?v=2" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180" />
      </head>
      <body
        className={poppins.className}
        style={{
          ['--font-sans' as string]: 'var(--font-poppins)',
          backgroundColor: BACKGROUND_COLOR,
        }}
      >
        <SiteShell>{children}</SiteShell>
        <AnalyticsScripts />
      </body>
    </html>
  )
}
