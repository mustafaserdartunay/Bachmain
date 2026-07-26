import JsonLdScript from '../JsonLdScript'
import { buildBreadcrumbSchema } from '../../../seo/schema/builders'
import type { BreadcrumbItem } from '../../../seo/schema/types'

export default function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const data = buildBreadcrumbSchema(items)
  if (!data) return null
  return <JsonLdScript id="schema-breadcrumb" data={data} />
}
