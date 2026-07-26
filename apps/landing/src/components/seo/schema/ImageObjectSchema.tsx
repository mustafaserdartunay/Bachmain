import JsonLdScript from '../JsonLdScript'
import { buildImageObject } from '../../../seo/schema/builders'
import type { ImageObjectInput } from '../../../seo/schema/types'
import { SITE_URL } from '../../../seo/site'

const DEFAULT: ImageObjectInput = {
  url: `${SITE_URL}/assets/bachmain-logo.png`,
  width: 512,
  height: 512,
  caption: 'BACHMAIN logo',
}

export default function ImageObjectSchema(props?: Partial<ImageObjectInput>) {
  return (
    <JsonLdScript
      id="schema-imageobject"
      data={{ '@context': 'https://schema.org', ...buildImageObject({ ...DEFAULT, ...props }) }}
    />
  )
}
