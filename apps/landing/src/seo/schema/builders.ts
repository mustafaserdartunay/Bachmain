/**
 * Pure Schema.org JSON-LD builders — single source of structured data.
 * UI components in components/seo/schema wrap these (no duplicate logic).
 */
import { faqItems } from '../../data/navigation'
import { referencePricingPlans } from '../../components/pricing/pricingTokens'
import {
  absoluteUrl,
  SITE_CONTACT,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SOCIAL,
  SITE_URL,
} from '../site'
import type {
  ArticleInput,
  BreadcrumbItem,
  FaqItem,
  ImageObjectInput,
  JsonLd,
  ProductOfferInput,
  SoftwareAppInput,
  VideoObjectInput,
  WebPageInput,
} from './types'

export type { JsonLd, FaqItem, BreadcrumbItem }

const ORG_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const SOFTWARE_ID = `${SITE_URL}/#software`
const LOGO_URL = `${SITE_URL}/assets/bachmain-logo.png`

export function buildImageObject(input: ImageObjectInput): JsonLd {
  return {
    '@type': 'ImageObject',
    url: input.url,
    ...(input.width ? { width: input.width } : {}),
    ...(input.height ? { height: input.height } : {}),
    ...(input.caption || input.alt ? { caption: input.caption || input.alt } : {}),
  }
}

export function buildContactPoint(extra?: Partial<JsonLd>): JsonLd {
  return {
    '@type': 'ContactPoint',
    telephone: SITE_CONTACT.phone,
    contactType: 'customer support',
    email: SITE_CONTACT.email,
    areaServed: 'TR',
    availableLanguage: ['Turkish', 'tr'],
    ...extra,
  }
}

