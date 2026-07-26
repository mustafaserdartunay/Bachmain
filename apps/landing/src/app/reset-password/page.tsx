import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import PageView from '../../views/ResetPasswordPage'

const seo = PAGE_SEO['/sifre-sifirla']

export const metadata: Metadata = buildMetadata({
  ...seo,
  path: '/reset-password',
  title: 'Reset Password | BACHMAIN',
})

export default function Page() {
  return (
    <>
      <RouteSchemas path="/sifre-sifirla" seo={seo} />
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}
