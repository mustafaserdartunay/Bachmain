/**
 * Compatibility layer — prefer components/seo/schema + seo/schema/builders.
 * Kept so older imports continue to work without duplicate schema logic.
 */
import type { PageSeo } from './buildMetadata'
import { absoluteUrl } from './site'
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildHomeGraphSchema,
  buildOrganizationSchema,
  buildProductSchema,
  buildSoftwareApplicationSchema,
  buildWebPageSchema,
  buildWebsiteSchema,
  type FaqItem,
  type JsonLd,
} from './schema/builders'

export type { JsonLd }

export function organizationSchema(): JsonLd {
  return buildOrganizationSchema()
}

export function websiteSearchActionSchema(): JsonLd {
  return buildWebsiteSchema({ includeSearchAction: true })
}

export function softwareApplicationSchema(): JsonLd {
  return buildSoftwareApplicationSchema()
}

export function webPageSchema(page: PageSeo): JsonLd {
  const type = page.schemaType || 'WebPage'
  const url = absoluteUrl(page.path)
  const description = page.aiSearchDescription || page.description
  const name = page.h1 || page.title

  if (type === 'SoftwareApplication') {
    return buildSoftwareApplicationSchema({
      id: `${url}#software`,
      name,
      description,
      url,
      applicationSubCategory: page.focusKeyword,
    })
  }

  if (type === 'ContactPage') {
    return buildWebPageSchema({ name, description, url, type: 'ContactPage' })
  }

  return buildWebPageSchema({ name, description, url })
}

export function productSchema(): JsonLd {
  return buildProductSchema()
}

export function faqSchema(items?: FaqItem[]): JsonLd {
  return buildFaqSchema(items)
}

export function breadcrumbSchema(crumbs: Array<{ name: string; path: string }>): JsonLd | null {
  return buildBreadcrumbSchema(crumbs)
}

export function articleSchema(input: {
  title: string
  description: string
  path: string
  datePublished?: string
  dateModified?: string
}): JsonLd {
  return buildArticleSchema(input)
}

/** @deprecated Use HomeGraphSchema / buildHomeGraphSchema — avoids sitewide SoftApp duplication. */
export function globalGraphSchema(): JsonLd {
  return buildHomeGraphSchema()
}
