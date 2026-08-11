import type { KnowledgeGuide } from './types'
import type { PageSeo } from '../seo/buildMetadata'
import { absoluteUrl, SITE_NAME } from '../seo/site'

export function guideToPageSeo(guide: KnowledgeGuide): PageSeo {
  return {
    path: `/knowledge/${guide.slug}`,
    title: guide.title,
    description: guide.description,
    focusKeyword: guide.focusKeyword,
    aiSearchDescription: guide.description,
    h1: guide.title,
    schemaType: 'Article',
    ogType: 'article',
    modifiedTime: guide.updatedAt,
    publishedTime: guide.updatedAt,
    authors: [SITE_NAME],
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Knowledge Base', path: '/knowledge' },
      { name: guide.category, path: `/knowledge/${guide.slug}` },
    ],
    relatedPaths: [
      { label: `${guide.category} ürün`, path: guide.modulePath },
      ...guide.relatedSlugs.slice(0, 3).map((slug) => ({
        label: slug,
        path: `/knowledge/${slug}`,
      })),
    ],
  }
}

export function geoHubSeo(
  path: string,
  title: string,
  description: string,
  crumbs: Array<{ name: string; path: string }>,
): PageSeo {
  return {
    path,
    title,
    description,
    aiSearchDescription: description,
    h1: title,
    schemaType: 'WebPage',
    breadcrumbs: [{ name: 'Ana Sayfa', path: '/' }, ...crumbs],
  }
}

export { absoluteUrl }
