import type { MetadataRoute } from 'next'
import { BACKGROUND_COLOR, SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from '../seo/site'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Tüm Süreçler Tek Platform`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    lang: 'tr',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/assets/bachmain-logo.png',
        sizes: '720x87',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
