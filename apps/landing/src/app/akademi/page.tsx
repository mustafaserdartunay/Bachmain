import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { AcademyView } from '../../components/geo/GeoHubViews'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/akademi'
const seo = geoHubSeo(
  PATH,
  'BachMain Akademi — Eğitim İçerikleri',
  'Kurulum, CRM, stok, üretim, finans ve yapay zekâ eğitimleri.',
  [{ name: 'Akademi', path: PATH }],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <AcademyView />
      </Suspense>
    </>
  )
}
