import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import PageView from '../../views/LoginPage'

const PATH = '/login'
const seo = PAGE_SEO[PATH]

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <RouteSchemas path="/giris" seo={seo} />
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}
