import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { ContactPage as PageView } from '../../views/AuthPages'

const PATH = '/contact'
const seo = PAGE_SEO[PATH]

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      {seo.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path="/iletisim" seo={seo} />
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}