export function buildOrganizationSchema(options?: { includeContext?: boolean }): JsonLd {
  const node: JsonLd = {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    legalName: SITE_NAME,
    url: SITE_URL,
    logo: buildImageObject({
      url: LOGO_URL,
      width: 512,
      height: 512,
      caption: `${SITE_NAME} logo`,
    }),
    image: LOGO_URL,
    description: SITE_DESCRIPTION,
    email: SITE_CONTACT.email,
    telephone: SITE_CONTACT.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_CONTACT.addressLocality,
      addressCountry: SITE_CONTACT.addressCountry,
    },
    sameAs: Object.values(SITE_SOCIAL),
    contactPoint: [buildContactPoint()],
    knowsAbout: [
      'CRM',
      'ERP',
      'Muhasebe',
      'E-Fatura',
      'Üretim',
      'Depo',
      'Stok',
      'Finans',
      'İnsan Kaynakları',
      'Saha Satış',
      'Lojistik',
      'Yapay Zeka',
      'WhatsApp CRM',
      'Sosyal Medya',
      'Raporlama',
      'Business Intelligence',
      'Workflow Automation',
      'Digital Transformation',
    ],
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildSearchActionSchema(): JsonLd {
  return {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/help?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  }
}

export function buildWebsiteSchema(options?: {
  includeSearchAction?: boolean
  includeContext?: boolean
}): JsonLd {
  const node: JsonLd = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'tr-TR',
    description: SITE_DESCRIPTION,
    publisher: { '@id': ORG_ID },
  }
  if (options?.includeSearchAction !== false) {
    node.potentialAction = buildSearchActionSchema()
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildSoftwareApplicationSchema(
  input?: Partial<SoftwareAppInput>,
  options?: { includeContext?: boolean },
): JsonLd {
  const plan = referencePricingPlans[0]
  const node: JsonLd = {
    '@type': 'SoftwareApplication',
    '@id': input?.id || SOFTWARE_ID,
    name: input?.name || SITE_NAME,
    description: input?.description || SITE_DESCRIPTION,
    url: input?.url || SITE_URL,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: input?.applicationSubCategory || 'CRM ERP SaaS',
    operatingSystem: 'Web, iOS, Android',
    image: LOGO_URL,
    publisher: { '@id': ORG_ID },
    offers: {
      '@type': 'Offer',
      price: String(plan?.price ?? 2990),
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl('/fiyatlar'),
    },
    featureList: input?.featureList || [
      'CRM',
      'ERP',
      'Stok & Depo',
      'Üretim',
      'Finans & Muhasebe',
      'E-Fatura',
      'Lojistik',
      'İnsan Kaynakları',
      'WhatsApp Mesaj Merkezi',
      'Saha Satış',
      'Yapay Zeka Modülleri',
      'Raporlama & BI',
    ],
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildWebPageSchema(
  input: WebPageInput,
  options?: { includeContext?: boolean },
): JsonLd {
  const node: JsonLd = {
    '@type': input.type || 'WebPage',
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: 'tr-TR',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildProductSchema(
  input?: Partial<ProductOfferInput>,
  options?: { includeContext?: boolean },
): JsonLd {
  const plan = referencePricingPlans[0]
  const node: JsonLd = {
    '@type': 'Product',
    '@id': `${SITE_URL}/fiyatlar#product`,
    name: input?.name || plan?.name || 'BACHMAIN Enterprise Full Paket',
    description: input?.description || plan?.description || SITE_DESCRIPTION,
    brand: { '@type': 'Brand', name: SITE_NAME },
    image: LOGO_URL,
    category: 'Business Software',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: input?.priceCurrency || 'TRY',
      lowPrice: String(input?.lowPrice ?? plan?.price ?? 2990),
      highPrice: String(input?.highPrice ?? plan?.yearlyTotal ?? 28704),
      offerCount: input?.offerCount ?? 2,
      availability: 'https://schema.org/InStock',
      url: input?.url || absoluteUrl('/fiyatlar'),
      seller: { '@id': ORG_ID },
    },
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

/** Standalone Offer node (Rich Results / Product companion). */
export function buildOfferSchema(options?: { includeContext?: boolean }): JsonLd {
  const plan = referencePricingPlans[0]
  const node: JsonLd = {
    '@type': 'Offer',
    '@id': `${SITE_URL}/fiyatlar#offer`,
    name: plan?.name || 'BACHMAIN Enterprise Full Paket',
    price: String(plan?.price ?? 2990),
    priceCurrency: 'TRY',
    availability: 'https://schema.org/InStock',
    url: absoluteUrl('/fiyatlar'),
    seller: { '@id': ORG_ID },
    itemOffered: { '@id': SOFTWARE_ID },
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildBreadcrumbSchema(
  crumbs: BreadcrumbItem[],
  options?: { includeContext?: boolean },
): JsonLd | null {
  if (!crumbs?.length) return null
  const node: JsonLd = {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildFaqSchema(
  items: FaqItem[] = faqItems as FaqItem[],
  options?: { includeContext?: boolean },
): JsonLd {
  const node: JsonLd = {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildArticleSchema(
  input: ArticleInput,
  options?: { includeContext?: boolean },
): JsonLd {
  const node: JsonLd = {
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified || input.datePublished
      ? { dateModified: input.dateModified || input.datePublished }
      : {}),
    author: { '@id': ORG_ID },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: buildImageObject({ url: LOGO_URL, width: 512, height: 512 }),
    },
    image: input.image || LOGO_URL,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(input.path),
    },
    inLanguage: 'tr-TR',
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

export function buildVideoObjectSchema(
  input: VideoObjectInput,
  options?: { includeContext?: boolean },
): JsonLd {
  const node: JsonLd = {
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl,
    uploadDate: input.uploadDate,
    ...(input.contentUrl ? { contentUrl: input.contentUrl } : {}),
    ...(input.embedUrl ? { embedUrl: input.embedUrl } : {}),
    ...(input.duration ? { duration: input.duration } : {}),
    publisher: { '@id': ORG_ID },
  }
  if (options?.includeContext !== false) {
    return { '@context': 'https://schema.org', ...node }
  }
  return node
}

/** Home @graph: Organization + WebSite(+SearchAction) + SoftwareApplication — once. */
export function buildHomeGraphSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema({ includeContext: false }),
      buildWebsiteSchema({ includeContext: false, includeSearchAction: true }),
      buildSoftwareApplicationSchema(undefined, { includeContext: false }),
    ],
  }
}
