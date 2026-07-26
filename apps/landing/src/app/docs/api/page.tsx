import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import { DocPageView } from '../../../components/geo/GeoHubViews'
import { API_DOC } from '../../../geo/helpCenter'
import { geoHubSeo } from '../../../geo/seo'

const PATH = '/docs/api'
const seo = geoHubSeo(PATH, 'API Dokümantasyonu', API_DOC.description, [
  { name: 'Docs', path: '/docs' },
  { name: 'API', path: PATH },
])

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <DocPageView doc={API_DOC} />
      </Suspense>
    </>
  )
}
