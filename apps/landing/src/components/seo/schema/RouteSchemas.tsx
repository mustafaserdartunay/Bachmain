import type { PageSeo } from '../../../seo/buildMetadata'
import { absoluteUrl } from '../../../seo/site'
import { getModuleFaqs } from '../../../seo/schema/moduleFaqs'
import type { ArticleInput, FaqItem } from '../../../seo/schema/types'
import OrganizationSchema from './OrganizationSchema'
import ContactPointSchema from './ContactPointSchema'
import WebPageSchema from './WebPageSchema'
import SoftwareApplicationSchema from './SoftwareApplicationSchema'
import ProductSchema from './ProductSchema'
import FAQSchema from './FAQSchema'
import HomeGraphSchema from './HomeGraphSchema'
import ArticleSchema from './ArticleSchema'

/** Paths that emit module SoftApp + FAQPage (visible FAQs in SeoModuleView). */
const FAQ_SOFTWARE_PATHS = new Set(['/crm', '/erp', '/muhasebe', '/e-fatura'])

type RouteSchemasProps = {
  path: string
  seo: PageSeo
  /** Blog / knowledge article payload */
  article?: ArticleInput
  /** Optional FAQPage entities (guide or SSS hub) */
  faqItems?: FaqItem[]
}

/**
 * Per-route JSON-LD — only schemas needed for that URL.
 * BreadcrumbList is emitted by <Breadcrumbs>, not here (avoids duplicates).
 */
export default function RouteSchemas({ path, seo, article, faqItems }: RouteSchemasProps) {
  if (path === '/') {
    return <HomeGraphSchema />
  }

  if (path === '/fiyatlar' || path === '/pricing') {
    return (
      <>
        <ProductSchema />
        <SoftwareApplicationSchema />
      </>
    )
  }

  if (path === '/iletisim' || path === '/contact') {
    return (
      <>
        <OrganizationSchema />
        <ContactPointSchema />
      </>
    )
  }

  if (path === '/faq' || path === '/sss') {
    return faqItems?.length ? <FAQSchema items={faqItems} /> : <FAQSchema />
  }

  if (article) {
    return (
      <>
        <WebPageSchema
          name={seo.h1 || seo.title}
          description={seo.aiSearchDescription || seo.description}
          url={absoluteUrl(path)}
        />
        <ArticleSchema {...article} />
        {faqItems?.length ? <FAQSchema items={faqItems} /> : null}
      </>
    )
  }

  if (
    path === '/giris' ||
    path === '/uye-ol' ||
    path === '/login' ||
    path === '/register' ||
    path === '/demo' ||
    path === '/help'
  ) {
    return (
      <WebPageSchema
        name={seo.h1 || seo.title}
        description={seo.aiSearchDescription || seo.description}
        url={absoluteUrl(path)}
      />
    )
  }

  if (path === '/blog' || path === '/knowledge' || path === '/help-center' || path === '/akademi') {
    return (
      <WebPageSchema
        name={seo.h1 || seo.title}
        description={seo.aiSearchDescription || seo.description}
        url={absoluteUrl(path)}
        type="CollectionPage"
      />
    )
  }

  if (FAQ_SOFTWARE_PATHS.has(path)) {
    const faqs = getModuleFaqs(path)
    return (
      <>
        <SoftwareApplicationSchema
          id={`${absoluteUrl(path)}#software`}
          name={seo.h1 || seo.title}
          description={seo.aiSearchDescription || seo.description}
          url={absoluteUrl(path)}
          applicationSubCategory={seo.focusKeyword}
        />
        {faqs.length ? <FAQSchema items={faqs} /> : null}
      </>
    )
  }

  if (seo.schemaType === 'SoftwareApplication') {
    return (
      <SoftwareApplicationSchema
        id={`${absoluteUrl(path)}#software`}
        name={seo.h1 || seo.title}
        description={seo.aiSearchDescription || seo.description}
        url={absoluteUrl(path)}
        applicationSubCategory={seo.focusKeyword}
      />
    )
  }

  if (seo.schemaType === 'ContactPage') {
    return (
      <WebPageSchema
        name={seo.h1 || seo.title}
        description={seo.aiSearchDescription || seo.description}
        url={absoluteUrl(path)}
        type="ContactPage"
      />
    )
  }

  return (
    <WebPageSchema
      name={seo.h1 || seo.title}
      description={seo.aiSearchDescription || seo.description}
      url={absoluteUrl(path)}
    />
  )
}
