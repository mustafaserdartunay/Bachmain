import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import { PAGE_SEO } from '../../../seo/pages'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RelatedModules from '../../../components/seo/RelatedModules'
import { ErpPage as PageView } from '../../../views/FeaturePages'

const seo = PAGE_SEO['/features/erp']

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      {seo.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path={seo.path} seo={seo} />

      <Suspense fallback={null}>
        <PageView />
      </Suspense>
      <RelatedModules moduleKey="erp" />
    </>
  )
}
