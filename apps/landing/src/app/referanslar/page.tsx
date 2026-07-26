import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { ReferencesView } from '../../components/sales/SalesHubViews'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/referanslar'
const seo = geoHubSeo(
  PATH,
  'Referanslar — BachMain',
  'Kurumsal referanslar ve müşteri alıntıları.',
  [{ name: 'Referanslar', path: PATH }],
)
export const metadata: Metadata = buildMetadata(seo)
export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <ReferencesView />
      </Suspense>
    </>
  )
}
