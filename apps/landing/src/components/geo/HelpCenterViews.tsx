'use client'

import { Link } from 'react-router-dom'
import { HELP_ARTICLES } from '../../geo/helpCenter'
import RelatedTopics from './RelatedTopics'

export function HelpCenterIndexView() {
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Help Center</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Yardım Merkezi</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          Modül modül kullanım adımları. Knowledge Base kavramları anlatır; burası uygulamayı
          gösterir.
        </p>
      </header>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {HELP_ARTICLES.map((a) => (
            <Link key={a.slug} to={`/help-center/${a.slug}`} className="saas-card block p-6">
              <span className="text-xs font-bold uppercase text-blue-600">{a.module}</span>
              <h2 className="mt-2 font-bold text-slate-900">{a.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{a.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Knowledge', path: '/knowledge' },
          { label: 'SSS', path: '/sss' },
          { label: 'Akademi', path: '/akademi' },
          { label: 'API', path: '/docs/api' },
          { label: 'Klasik yardım', path: '/help' },
        ]}
      />
    </div>
  )
}

export function HelpArticleView({ slug }: { slug: string }) {
  const article = HELP_ARTICLES.find((a) => a.slug === slug) || HELP_ARTICLES[0]
  return (
    <div className="page-mesh">
      <header className="page-hero">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <span className="pill">{article.module}</span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-slate-500">{article.description}</p>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-12 lg:px-8">
        <ol className="space-y-5">
          {article.steps.map((step, i) => (
            <li key={step.title} className="saas-card p-5">
              <h2 className="font-bold text-slate-900">
                {i + 1}. {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </article>
      <RelatedTopics items={article.relatedPaths} />
    </div>
  )
}
