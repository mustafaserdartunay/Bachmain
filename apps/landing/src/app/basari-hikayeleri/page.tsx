import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { CaseStudiesIndexView } from '../../components/sales/SalesHubViews'
import { geoHubSeo } from '../../geo/seo'

const PATH = '/basari-hikayeleri'
const seo = geoHubSeo(
  PATH,
  'Başarı Hikayeleri — Case Studies',
  'Sorun, çözüm, sonuç, ROI ve operasyonel verimlilik metrikleri.',
  [{ name: 'Başarı Hikayeleri', path: PATH }],
)
export const metadata: Metadata = buildMetadata(seo)
export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <CaseStudiesIndexView />
      </Suspense>
    </>
  )
}
