import type { Metadata } from 'next'
import { buildMetadata } from '../../seo/buildMetadata'
import { SEO_CONTENT } from '../../seo/contentCatalog'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import HomePage from '../../views/HomePage'

const seo = SEO_CONTENT['/Business']

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <RouteSchemas path="/Business" seo={seo} />
      <HomePage />
    </>
  )
}
