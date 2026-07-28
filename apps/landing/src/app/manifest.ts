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
        src: '/favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
