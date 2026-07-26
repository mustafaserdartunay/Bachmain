import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import FaqCenterView from '../../components/geo/FaqCenterView'
import { FAQ_CENTER } from '../../geo/faqCenter'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/sss'
const seo = geoHubSeo(
  PATH,
  'SSS Merkezi — 100+ Soru',
  'CRM nedir, ERP nedir, e-fatura zorunlu mu, WhatsApp CRM nasıl çalışır? BachMain SSS merkezi.',
  [{ name: 'SSS', path: PATH }],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} faqItems={FAQ_CENTER} />
      <Suspense fallback={null}>
        <FaqCenterView />
      </Suspense>
    </>
  )
}
