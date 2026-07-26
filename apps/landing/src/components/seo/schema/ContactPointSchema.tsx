import JsonLdScript from '../JsonLdScript'
import { buildContactPoint } from '../../../seo/schema/builders'

export default function ContactPointSchema() {
  return (
    <JsonLdScript
      id="schema-contactpoint"
      data={{ '@context': 'https://schema.org', ...buildContactPoint() }}
    />
  )
}
