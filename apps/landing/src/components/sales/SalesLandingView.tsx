'use client'

import { Link } from 'react-router-dom'
import type { SalesLanding } from '../../sales/types'
import { testimonials } from '../../data/premiumLanding'
import { trackCta } from '../../analytics/track'
import RelatedTopics from '../geo/RelatedTopics'
import OptimizedImage from '../seo/OptimizedImage'
import { BLUR_PHOTO } from '../../seo/imageBlur'

const CTAS = [
  { label: 'Hemen Demo Talep Et', href: '/demo', variant: 'primary', event: 'cta_demo' },
  { label: 'Ücretsiz Dene', href: '/uye-ol', variant: 'secondary', event: 'cta_trial' },
  { label: 'Teklif Al', href: '/fiyatlar', variant: 'secondary', event: 'cta_quote' },
  { label: 'Uzmanla Görüş', href: '/iletisim', variant: 'gold', event: 'cta_expert' },
] as const

function CtaRow({ source }: { source: string }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {CTAS.map((cta) => (
        <Link
          key={cta.href + cta.label}
          to={cta.href}
          onClick={() => trackCta(cta.event, { source, href: cta.href })}
          className={
            cta.variant === 'primary'
              ? 'btn-primary'
              : cta.variant === 'gold'
                ? 'btn-gold'
                : 'btn-secondary'
          }
        >
          {cta.label}
        </Link>
      ))}
    </div>
  )
}

export default function SalesLandingView({ landing }: { landing: SalesLanding }) {
  const src = `sales_landing_${landing.slug}`
  return (
    <div className="page-mesh">
      {/* HERO */}
      <section className="page-hero" aria-labelledby="sales-hero">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <span className="pill">{landing.eyebrow}</span>
          <h1
            id="sales-hero"
            className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl"
          >
            {landing.h1}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-500">{landing.subhead}</p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Güven unsurları">
            {['Bulut Tabanlı', 'Yapay Zeka Destekli', 'Güvenli Altyapı', '7/24 Destek'].map((t) => (
              <li
                key={t}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                {t}
              </li>
            ))}
          </ul>
          <CtaRow source={src} />
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section-pad border-t border-slate-100/80">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Sorun</h2>
          <p className="mt-2 text-xl font-bold text-slate-800">{landing.problemTitle}</p>
          <p className="mt-4 max-w-3xl text-slate-500">{landing.problemBody}</p>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Çözüm</h2>
          <p className="mt-2 text-xl font-bold text-slate-800">{landing.solutionTitle}</p>
          <p className="mt-4 max-w-3xl text-slate-500">{landing.solutionBody}</p>
          <CtaRow source={`${src}_solution`} />
        </div>
      </section>

      {/* FEATURES */}
      <section className="section-pad border-t border-slate-100/80">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Özellikler</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {landing.features.map((f) => (
              <div key={f.title} className="saas-card p-6">
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Avantajlar</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {landing.advantages.map((a) => (
              <li key={a} className="saas-card px-5 py-4 text-sm font-semibold text-slate-700">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* VIDEO */}
      <section className="section-pad border-t border-slate-100/80">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Video</h2>
          <div className="saas-card mt-6 flex min-h-[220px] flex-col items-center justify-center bg-gradient-to-br from-blue-600/90 to-slate-900 p-8 text-center text-white">
            <p className="text-lg font-bold">{landing.videoTitle}</p>
            <p className="mt-2 max-w-md text-sm text-white/75">{landing.videoNote}</p>
            <Link
              to="/demo"
              onClick={() => trackCta('cta_demo', { source: `${src}_video` })}
              className="btn-gold mt-6"
            >
              Canlı demo izle →
            </Link>
          </div>
        </div>
      </section>

      {/* SCREENS */}
      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Ekran görselleri</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {landing.screens.map((s) => (
              <figure key={s.title} className="saas-card overflow-hidden !p-0">
                <div className="flex h-40 items-end bg-gradient-to-br from-blue-500 to-violet-500/60 p-4">
                  <span className="text-sm font-bold text-white">{s.title}</span>
                </div>
                <figcaption className="p-4 text-sm text-slate-500">{s.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-pad border-t border-slate-100/80" id="musteri-yorumlari">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="section-title">Müşteri yorumları</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <article key={t.name} className="saas-card flex flex-col p-6">
                <div
                  className="flex items-center gap-1 text-amber-400"
                  aria-label="5 üzerinden 5 puan"
                >
                  {'★★★★★'}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">“{t.quote}”</p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <OptimizedImage
                    src={t.image}
                    alt={t.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                    placeholder="blur"
                    blurDataURL={BLUR_PHOTO}
                  />
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Yazılı yorumlar · Video referanslar yakında · Puanlama 5/5 örnekleri
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h2 className="section-title text-center">SSS</h2>
          <div className="mt-8 space-y-3">
            {landing.faqs.map((f) => (
              <details key={f.q} className="saas-card group p-0">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-slate-800 marker:content-none">
                  {f.q}
                </summary>
                <p className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="section-pad border-t border-slate-100/80">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <h2 className="section-title">Paketler</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Enterprise Full Paket ile tüm modülleri açın. Detaylı karşılaştırma ve Bachy ile fiyat
            sayfasında.
          </p>
          <Link
            to="/fiyatlar"
            onClick={() => trackCta('cta_quote', { source: `${src}_pricing` })}
            className="btn-primary mt-8"
          >
            Paketleri incele →
          </Link>
        </div>
      </section>

      {/* DEMO CTA */}
      <section className="section-pad pt-0">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="cta-band px-8 py-14 text-center text-white lg:px-16">
            <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">Demo çağrısı</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/75">
              30 dakikada {landing.name} sürecinizi birlikte tarayalım. Kredi kartı gerekmez.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/demo"
                onClick={() => trackCta('cta_demo', { source: `${src}_band` })}
                className="btn-gold"
              >
                Hemen Demo Talep Et
              </Link>
              <Link
                to="/uye-ol"
                onClick={() => trackCta('cta_trial', { source: `${src}_band` })}
                className="btn-secondary !border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
              >
                Ücretsiz Dene
              </Link>
            </div>
          </div>
        </div>
      </section>

      <RelatedTopics
        items={[
          { label: 'Knowledge rehberi', path: landing.knowledgePath },
          { label: 'Sektörler', path: '/sektorler' },
          { label: 'Başarı hikayeleri', path: '/basari-hikayeleri' },
          { label: 'Referanslar', path: '/referanslar' },
          { label: 'Fiyatlar', path: '/fiyatlar' },
        ]}
      />
    </div>
  )
}
