import JsonLdScript from '../JsonLdScript'
import { buildVideoObjectSchema } from '../../../seo/schema/builders'
import type { VideoObjectInput } from '../../../seo/schema/types'

/**
 * Emit only when a real video exists. Placeholder avoided to keep Rich Results clean.
 */
export default function VideoObjectSchema(props: VideoObjectInput | null) {
  if (!props) return null
  return <JsonLdScript id="schema-videoobject" data={buildVideoObjectSchema(props)} />
}
