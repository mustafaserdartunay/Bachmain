import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import { SectorDetailView } from '../../../components/sales/SalesHubViews'
import { SECTOR_PAGES, getSector } from '../../../sales/sectors'
import { geoHubSeo } from '../../../geo/seo'

export function generateStaticParams() {
  return SECTOR_PAGES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const sector = getSector(slug)
  if (!sector)
    return buildMetadata({ path: `/sektorler/${slug}`, title: 'Sektör', description: 'BachMain' })
  return buildMetadata(
    geoHubSeo(`/sektorler/${slug}`, sector.h1, sector.description, [
      { name: 'Sektörler', path: '/sektorler' },
      { name: sector.name, path: `/sektorler/${slug}` },
    ]),
  )
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const sector = getSector(slug)
  if (!sector) notFound()
  const seo = geoHubSeo(`/sektorler/${slug}`, sector.h1, sector.description, [
    { name: 'Sektörler', path: '/sektorler' },
    { name: sector.name, path: `/sektorler/${slug}` },
  ])
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={seo.path} seo={seo} />
      <Suspense fallback={null}>
        <SectorDetailView slug={slug} />
      </Suspense>
    </>
  )
}
