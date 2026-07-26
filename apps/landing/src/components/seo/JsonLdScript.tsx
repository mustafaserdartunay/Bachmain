import type { JsonLd } from '../../seo/jsonld'

/** Server-safe JSON-LD script injector for Rich Results. */
export default function JsonLdScript({
  data,
  id,
}: {
  data: JsonLd | JsonLd[] | null
  id?: string
}) {
  if (!data) return null
  const payload = Array.isArray(data) ? data : [data]
  const filtered = payload.filter(Boolean)
  if (!filtered.length) return null

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(filtered.length === 1 ? filtered[0] : filtered),
      }}
    />
  )
}
