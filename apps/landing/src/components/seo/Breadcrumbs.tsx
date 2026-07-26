import BreadcrumbSchema from './schema/BreadcrumbSchema'

type Crumb = { name: string; path: string }

type BreadcrumbsProps = {
  items: Crumb[]
  /** Kept for call-site compatibility; visual nav is disabled site-wide. */
  className?: string
}

/**
 * Emits schema.org BreadcrumbList only (no visible crumb trail).
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items?.length) return null
  return <BreadcrumbSchema items={items} />
}
