import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { SEO_CONTENT } from '../../seo/contentCatalog'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import SalesLandingView from '../../components/sales/SalesLandingView'
import { getModuleLanding } from '../../sales/moduleLandings'

const PATH = '/finans'
const seo = SEO_CONTENT[PATH]
const landing = getModuleLanding(PATH)!

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      {seo.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path={PATH} seo={seo} faqItems={landing.faqs} />
      <Suspense fallback={null}>
        <SalesLandingView landing={landing} />
      </Suspense>
    </>
  )
}
