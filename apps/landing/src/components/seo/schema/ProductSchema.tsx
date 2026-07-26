import JsonLdScript from '../JsonLdScript'
import { buildOfferSchema, buildProductSchema } from '../../../seo/schema/builders'
import type { ProductOfferInput } from '../../../seo/schema/types'

export default function ProductSchema(props?: Partial<ProductOfferInput>) {
  return <JsonLdScript id="schema-product" data={[buildProductSchema(props), buildOfferSchema()]} />
}
