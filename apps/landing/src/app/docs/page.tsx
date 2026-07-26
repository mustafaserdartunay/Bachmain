import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { DocsIndexView } from '../../components/geo/GeoHubViews'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/docs'
const seo = geoHubSeo(
  PATH,
  'Dokümantasyon — API ve Geliştirici',
  'BachMain API ve geliştirici dokümantasyonuna giriş.',
  [{ name: 'Docs', path: PATH }],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <DocsIndexView />
      </Suspense>
    </>
  )
}
