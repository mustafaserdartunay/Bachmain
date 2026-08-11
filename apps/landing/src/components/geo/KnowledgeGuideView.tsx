'use client'

import { Link } from 'react-router-dom'
import type { KnowledgeGuide } from '../../geo/types'
import { GLOSSARY } from '../../geo/glossary'
import RelatedTopics from './RelatedTopics'

export default function KnowledgeGuideView({ guide }: { guide: KnowledgeGuide }) {
  const glossary = GLOSSARY.filter(
    (t) => guide.glossaryTerms.includes(t.term) || guide.glossaryTerms.includes(t.slug),
  )
  const related = [
    { label: `${guide.category} ürün sayfası`, path: guide.modulePath },
    ...guide.relatedSlugs.map((slug) => ({
      label: slug.replace(/-/g, ' '),
      path: `/knowledge/${slug}`,
    })),
    { label: 'Yardım Merkezi', path: '/help-center' },
    { label: 'SSS', path: '/sss' },
    { label: 'Akademi', path: '/akademi' },
  ]

  return (
    <div className="page-mesh">
      <header className="page-hero">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <span className="pill">Knowledge Base · {guide.category}</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem]">
            {guide.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-500">{guide.description}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            ~{guide.readingMinutes} dk okuma · Güncellendi {guide.updatedAt}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 pb-8 lg:px-8">
        <nav aria-label="İçindekiler" className="saas-card mb-10 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">İçindekiler</h2>
          <ol className="mt-3 space-y-1.5 text-sm font-semibold text-blue-700">
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#sss" className="hover:underline">
                SSS
              </a>
            </li>
          </ol>
        </nav>

        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-12 scroll-mt-28">
            <h2 className="section-title !text-2xl">{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className="mt-4 text-[15px] leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-slate-600">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {glossary.length ? (
          <section className="mb-12" aria-labelledby="guide-glossary">
            <h2 id="guide-glossary" className="section-title !text-2xl">
              Mini sözlük
            </h2>
            <dl className="mt-6 space-y-4">
              {glossary.map((term) => (
                <div key={term.slug} className="saas-card p-4">
                  <dt className="font-bold text-slate-900">{term.term}</dt>
                  <dd className="mt-1 text-sm text-slate-500">{term.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section id="sss" className="mb-8 scroll-mt-28" aria-labelledby="guide-faq">
          <h2 id="guide-faq" className="section-title !text-2xl">
            Sık sorulan sorular
          </h2>
          <div className="mt-6 space-y-3">
            {guide.faqs.map((item) => (
              <details key={item.q} className="saas-card group p-0">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-slate-800 marker:content-none">
                  {item.q}
                </summary>
                <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-500">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <p className="text-sm text-slate-500">
          Ürün sayfası:{' '}
          <Link to={guide.modulePath} className="font-semibold text-blue-600 hover:underline">
            {guide.modulePath}
          </Link>
        </p>
      </article>

      <RelatedTopics items={related} />
    </div>
  )
}
