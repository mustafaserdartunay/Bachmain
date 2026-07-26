import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { SEO_CONTENT } from '../../seo/contentCatalog'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import PageView from '../../views/PricingPage'

const PATH = '/fiyatlar'
const seo = SEO_CONTENT[PATH]

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      {seo.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}
