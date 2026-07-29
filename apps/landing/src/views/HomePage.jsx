'use client'

import { Link } from 'react-router-dom'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowRight, Check, MapPin, Star } from 'lucide-react'
import ScrollReveal, { Counter } from '../components/ScrollReveal'
import OptimizedImage from '../components/seo/OptimizedImage'
import { BLUR_LOGO, BLUR_PHOTO } from '../seo/imageBlur'
import {
  b2bFeatures,
  fieldFeatures,
  integrations,
  bandStats,
  testimonials,
  heroChecks,
} from '../data/premiumLanding'
import { faqItems } from '../data/navigation'

const LiveCrmDashboard = dynamic(() => import('../components/landing/LiveCrmDashboard'), {
  loading: () => <div className="erp-shell erp-shell-full min-h-[280px]" aria-hidden />,
})
const ModulesShowcase = dynamic(() => import('../components/landing/ModulesShowcase'), {
  loading: () => <div className="section-pad min-h-[200px]" aria-hidden />,
})
const ProcessFlowShowcase = dynamic(() => import('../components/landing/ProcessFlowShowcase'), {
  loading: () => <div className="section-pad min-h-[200px]" aria-hidden />,
})
const DemoForm = dynamic(() => import('../components/DemoForm'), {
  loading: () => <div className="min-h-[320px]" aria-hidden />,
})
const HomeSeoContent = dynamic(() => import('../components/landing/HomeSeoContent'), {
  loading: () => <div className="section-pad min-h-[200px]" aria-hidden />,
})

