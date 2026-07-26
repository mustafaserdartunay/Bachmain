import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { GlossaryView } from '../../components/geo/GeoHubViews'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/sozluk'
const seo = geoHubSeo(
  PATH,
  'BachMain Sözlük — Cari, MRP, SKU, API',
  'İşletme yazılımı terimleri: cari, tahsilat, MRP, pipeline, webhook.',
  [{ name: 'Sözlük', path: PATH }],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <GlossaryView />
      </Suspense>
    </>
  )
}
