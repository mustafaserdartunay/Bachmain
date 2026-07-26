import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import PageView from '../../views/ForgotPasswordPage'

const seo = PAGE_SEO['/sifremi-unuttum']

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <RouteSchemas path={seo.path} seo={seo} />
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}
