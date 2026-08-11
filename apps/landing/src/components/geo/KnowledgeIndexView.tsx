'use client'

import { Link } from 'react-router-dom'
import { listKnowledgeGuides } from '../../geo/guides/catalog'
import RelatedTopics from './RelatedTopics'

export function KnowledgeIndexView() {
  const guides = listKnowledgeGuides()
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">BachMain Knowledge Base</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Bilgi Merkezi
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500">
          CRM, ERP, muhasebe, üretim, depo, e-fatura ve yapay zekâ kavramlarını öğretici dille
          anlatan rehberler. Satış vaadi değil; net tanımlar, farklar ve iyi uygulamalar.
        </p>
      </header>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {guides.map((g) => (
            <Link
              key={g.slug}
              to={`/knowledge/${g.slug}`}
              className="saas-card block p-6 transition hover:border-blue-200"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                {g.category}
              </span>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{g.category} rehberi</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-500">{g.description}</p>
              <p className="mt-4 text-xs font-semibold text-slate-400">~{g.readingMinutes} dk</p>
            </Link>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Yardım Merkezi', path: '/help-center' },
          { label: 'SSS', path: '/sss' },
          { label: 'Akademi', path: '/akademi' },
          { label: 'Sözlük', path: '/sozluk' },
          { label: 'Blog konuları', path: '/blog/konular' },
          { label: 'API Docs', path: '/docs/api' },
        ]}
      />
    </div>
  )
}
