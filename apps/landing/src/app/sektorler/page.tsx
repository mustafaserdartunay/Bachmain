import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { SectorsIndexView } from '../../components/sales/SalesHubViews'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/sektorler'
const seo = geoHubSeo(
  PATH,
  'Sektörel Çözümler — BachMain',
  'Mobilya, tekstil, gıda, e-ticaret ve üretim sektörlerine özel BachMain çözümleri.',
  [{ name: 'Sektörler', path: PATH }],
)
export const metadata: Metadata = buildMetadata(seo)
export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <SectorsIndexView />
      </Suspense>
    </>
  )
}
