import JsonLdScript from '../JsonLdScript'
import { buildSoftwareApplicationSchema } from '../../../seo/schema/builders'
import type { SoftwareAppInput } from '../../../seo/schema/types'

export default function SoftwareApplicationSchema(props?: Partial<SoftwareAppInput>) {
  return (
    <JsonLdScript
      id={props?.id ? `schema-software-${props.id}` : 'schema-software'}
      data={buildSoftwareApplicationSchema(props)}
    />
  )
}
