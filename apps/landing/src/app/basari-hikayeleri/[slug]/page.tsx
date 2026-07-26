import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import { CaseStudyDetailView } from '../../../components/sales/SalesHubViews'
import { CASE_STUDIES, getCaseStudy } from '../../../sales/caseStudies'
import { geoHubSeo } from '../../../geo/seo'

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study)
    return buildMetadata({
      path: `/basari-hikayeleri/${slug}`,
      title: 'Hikaye',
      description: 'BachMain',
    })
  return buildMetadata(
    geoHubSeo(`/basari-hikayeleri/${slug}`, study.title, study.problem, [
      { name: 'Başarı Hikayeleri', path: '/basari-hikayeleri' },
      { name: study.company, path: `/basari-hikayeleri/${slug}` },
    ]),
  )
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()
  const seo = geoHubSeo(`/basari-hikayeleri/${slug}`, study.title, study.problem, [
    { name: 'Başarı Hikayeleri', path: '/basari-hikayeleri' },
    { name: study.company, path: `/basari-hikayeleri/${slug}` },
  ])
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={seo.path} seo={seo} />
      <Suspense fallback={null}>
        <CaseStudyDetailView slug={slug} />
      </Suspense>
    </>
  )
}
