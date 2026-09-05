import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { SEO_CONTENT } from '../../seo/contentCatalog'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import { DemoPage as PageView } from '../../views/AuthPages'

const PATH = '/demo'
const seo = SEO_CONTENT[PATH]

export const metadata: Metadata = buildMetadata(seo)
export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams
  const isStudio =
    String(sp.next || '')
      .trim()
      .toLowerCase() === 'studio'

  return (
    <>
      {seo.breadcrumbs && !isStudio ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <PageView isStudio={isStudio} />
      </Suspense>
    </>
  )
}
