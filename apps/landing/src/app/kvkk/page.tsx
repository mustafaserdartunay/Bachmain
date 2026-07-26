import type { Metadata } from 'next'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import Breadcrumbs from '../../components/seo/Breadcrumbs'
import LegalStaticPage from '../../views/LegalStaticPage'

const seo = PAGE_SEO['/kvkk']
export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <div>
      {seo.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path={seo.path} seo={seo} />
      <LegalStaticPage slug="kvkk" />
    </div>
  )
}
