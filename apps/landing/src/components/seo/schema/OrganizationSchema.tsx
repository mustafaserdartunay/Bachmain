import JsonLdScript from '../JsonLdScript'
import { buildOrganizationSchema } from '../../../seo/schema/builders'

export default function OrganizationSchema() {
  return <JsonLdScript id="schema-organization" data={buildOrganizationSchema()} />
}
