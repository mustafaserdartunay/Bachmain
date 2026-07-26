import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '../seo/pages'
import { absoluteUrl } from '../seo/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return getSitemapEntries().map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
