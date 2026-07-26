import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata } from '../../../seo/buildMetadata'
import { BLOG_SEO } from '../../../seo/pages'
import Breadcrumbs from '../../../components/seo/Breadcrumbs'
import RouteSchemas from '../../../components/seo/schema/RouteSchemas'
import { BlogDetailPage } from '../../../views/BlogPages'
import { blogPosts } from '../../../data/navigation'

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const seo = BLOG_SEO[slug]
  if (!seo)
    return buildMetadata({ path: `/blog/${slug}`, title: 'Blog', description: 'BACHMAIN Blog' })
  return buildMetadata(seo)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const seo = BLOG_SEO[slug]
  if (!seo && !blogPosts.some((p) => p.slug === slug)) notFound()
  return (
    <>
      {seo?.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      {seo ? (
        <RouteSchemas
          path={seo.path}
          seo={seo}
          article={{
            title: seo.title,
            description: seo.description,
            path: seo.path,
            datePublished: seo.publishedTime,
            dateModified: seo.modifiedTime || seo.publishedTime,
          }}
        />
      ) : null}
      <BlogDetailPage slug={slug} />
    </>
  )
}
