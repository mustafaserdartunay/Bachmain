import type { Metadata } from 'next'
import { buildMetadata } from '../../seo/buildMetadata'
import { SEO_CONTENT } from '../../seo/contentCatalog'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import StudioPage from '../../views/StudioPage'

const seo = SEO_CONTENT['/studio']

export const metadata: Metadata = {
  ...buildMetadata(seo),
  icons: {
    icon: [{ url: '/assets/logo-icon.svg', type: 'image/svg+xml' }],
    shortcut: '/assets/logo-icon.svg',
    apple: '/assets/logo-icon.svg',
  },
}

export default function Page() {
  return (
    <>
      <RouteSchemas path="/studio" seo={seo} />
      <StudioPage />
    </>
  )
}
