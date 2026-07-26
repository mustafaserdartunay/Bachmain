/** Shared JSON-LD / Schema.org TypeScript types */

export type JsonLdPrimitive = string | number | boolean | null
export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[]
export type JsonLdObject = { [key: string]: JsonLdValue }
export type JsonLd = JsonLdObject

export type FaqItem = {
  q: string
  a: string
}

export type BreadcrumbItem = {
  name: string
  path: string
}

export type SoftwareAppInput = {
  name: string
  description: string
  url: string
  applicationSubCategory?: string
  featureList?: string[]
  id?: string
}

export type WebPageInput = {
  name: string
  description: string
  url: string
  type?: 'WebPage' | 'ContactPage' | 'CollectionPage' | 'AboutPage'
}

export type ArticleInput = {
  title: string
  description: string
  path: string
  datePublished?: string
  dateModified?: string
  image?: string
}

export type ProductOfferInput = {
  name: string
  description: string
  lowPrice: number | string
  highPrice: number | string
  priceCurrency?: string
  url: string
  offerCount?: number
}

export type ImageObjectInput = {
  url: string
  width?: number
  height?: number
  caption?: string
  alt?: string
}

export type VideoObjectInput = {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  contentUrl?: string
  embedUrl?: string
  duration?: string
}
