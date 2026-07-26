import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildMetadata } from '../../../seo/buildMetadata'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import { HelpArticleView } from '../../../components/geo/HelpCenterViews'
import { HELP_ARTICLES, getHelpArticle } from '../../../geo/helpCenter'
import { geoHubSeo } from '../../../geo/seo'

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getHelpArticle(slug)
  if (!article) {
    return buildMetadata({
      path: `/help-center/${slug}`,
      title: 'Yardım',
      description: 'BachMain Yardım',
    })
  }
  return buildMetadata(
    geoHubSeo(`/help-center/${article.slug}`, article.title, article.description, [
      { name: 'Yardım Merkezi', path: '/help-center' },
      { name: article.module, path: `/help-center/${article.slug}` },
    ]),
  )
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getHelpArticle(slug)
  if (!article) notFound()
  const seo = geoHubSeo(`/help-center/${article.slug}`, article.title, article.description, [
    { name: 'Yardım Merkezi', path: '/help-center' },
    { name: article.module, path: `/help-center/${article.slug}` },
  ])
  return (
    <>
      <Breadcrumbs items={seo.breadcrumbs!} />
      <RouteSchemas path={seo.path} seo={seo} />
      <Suspense fallback={null}>
        <HelpArticleView slug={slug} />
      </Suspense>
    </>
  )
}
