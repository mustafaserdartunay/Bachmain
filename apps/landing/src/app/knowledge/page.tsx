import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { KnowledgeIndexView } from '../../components/geo/KnowledgeIndexView'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/knowledge'
const seo = geoHubSeo(
  PATH,
  'Knowledge Base — CRM, ERP, Muhasebe ve Operasyon Rehberleri',
  'BachMain Knowledge Base: CRM nedir, ERP nedir, depo, stok, e-fatura, WhatsApp CRM ve yapay zekâ rehberleri. Öğretici, semantik içerik.',
  [{ name: 'Knowledge Base', path: PATH }],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <KnowledgeIndexView />
      </Suspense>
    </>
  )
}