export default function HomePage() {
  return (
    <div className="page-mesh home-page">
      {/* Shared ambient orbs — one continuous canvas under the whole page */}
      <div className="home-page-orbs" aria-hidden>
        <div className="float-orb left-[-10%] top-[6%] h-[420px] w-[420px] bg-blue-400/25" />
        <div
          className="float-orb right-[-5%] top-[18%] h-[360px] w-[360px] bg-violet-400/20"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="float-orb left-[15%] top-[48%] h-[320px] w-[320px] bg-sky-400/15"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="float-orb right-[8%] top-[72%] h-[380px] w-[380px] bg-blue-400/18"
          style={{ animationDelay: '1.2s' }}
        />
      </div>

      {/* HERO + FULL WIDTH DASHBOARD */}
      <section
        className="relative overflow-hidden pt-24 pb-8 lg:pt-28 lg:pb-10"
        aria-labelledby="home-hero-heading"
      >
        <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
          <span className="pill">Yeni Nesil CRM & ERP Platformu</span>
          <h1
            id="home-hero-heading"
            className="mt-5 text-4xl font-extrabold tracking-[-0.045em] text-blue-700 sm:text-5xl lg:text-[3.2rem] lg:leading-[1.1]"
          >
            Tüm Süreçler Tek Panel
          </h1>
          <p className="hero-lead mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500 lg:text-lg">
            Tekliften siparişe, üretimden depoya, nakliye takibinden teslime kadar tüm süreçler{' '}
            <OptimizedImage
              src="/assets/bachmain-logo.png"
              alt="BACHMAIN"
              width={120}
              height={28}
              className="hero-inline-logo"
              priority
              placeholder="blur"
              blurDataURL={BLUR_LOGO}
              draggable={false}
            />{' '}
            paneliyle sizlerle.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/demo" className="btn-primary">
              Hemen Demo Talep Et <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/uye-ol" className="btn-secondary">
              Ücretsiz Dene
            </Link>
            <Link to="/fiyatlar" className="btn-gold">
              Teklif Al
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Güven unsurları">
            {['Bulut Tabanlı', 'Yapay Zeka Destekli', 'Güvenli Altyapı', '7/24 Destek'].map((t) => (
              <li
                key={t}
                className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                {t}
              </li>
            ))}
          </ul>
          <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {heroChecks.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="erp-full-bleed mt-10 px-2 sm:px-4 lg:px-6 xl:px-8">
          <LiveCrmDashboard full />
        </div>
      </section>

      {/* STATS — same mesh canvas as hero (no opaque band) */}
      <section className="stats-band stats-band-mesh py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-3 lg:grid-cols-6 lg:px-8">
          {bandStats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 0.05} className="text-center">
              <div className="text-2xl font-extrabold tracking-tight text-blue-700 lg:text-3xl">
                {s.value.includes('+') || s.value.includes('%') || s.value.includes('/') ? (
                  s.value
                ) : (
                  <Counter
                    end={parseInt(s.value, 10) || 0}
                    suffix={s.value.replace(/[0-9.]/g, '')}
                  />
                )}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">{s.label}</div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <ProcessFlowShowcase />

      <ModulesShowcase />

      {/* DATA SHOWCASE — same full panel, no crop */}
      <section id="panel" className="section-pad overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <ScrollReveal className="mb-10">
            <h2 className="section-title mx-auto">Tüm Verileriniz Tek Ekranda</h2>
            <p className="section-desc mx-auto">
              Gerçek BACHMAIN paneli — finans, aktivite, KDV ve hızlı aksiyonlar.
            </p>
          </ScrollReveal>
        </div>
        <div className="erp-full-bleed px-2 sm:px-4 lg:px-6 xl:px-8">
          <LiveCrmDashboard full />
        </div>
      </section>

      {/* B2B */}
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <ScrollReveal direction="left">
            <span className="pill">B2B Portal</span>
            <h2 className="section-title mt-4">Müşteriniz de Aynı Panelden Yönetsin</h2>
            <p className="section-desc">
              Laptop, tablet ve telefonda çalışan müşteri portalı — ERP ile aynı dil.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {b2bFeatures.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                >
                  {f}
                </span>
              ))}
            </div>
            <Link to="/features/erp" className="btn-primary mt-8">
              B2B Özelliklerini İncele
            </Link>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div className="relative">
              <LiveCrmDashboard />
              <div className="absolute -bottom-4 -left-2 w-28 overflow-hidden rounded-[1.4rem] border-4 border-slate-800 bg-slate-900 shadow-2xl sm:w-32">
                <div className="bg-white p-2">
                  <div className="mb-1 text-[8px] font-bold text-slate-800">B2B Mobil</div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-blue-300" />
                    <div className="h-1.5 w-4/5 rounded-full bg-emerald-300" />
                    <div className="h-1.5 w-3/5 rounded-full bg-orange-300" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FIELD SALES */}
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <ScrollReveal direction="left">
            <div className="relative h-[420px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#1a2744] shadow-xl">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              {[
                { t: '18%', l: '42%', c: 'bg-blue-500' },
                { t: '36%', l: '24%', c: 'bg-emerald-500' },
                { t: '50%', l: '58%', c: 'bg-orange-400' },
                { t: '62%', l: '34%', c: 'bg-violet-500' },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ top: p.t, left: p.l }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.35 }}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${p.c} text-white shadow-lg`}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                </motion.div>
              ))}
              <div className="absolute bottom-4 left-4 right-4 flex justify-around rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
                {[
                  ['12', 'Temsilci'],
                  ['84', 'Ziyaret'],
                  ['₺1.2M', 'Satış'],
                ].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <div className="text-lg font-extrabold text-white">{v}</div>
                    <div className="text-[10px] text-white/50">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <span className="pill">Saha Satış</span>
            <h2 className="section-title mt-4">Sahayı Haritadan Yönetin</h2>
            <p className="section-desc">
              Canlı konum, rota, ziyaret, sipariş ve tahsilat — mobil CRM.
            </p>
            <div className="mt-6 space-y-3">
              {fieldFeatures.map((f) => (
                <div key={f.title} className="saas-card flex gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    📍
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{f.title}</div>
                    <div className="text-sm text-slate-500">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/modules/field-sales" className="btn-primary mt-6">
              Saha Satış Modülü
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* LOGISTICS + CRM + REPORTS strip */}
      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: 'Nakliye & Lojistik',
                desc: 'Tır, koli, palet, konteyner ve canlı sevkiyat durumları.',
                to: '/features/stock',
                emoji: '🚛',
              },
              {
                title: 'CRM Pipeline',
                desc: 'Fırsatlar, kanban, görevler, toplantılar ve müşteri kartları.',
                to: '/features/crm',
                emoji: '🎯',
              },
              {
                title: 'Raporlama',
                desc: 'Canlı KPI, satış, tahsilat, kasa ve banka grafikleri.',
                to: '/features/reports',
                emoji: '📊',
              },
            ].map((c, i) => (
              <ScrollReveal key={c.title} delay={i * 0.08}>
                <Link to={c.to} className="saas-card block p-7">
                  <div className="text-3xl">{c.emoji}</div>
                  <h3 className="mt-4 text-xl font-extrabold text-slate-900">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600">
                    İncele <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="border-y border-slate-200/40 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Entegrasyonlar
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {integrations.map((name) => (
              <span
                key={name}
                className="rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="referanslar" className="section-pad">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <ScrollReveal className="mb-12 text-center">
            <span className="pill">Referanslar</span>
            <h2 className="section-title mx-auto mt-4">Kullanıcılarımız Ne Diyor?</h2>
            <p className="section-desc mx-auto">
              Gerçek ekipler, ölçülebilir sonuçlar — BACHMAIN ile büyüyen firmalar.
            </p>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.08}>
                <article className="testimonial-card group flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-0.5 text-amber-400" aria-label={`${t.rating} yıldız`}>
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star key={si} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="testimonial-quote-mark" aria-hidden>
                      “
                    </span>
                  </div>
                  <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">
                    {t.quote}
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100/80 pt-5">
                    <OptimizedImage
                      src={t.image}
                      alt={t.name}
                      className="testimonial-avatar h-12 w-12 rounded-full object-cover"
                      width={48}
                      height={48}
                      placeholder="blur"
                      blurDataURL={BLUR_PHOTO}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">{t.name}</div>
                      <div className="truncate text-xs text-slate-500">
                        {t.role} · {t.company}
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <ScrollReveal className="mb-10 text-center">
            <h2 className="section-title">Sık Sorulan Sorular</h2>
            <p className="section-desc mx-auto">
              BACHMAIN hakkında merak edilenler — deneme, güvenlik, modüller ve destek.
            </p>
          </ScrollReveal>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <ScrollReveal key={item.q} delay={i * 0.04}>
                <details className="saas-card group p-0">
                  <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-slate-800 marker:content-none">
                    {item.q}
                  </summary>
                  <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-500">
                    {item.a}
                  </p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="iletisim" className="section-pad pt-0">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <ScrollReveal>
            <div className="cta-band px-8 py-14 text-center text-white lg:px-16">
              <h2 className="cta-title text-3xl font-extrabold tracking-tight lg:text-4xl">
                <OptimizedImage
                  src="/assets/bachmain-logo.png"
                  alt="BACHMAIN"
                  width={140}
                  height={32}
                  className="cta-inline-logo"
                  placeholder="blur"
                  blurDataURL={BLUR_LOGO}
                  draggable={false}
                />
                <span>ile İşinizi Geleceğe Taşıyın</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-white/75">
                7 gün ücretsiz deneyin. Kredi kartı gerekmez. Önce deneyimleyin, dilerseniz sonra
                paketinizi satın alırsınız.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/demo"
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg"
                >
                  Demo Talep Et
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white"
                >
                  Ücretsiz Dene
                </Link>
              </div>
              <div className="mx-auto mt-10 max-w-2xl text-left">
                <DemoForm variant="band" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <HomeSeoContent />
    </div>
  )
}
