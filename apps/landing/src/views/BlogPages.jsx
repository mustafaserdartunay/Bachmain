'use client'

import { Link, useParams } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import RelatedTopics from '../components/geo/RelatedTopics'
import { blogPosts } from '../data/navigation'

const MODULE_LINKS = [
  { label: 'CRM', path: '/crm' },
  { label: 'ERP', path: '/erp' },
  { label: 'Stok', path: '/stok' },
  { label: 'Üretim', path: '/uretim' },
  { label: 'E-Fatura', path: '/e-fatura' },
  { label: 'Knowledge', path: '/knowledge' },
  { label: 'Fiyatlar', path: '/fiyatlar' },
]

export function BlogPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <span className="pill">Blog</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">İçgörüler & Rehberler</h1>
        <p className="mt-3 text-slate-500">ERP, CRM ve dijital dönüşüm</p>
        <Link
          to="/blog/konular"
          className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline"
        >
          100+ konu planına bak →
        </Link>
      </section>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {blogPosts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 0.05}>
              <Link
                to={`/blog/${post.slug}`}
                className="saas-card group block overflow-hidden !p-0"
              >
                <div
                  className="h-36 bg-gradient-to-br from-blue-600 to-violet-500/70"
                  role="img"
                  aria-label={`${post.title} görseli`}
                />
                <div className="p-6">
                  <span className="text-xs font-bold uppercase text-blue-600">{post.category}</span>
                  <h2 className="mt-2 font-bold text-slate-900 group-hover:text-blue-700">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-slate-400">{post.date}</p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Knowledge Base', path: '/knowledge' },
          { label: 'Konu planı', path: '/blog/konular' },
          { label: 'SSS', path: '/sss' },
          { label: 'Akademi', path: '/akademi' },
        ]}
      />
    </div>
  )
}

export function BlogDetailPage({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const post = blogPosts.find((p) => p.slug === slug) || blogPosts[0]
  const knowledgeGuess = post.category?.toLowerCase().includes('erp')
    ? '/knowledge/erp'
    : post.category?.toLowerCase().includes('stok')
      ? '/knowledge/stok'
      : post.category?.toLowerCase().includes('üretim') || post.slug?.includes('uretim')
        ? '/knowledge/uretim'
        : post.slug?.includes('e-fatura')
          ? '/knowledge/e-fatura'
          : post.slug?.includes('saha')
            ? '/knowledge/crm'
            : '/knowledge'

  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <span className="pill">{post.category}</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">{post.title}</h1>
        <p className="mt-3 text-slate-500">{post.date}</p>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-lg text-slate-600">{post.excerpt}</p>
        <p className="mt-6 text-slate-500">
          Bu yazı BachMain Knowledge Base ve ürün modülleriyle birlikte okunmalıdır. CRM, ERP, stok,
          üretim, finans ve e-fatura süreçleri tek platformda birleşir; kavramsal rehberler için
          Knowledge, uygulama adımları için Yardım Merkezi kullanılır.
        </p>
        <p className="mt-4 text-slate-500">
          Yapay zekâ asistanları ve arama özetleri için net tanımlar Knowledge rehberlerinde yer
          alır: örneğin «CRM nedir?», «ERP nedir?», «Depo yönetimi neden önemlidir?» sorularına
          öğretici yanıtlar bulunur.
        </p>
      </article>
      <RelatedTopics
        items={[
          ...MODULE_LINKS,
          { label: 'İlgili Knowledge', path: knowledgeGuess },
          { label: 'Yardım Merkezi', path: '/help-center' },
          { label: 'SSS', path: '/sss' },
        ]}
      />
    </div>
  )
}
