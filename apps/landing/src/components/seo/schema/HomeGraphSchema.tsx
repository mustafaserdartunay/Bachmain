import JsonLdScript from '../JsonLdScript'
import { buildHomeGraphSchema } from '../../../seo/schema/builders'

/** Home only: Organization + WebSite(+SearchAction) + SoftwareApplication — single @graph. */
export default function HomeGraphSchema() {
  return <JsonLdScript id="schema-home-graph" data={buildHomeGraphSchema()} />
}
