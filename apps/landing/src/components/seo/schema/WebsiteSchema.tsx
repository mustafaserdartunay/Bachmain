import JsonLdScript from '../JsonLdScript'
import { buildWebsiteSchema } from '../../../seo/schema/builders'

export default function WebsiteSchema({
  includeSearchAction = true,
}: {
  includeSearchAction?: boolean
}) {
  return <JsonLdScript id="schema-website" data={buildWebsiteSchema({ includeSearchAction })} />
}
