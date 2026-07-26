'use client'

import { Link } from 'react-router-dom'
import { ACADEMY_LESSONS, API_DOC, DEVELOPER_DOC } from '../../geo/helpCenter'
import { GLOSSARY } from '../../geo/glossary'
import { listBlogTopicPlans } from '../../geo/blogTopics'
import type { DocPage } from '../../geo/types'
import RelatedTopics from './RelatedTopics'

export function AcademyView() {
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">BachMain Akademi</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Eğitim içerikleri</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          Kısa dersler ve rehber bağlantıları. Video listesi için video eğitim sayfasına gidin.
        </p>
        <Link to="/akademi/videolar" className="btn-primary mt-8 inline-flex">
          Video eğitimler →
        </Link>
      </header>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {ACADEMY_LESSONS.map((lesson) => (
            <Link key={lesson.id} to={lesson.href} className="saas-card block p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-blue-600">{lesson.module}</span>
                <span className="text-xs text-slate-400">{lesson.duration}</span>
              </div>
              <h2 className="mt-2 font-bold text-slate-900">{lesson.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{lesson.summary}</p>
              <p className="mt-3 text-xs font-semibold text-slate-400">{lesson.level}</p>
            </Link>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Videolar', path: '/akademi/videolar' },
          { label: 'Knowledge', path: '/knowledge' },
          { label: 'Yardım', path: '/help-center' },
        ]}
      />
    </div>
  )
}

export function AcademyVideosView() {
  const videos = ACADEMY_LESSONS.map((l) => ({
    ...l,
    note: 'Video yakında / şimdilik yazılı rehbere yönlendirir.',
  }))
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Video Eğitim</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Video eğitim sayfası</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          Eğitim videoları Akademi müfredatıyla hizalanır. Yayınlanana kadar ilgili Knowledge / Help
          içeriklerine bağlanır.
        </p>
      </header>
      <section className="section-pad">
        <div className="mx-auto max-w-3xl space-y-4 px-4 lg:px-8">
          {videos.map((v) => (
            <article key={v.id} className="saas-card p-5">
              <h2 className="font-bold text-slate-900">{v.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {v.module} · {v.duration} · {v.level}
              </p>
              <p className="mt-2 text-xs text-slate-400">{v.note}</p>
              <Link
                to={v.href}
                className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
              >
                İlgili içeriğe git →
              </Link>
            </article>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Akademi', path: '/akademi' },
          { label: 'Eğitimler', path: '/egitim' },
        ]}
      />
    </div>
  )
}

export function GlossaryView() {
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Sözlük</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">BachMain mini sözlük</h1>
        <p className="mt-3 text-slate-500">Cari, MRP, SKU, Pipeline, Webhook ve daha fazlası.</p>
      </header>
      <section className="section-pad">
        <dl className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {GLOSSARY.map((t) => (
            <div key={t.slug} className="saas-card p-5">
              <dt className="text-lg font-bold text-slate-900">{t.term}</dt>
              <dd className="mt-2 text-sm text-slate-500">{t.definition}</dd>
              {t.relatedGuide ? (
                <Link
                  to={`/knowledge/${t.relatedGuide}`}
                  className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline"
                >
                  İlgili rehber →
                </Link>
              ) : null}
            </div>
          ))}
        </dl>
      </section>
      <RelatedTopics
        items={[
          { label: 'Knowledge', path: '/knowledge' },
          { label: 'Docs', path: '/docs' },
        ]}
      />
    </div>
  )
}

export function DocsIndexView() {
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Docs</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Dokümantasyon</h1>
        <p className="mt-3 text-slate-500">API ve geliştirici dokümanları.</p>
      </header>
      <section className="section-pad">
        <div className="mx-auto grid max-w-3xl gap-4 px-4 sm:grid-cols-2">
          <Link to="/docs/api" className="saas-card block p-6">
            <h2 className="font-bold text-slate-900">API Dokümantasyonu</h2>
            <p className="mt-2 text-sm text-slate-500">Auth, kaynaklar, webhook.</p>
          </Link>
          <Link to="/docs/developers" className="saas-card block p-6">
            <h2 className="font-bold text-slate-900">Geliştirici Dokümantasyonu</h2>
            <p className="mt-2 text-sm text-slate-500">Mimari, hata, güvenlik.</p>
          </Link>
        </div>
      </section>
    </div>
  )
}

export function DocPageView({ doc }: { doc: DocPage }) {
  return (
    <div className="page-mesh">
      <header className="page-hero">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <span className="pill">Docs</span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">{doc.title}</h1>
          <p className="mt-4 text-slate-500">{doc.description}</p>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-12 lg:px-8">
        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} className="mb-10">
            <h2 className="section-title !text-2xl">{s.title}</h2>
            {s.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-[15px] leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
            {s.bullets?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 font-mono text-sm text-slate-600">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </article>
      <RelatedTopics
        items={[
          { label: 'Docs ana', path: '/docs' },
          { label: 'API', path: '/docs/api' },
          { label: 'Developers', path: '/docs/developers' },
          { label: 'Knowledge', path: '/knowledge' },
        ]}
      />
    </div>
  )
}

export function BlogTopicsView() {
  const topics = listBlogTopicPlans()
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Editorial backlog</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Blog konu planı</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          {topics.length}+ konu: title, slug, focus keyword, meta description ve outline.
        </p>
      </header>
      <section className="section-pad">
        <div className="mx-auto max-w-4xl space-y-4 px-4 lg:px-8">
          {topics.map((t) => (
            <article key={t.slug} className="saas-card p-5">
              <span className="text-xs font-bold uppercase text-blue-600">{t.category}</span>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{t.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{t.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                Slug: <code>{t.slug}</code> · KW: {t.focusKeyword}
              </p>
              <p className="mt-1 text-xs text-slate-400">Meta: {t.metaDescription}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                {t.outline.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.relatedModules.map((m) => (
                  <Link
                    key={m}
                    to={m}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {m}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Blog', path: '/blog' },
          { label: 'Knowledge', path: '/knowledge' },
        ]}
      />
    </div>
  )
}
