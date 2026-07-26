import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { HelpCenterIndexView } from '../../components/geo/HelpCenterViews'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/help-center'
const seo = geoHubSeo(
  PATH,
  'Yardım Merkezi — Modül Kullanım Rehberleri',
  'CRM, ERP, üretim, depo, finans, WhatsApp ve AI asistan kullanım adımları.',
  [{ name: 'Yardım Merkezi', path: PATH }],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <HelpCenterIndexView />
      </Suspense>
    </>
  )
}
