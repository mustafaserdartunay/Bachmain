import type { Metadata } from 'next'
import { buildMetadata } from '../seo/buildMetadata'
import { SEO_CONTENT } from '../seo/contentCatalog'
import RouteSchemas from '../components/seo/schema/RouteSchemas'
import GatewayPage from '../views/GatewayPage'

const seo = SEO_CONTENT['/']

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <RouteSchemas path="/" seo={seo} />
      <GatewayPage />
    </>
  )
}
