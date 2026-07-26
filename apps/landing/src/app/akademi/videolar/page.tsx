import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import { AcademyVideosView } from '../../../components/geo/GeoHubViews'
import { geoHubSeo } from '../../../geo/seo'

const PATH = '/akademi/videolar'
const seo = geoHubSeo(
  PATH,
  'Video Eğitim — BachMain Akademi',
  'CRM, ERP, depo, üretim, WhatsApp ve AI video eğitim müfredatı.',
  [
    { name: 'Akademi', path: '/akademi' },
    { name: 'Videolar', path: PATH },
  ],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <AcademyVideosView />
      </Suspense>
    </>
  )
}
