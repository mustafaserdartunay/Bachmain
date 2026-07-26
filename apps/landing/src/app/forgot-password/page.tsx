import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import PageView from '../../views/ForgotPasswordPage'

const seo = PAGE_SEO['/sifremi-unuttum']

export const metadata: Metadata = buildMetadata({
  ...seo,
  path: '/forgot-password',
  title: 'Forgot Password | BACHMAIN',
})

export default function Page() {
  return (
    <>
      <RouteSchemas path="/sifremi-unuttum" seo={seo} />
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}
