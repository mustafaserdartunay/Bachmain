import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import { BlogTopicsView } from '../../../components/geo/GeoHubViews'
import { geoHubSeo } from '../../../geo/seo'

const PATH = '/blog/konular'
const seo = geoHubSeo(
  PATH,
  'Blog Konu Planı — 100+ GEO İçerik Başlığı',
  'BachMain blog editorial backlog: title, slug, focus keyword, meta description ve outline.',
  [
    { name: 'Blog', path: '/blog' },
    { name: 'Konular', path: PATH },
  ],
)

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={PATH} seo={seo} />
      <Suspense fallback={null}>
        <BlogTopicsView />
      </Suspense>
    </>
  )
}
