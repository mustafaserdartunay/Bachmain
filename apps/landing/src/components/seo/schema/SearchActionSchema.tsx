import JsonLdScript from '../JsonLdScript'
import { buildSearchActionSchema } from '../../../seo/schema/builders'

/** Standalone SearchAction node (also embedded in WebsiteSchema by default). */
export default function SearchActionSchema() {
  return (
    <JsonLdScript
      id="schema-searchaction"
      data={{ '@context': 'https://schema.org', ...buildSearchActionSchema() }}
    />
  )
}
