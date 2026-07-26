import type { Metadata } from 'next'
import {
  absoluteUrl,
  OG_IMAGE,
  OG_IMAGE_ALT,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from './site'

export type PageSeo = {
  path: string
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  twitterTitle?: string
  twitterDescription?: string
  keywords?: string[]
  focusKeyword?: string
  secondaryKeywords?: string[]
  aiSearchDescription?: string
  h1?: string
  h2?: string[]
  h3?: string[]
  schemaType?: string
  relatedPaths?: Array<{ label: string; path: string }>
  /** Short body paragraphs for on-page SEO (design-safe) */
  intro?: string
  sections?: Array<{ h2: string; body: string; h3?: Array<{ title: string; body: string }> }>
  ogType?: 'website' | 'article'
  noIndex?: boolean
  image?: string
  imageAlt?: string
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  breadcrumbs?: Array<{ name: string; path: string }>
  /** When set, canonical / OG url point here (redirect aliases → short URLs). */
  canonicalPath?: string
}

/** Next.js Metadata API builder — App Router standard. */
export function buildMetadata(page: PageSeo): Metadata {
  const url = absoluteUrl(page.canonicalPath || page.path)
  const title = page.title.includes(SITE_NAME) ? page.title : `${page.title} | ${SITE_NAME}`
  const description = page.description
  const ogTitle = page.ogTitle
    ? page.ogTitle.includes(SITE_NAME)
      ? page.ogTitle
      : `${page.ogTitle} | ${SITE_NAME}`
    : title
  const ogDescription = page.ogDescription || description
  const twitterTitle = page.twitterTitle
    ? page.twitterTitle.includes(SITE_NAME)
      ? page.twitterTitle
      : `${page.twitterTitle} | ${SITE_NAME}`
    : ogTitle
  const twitterDescription = page.twitterDescription || ogDescription
  const image = page.image || OG_IMAGE
  const imageAlt = page.imageAlt || OG_IMAGE_ALT
  const keywordList = [
    ...(page.focusKeyword ? [page.focusKeyword] : []),
    ...(page.secondaryKeywords || []),
    ...(page.keywords || []),
  ]
  const robots = page.noIndex
    ? { index: false, follow: false, nocache: true }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large' as const,
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      }

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: keywordList.length ? [...new Set(keywordList)] : undefined,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
      languages: { 'tr-TR': url },
    },
    robots,
    openGraph: {
      type: page.ogType || 'website',
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      ...(page.publishedTime ? { publishedTime: page.publishedTime } : {}),
      ...(page.modifiedTime ? { modifiedTime: page.modifiedTime } : {}),
      ...(page.authors?.length ? { authors: page.authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      images: [image],
    },
    category: 'technology',
    other: page.aiSearchDescription ? { 'ai:description': page.aiSearchDescription } : undefined,
  }
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Tüm Süreçler Tek Platformda`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/bachmain-logo.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/assets/bachmain-logo.png', sizes: '180x180' }],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Tüm Süreçler Tek Platformda`,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Tüm Süreçler Tek Platformda`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
}
