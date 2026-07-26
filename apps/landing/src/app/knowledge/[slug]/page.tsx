import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import KnowledgeGuideView from '../../../components/geo/KnowledgeGuideView'
import { getKnowledgeGuide, listKnowledgeGuides } from '../../../geo/guides/catalog'
import { guideToPageSeo } from '../../../geo/seo'

export function generateStaticParams() {
  return listKnowledgeGuides().map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = getKnowledgeGuide(slug)
  if (!guide) {
    return buildMetadata({
      path: `/knowledge/${slug}`,
      title: 'Rehber',
      description: 'BachMain Knowledge',
    })
  }
  return buildMetadata(guideToPageSeo(guide))
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = getKnowledgeGuide(slug)
  if (!guide) notFound()
  const seo = guideToPageSeo(guide)
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas
        path={seo.path}
        seo={seo}
        article={{
          title: guide.title,
          description: guide.description,
          path: seo.path,
          datePublished: guide.updatedAt,
          dateModified: guide.updatedAt,
        }}
        faqItems={guide.faqs}
      />
      <Suspense fallback={null}>
        <KnowledgeGuideView guide={guide} />
      </Suspense>
    </>
  )
}
