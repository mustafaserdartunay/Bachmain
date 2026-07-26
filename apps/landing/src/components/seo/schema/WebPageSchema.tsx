import JsonLdScript from '../JsonLdScript'
import { buildWebPageSchema } from '../../../seo/schema/builders'
import type { WebPageInput } from '../../../seo/schema/types'

export default function WebPageSchema(props: WebPageInput) {
  return <JsonLdScript id="schema-webpage" data={buildWebPageSchema(props)} />
}
