'use client'

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dynamic from 'next/dynamic'
import ScrollReveal from '../ScrollReveal'
import type { PageSeo } from '../../seo/buildMetadata'
import { getAiTopics } from '../../seo/schema/aiTopics'
import { getModuleFaqs } from '../../seo/schema/moduleFaqs'
import RelatedTopics from '../geo/RelatedTopics'

const LiveCrmDashboard = dynamic(() => import('../landing/LiveCrmDashboard'), {
  loading: () => <div className="min-h-[280px]" aria-hidden />,
})

type SeoModuleViewProps = {
  content: PageSeo
  /** Show LiveCrmDashboard on the right of the hero (module pages). */
  showDashboard?: boolean
  ctaTo?: string
  ctaLabel?: string
  badge?: string
}

/**
 * Design-safe SEO landing — reuses FeatureLayout visual language
 * (page-mesh, page-hero, pill, saas-card, section-title, btn-primary).
 */
export default function SeoModuleView({
  content,
  showDashboard = true,
  ctaTo = '/demo',
  ctaLabel = 'Demo Talep Et',
  badge,
}: SeoModuleViewProps) {
  const h1 = content.h1 || content.title
  const intro = content.intro || content.description
  const sections = content.sections || []
  const related = content.relatedPaths || []
  const pill = badge || content.focusKeyword || 'BACHMAIN'
  const aiTopics = useMemo(() => getAiTopics(content.path), [content.path])
  const moduleFaqs = useMemo(() => getModuleFaqs(content.path), [content.path])
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="page-mesh">
      <section className="page-hero">
        <div
          className={`mx-auto grid max-w-7xl items-center gap-12 px-4 lg:px-8 ${
            showDashboard ? 'lg:grid-cols-2' : ''
          }`}
        >
          <ScrollReveal direction="left">
            <span className="pill">{pill}</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">
              {h1}
            </h1>
            <p className="mt-4 text-lg text-slate-500">{intro}</p>
            <Link to={ctaTo} className="btn-primary mt-8">
              {ctaLabel} →
            </Link>
          </ScrollReveal>
          {showDashboard ? (
            <ScrollReveal direction="right" delay={0.1}>
              <LiveCrmDashboard />
            </ScrollReveal>
          ) : null}
        </div>
      </section>

      {sections.map((section, sIdx) => (
        <section key={section.h2} className="section-pad">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <ScrollReveal delay={sIdx * 0.04}>
              <h2 className="section-title">{section.h2}</h2>
              <p className="mt-4 max-w-3xl text-base text-slate-500">{section.body}</p>
            </ScrollReveal>
            {section.h3?.length ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {section.h3.map((card, i) => (
                  <ScrollReveal key={card.title} delay={i * 0.06}>
                    <div className="saas-card p-6">
                      <h3 className="font-bold text-slate-900">{card.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{card.body}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ))}

      {aiTopics.length ? (
        <section
          className="section-pad border-t border-slate-100/80"
          aria-labelledby="seo-ai-topics"
        >
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <h2 id="seo-ai-topics" className="section-title">
              Bilgi merkezi
            </h2>
            <p className="mt-4 max-w-3xl text-base text-slate-500">
              BACHMAIN modüllerini anlamak için kısa rehberler — Tüm Süreçler Tek Platformda.
            </p>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {aiTopics.map((topic, i) => (
                <ScrollReveal key={topic.heading} delay={i * 0.05}>
                  <article className="saas-card p-6">
                    <h3 className="text-lg font-bold text-slate-900">{topic.heading}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{topic.body}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {moduleFaqs.length ? (
        <section className="section-pad" aria-labelledby="seo-module-faq">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <h2 id="seo-module-faq" className="section-title text-center">
              Sık sorulan sorular
            </h2>
            <div className="mt-10 space-y-3">
              {moduleFaqs.map((item, i) => (
                <div key={item.q} className="saas-card overflow-hidden !p-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-slate-800"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{item.q}</span>
                    <span className="text-blue-600" aria-hidden>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i ? (
                    <div className="border-t border-slate-100 px-6 py-4 text-slate-500">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section
          className="section-pad border-t border-slate-100/80"
          aria-labelledby="seo-related-heading"
        >
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <h2
              id="seo-related-heading"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              İlgili sayfalar
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Tüm Süreçler Tek Platformda — ilgili modülleri keşfedin.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {related.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <RelatedTopics
        title="İlgili konular"
        items={[
          { label: 'Knowledge Base', path: '/knowledge' },
          {
            label: 'Bu modül rehberi',
            path: `/knowledge/${content.path.replace(/^\//, '').replace(/\//g, '-')}`,
          },
          { label: 'Yardım Merkezi', path: '/help-center' },
          { label: 'SSS', path: '/sss' },
          { label: 'Akademi', path: '/akademi' },
          { label: 'Sözlük', path: '/sozluk' },
        ]}
      />
    </div>
  )
}
