import JsonLdScript from '../JsonLdScript'
import { buildFaqSchema } from '../../../seo/schema/builders'
import type { FaqItem } from '../../../seo/schema/types'

export default function FAQSchema({ items }: { items?: FaqItem[] }) {
  if (items && items.length === 0) return null
  return <JsonLdScript id="schema-faq" data={buildFaqSchema(items)} />
}
