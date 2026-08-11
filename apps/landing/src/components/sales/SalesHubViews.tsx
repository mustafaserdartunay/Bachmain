'use client'

import { Link } from 'react-router-dom'
import { SECTOR_PAGES } from '../../sales/sectors'
import { CASE_STUDIES, REFERENCES, getCaseStudy } from '../../sales/caseStudies'
import { trackCta } from '../../analytics/track'
import RelatedTopics from '../geo/RelatedTopics'

export function SectorsIndexView() {
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Sektörel çözümler</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Sektörünüze özel BachMain</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          Mobilyadan medikale, e-ticaretten üretime — operasyon omurgası aynı, dil sektöre özel.
        </p>
      </header>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {SECTOR_PAGES.map((s) => (
            <Link key={s.slug} to={`/sektorler/${s.slug}`} className="saas-card block p-6">
              <h2 className="font-bold text-slate-900">{s.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{s.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Başarı hikayeleri', path: '/basari-hikayeleri' },
          { label: 'Demo', path: '/demo' },
          { label: 'CRM', path: '/crm' },
        ]}
      />
    </div>
  )
}

export function SectorDetailView({ slug }: { slug: string }) {
  const sector = SECTOR_PAGES.find((s) => s.slug === slug) || SECTOR_PAGES[0]
  return (
    <div className="page-mesh">
      <header className="page-hero">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <span className="pill">{sector.name}</span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">{sector.h1}</h1>
          <p className="mt-4 text-slate-500">{sector.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="btn-primary"
              onClick={() => trackCta('cta_demo', { source: `sector_${slug}` })}
            >
              Hemen Demo Talep Et
            </Link>
            <Link
              to="/uye-ol"
              className="btn-secondary"
              onClick={() => trackCta('cta_trial', { source: `sector_${slug}` })}
            >
              Ücretsiz Dene
            </Link>
          </div>
        </div>
      </header>
      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Sektörel zorluklar</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {sector.challenges.map((c) => (
              <li key={c} className="saas-card p-5 text-sm font-semibold text-slate-700">
                {c}
              </li>
            ))}
          </ul>
          <h2 className="section-title mt-14">BachMain nasıl çözüm sunar?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {sector.solutions.map((s) => (
              <div key={s.title} className="saas-card p-6">
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
          <h2 className="section-title mt-14">İlgili modüller</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {sector.modules.map((m) => (
              <Link
                key={m.path}
                to={m.path}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
              >
                {m.label}
              </Link>
            ))}
          </div>
          <h2 className="section-title mt-14">Beklenen kazanımlar</h2>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-600">
            {sector.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Tüm sektörler', path: '/sektorler' },
          { label: 'Başarı hikayeleri', path: '/basari-hikayeleri' },
          { label: 'Fiyatlar', path: '/fiyatlar' },
        ]}
      />
    </div>
  )
}

export function CaseStudiesIndexView() {
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Case Studies</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Başarı hikayeleri</h1>
        <p className="mt-3 text-slate-500">
          Sorun → Çözüm → Sonuç · ROI ve operasyonel verimlilik metrikleri
        </p>
      </header>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3 lg:px-8">
          {CASE_STUDIES.map((c) => (
            <Link key={c.slug} to={`/basari-hikayeleri/${c.slug}`} className="saas-card block p-6">
              <span className="text-xs font-bold uppercase text-blue-600">{c.sector}</span>
              <h2 className="mt-2 font-bold text-slate-900">{c.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{c.company}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export function CaseStudyDetailView({ slug }: { slug: string }) {
  const study = getCaseStudy(slug) || CASE_STUDIES[0]
  return (
    <div className="page-mesh">
      <header className="page-hero">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <span className="pill">{study.sector}</span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">{study.title}</h1>
          <p className="mt-3 text-slate-500">{study.company}</p>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-12 lg:px-8">
        <section className="mb-10">
          <h2 className="section-title !text-2xl">Sorun</h2>
          <p className="mt-4 text-slate-600">{study.problem}</p>
        </section>
        <section className="mb-10">
          <h2 className="section-title !text-2xl">Çözüm</h2>
          <p className="mt-4 text-slate-600">{study.solution}</p>
        </section>
        <section className="mb-10">
          <h2 className="section-title !text-2xl">Sonuç</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
            {study.results.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
        <section className="mb-10">
          <h2 className="section-title !text-2xl">Kazanımlar / ROI</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {study.metrics.map((m) => (
              <div key={m.label} className="saas-card p-5 text-center">
                <p className="text-2xl font-extrabold text-blue-700">{m.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>
        </section>
        <Link
          to="/demo"
          className="btn-primary"
          onClick={() => trackCta('cta_demo', { source: `case_${slug}` })}
        >
          Benzer sonuç için demo alın →
        </Link>
      </article>
      <RelatedTopics
        items={study.relatedModules
          .map((p) => ({ label: p, path: p }))
          .concat([{ label: 'Tüm hikayeler', path: '/basari-hikayeleri' }])}
      />
    </div>
  )
}

export function ReferencesView() {
  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">Referanslar</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Kurumsal referanslar</h1>
        <p className="mt-3 text-slate-500">
          Örnek kurumsal yapı — sektör kartları ve kısa alıntılar
        </p>
      </header>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {REFERENCES.map((r) => (
            <article key={r.name} className="saas-card p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-sm font-extrabold text-blue-700">
                {r.name.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="mt-4 font-bold text-slate-900">{r.name}</h2>
              <p className="text-xs font-semibold uppercase text-slate-400">{r.sector}</p>
              {r.quote ? <p className="mt-3 text-sm text-slate-500">“{r.quote}”</p> : null}
            </article>
          ))}
        </div>
      </section>
      <RelatedTopics
        items={[
          { label: 'Başarı hikayeleri', path: '/basari-hikayeleri' },
          { label: 'Demo', path: '/demo' },
          { label: 'Yorumlar', path: '/#referanslar' },
        ]}
      />
    </div>
  )
}
