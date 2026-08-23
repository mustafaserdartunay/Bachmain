'use client'

import { Link } from 'react-router-dom'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import ScrollReveal, { Counter } from '../components/ScrollReveal'
import OptimizedImage from '../components/seo/OptimizedImage'
import { BLUR_LOGO, BLUR_PHOTO } from '../seo/imageBlur'
import SmoothScrollProvider from '../components/cinematic/SmoothScrollProvider'
import CustomCursor from '../components/cinematic/CustomCursor'
import HeroScene from '../components/cinematic/hero/HeroScene'
import ProblemSection from '../components/cinematic/story/ProblemSection'
import CinematicPageFloor from '../components/cinematic/story/CinematicPageFloor'
import {
  b2bFeatures,
  fieldFeatures,
  integrations,
  bandStats,
  testimonials,
} from '../data/premiumLanding'
import { faqItems } from '../data/navigation'

const ScrollStory = dynamic(() => import('../components/cinematic/story/ScrollStory'), {
  loading: () => <div className="cine-story cine-story-skeleton" aria-hidden />,
})
const AISection = dynamic(() => import('../components/cinematic/story/AISection'), {
  loading: () => <div className="section-pad min-h-[280px]" aria-hidden />,
})
const MobileSection = dynamic(() => import('../components/cinematic/story/MobileSection'), {
  loading: () => <div className="min-h-[160px]" aria-hidden />,
})
const TrustSection = dynamic(() => import('../components/cinematic/story/TrustSection'), {
  loading: () => <div className="section-pad min-h-[200px]" aria-hidden />,
})

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
    <SmoothScrollProvider>
      <div className="cine-page home-page">
        <CustomCursor />
        <CinematicPageFloor />
        <HeroScene />
        <ProblemSection />
        <ScrollStory />
        <AISection />
        <MobileSection />

        <section className="stats-band stats-band-mesh stats-band--alive py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-3 lg:grid-cols-6 lg:px-8">
            {bandStats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 0.05} className="text-center">
                <div className="stats-band-value text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
                  {s.value.includes('+') || s.value.includes('%') || s.value.includes('/') ? (
                    s.value
                  ) : (
                    <Counter
                      end={parseInt(s.value, 10) || 0}
                      suffix={s.value.replace(/[0-9.]/g, '')}
                    />
                  )}
                </div>
                <div className="stats-band-label mt-2 text-sm font-semibold text-white/80">
                  {s.label}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <div id="nasil-calisir">
          <ProcessFlowShowcase />
        </div>

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
        <section className="section-pad field-sales-section">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
            <ScrollReveal direction="left">
              <div className="field-map-shell relative h-[460px] overflow-hidden rounded-[1.5rem] border border-white/15 shadow-2xl">
                {/* CSP iframe engeli yok — gerçek Kadıköy OSM static harita */}
                <img
                  src="https://staticmap.openstreetmap.de/staticmap.php?center=40.9901,29.0584&zoom=13&size=1000x600&maptype=mapnik"
                  alt="İstanbul Kadıköy saha haritası"
                  className="field-map-iframe absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="field-map-overlay pointer-events-none absolute inset-0" />
                {[
                  { t: '28%', l: '48%', c: 'bg-blue-500', label: 'Moda' },
                  { t: '42%', l: '36%', c: 'bg-emerald-500', label: 'Caferağa' },
                  { t: '55%', l: '58%', c: 'bg-orange-400', label: 'Fenerbahçe' },
                  { t: '38%', l: '62%', c: 'bg-violet-500', label: 'Caddebostan' },
                ].map((p, i) => (
                  <motion.div
                    key={p.label}
                    className="absolute z-10"
                    style={{ top: p.t, left: p.l }}
                    animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.35 }}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${p.c} text-white shadow-xl ring-4 ring-white/25`}
                      title={p.label}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                  </motion.div>
                ))}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-around rounded-2xl border border-white/15 bg-[#0b1b3a]/75 px-4 py-3 backdrop-blur-md">
                  {[
                    ['12', 'Temsilci'],
                    ['84', 'Ziyaret'],
                    ['₺1.2M', 'Satış'],
                  ].map(([v, l]) => (
                    <div key={l} className="text-center">
                      <div className="text-lg font-extrabold text-white">{v}</div>
                      <div className="text-[10px] uppercase tracking-wide text-white/55">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <span className="pill">Saha Satış</span>
              <h2 className="section-title mt-4">Sahayı Haritadan Yönetin</h2>
              <p className="section-desc">
                İstanbul Kadıköy ve tüm Türkiye — canlı konum, rota, ziyaret, sipariş ve tahsilat
                tek mobilde.
              </p>
              <div className="mt-6 space-y-3">
                {fieldFeatures.map((f) => (
                  <div key={f.title} className="saas-card field-feature-card flex gap-3 p-4">
                    <div className="field-feature-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg">
                      <MapPin className="h-5 w-5" />
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
        <section className="section-pad feature-trio-section">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                {
                  title: 'Nakliye & Lojistik',
                  desc: 'Tır, koli, palet, konteyner ve canlı sevkiyat durumları.',
                  to: '/features/stock',
                  tone: 'sky',
                  emoji: '🚛',
                },
                {
                  title: 'CRM Pipeline',
                  desc: 'Fırsatlar, kanban, görevler, toplantılar ve müşteri kartları.',
                  to: '/features/crm',
                  tone: 'violet',
                  emoji: '🎯',
                },
                {
                  title: 'Raporlama',
                  desc: 'Canlı KPI, satış, tahsilat, kasa ve banka grafikleri.',
                  to: '/features/reports',
                  tone: 'emerald',
                  emoji: '📊',
                },
              ].map((c, i) => (
                <ScrollReveal key={c.title} delay={i * 0.08}>
                  <Link
                    to={c.to}
                    className={`feature-trio-card feature-trio-card--${c.tone} block p-7`}
                  >
                    <div className="feature-trio-emoji" aria-hidden>
                      {c.emoji}
                    </div>
                    <h3 className="mt-4 text-xl font-extrabold text-slate-900">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600">
                      İncele <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section className="integrations-band border-y border-slate-200/40 py-14">
          <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Entegrasyonlar
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {[
                {
                  name: 'WhatsApp',
                  src: 'https://cdn.simpleicons.org/whatsapp/25D366',
                },
                {
                  name: 'Instagram',
                  src: 'https://cdn.simpleicons.org/instagram/E4405F',
                },
                {
                  name: 'Facebook',
                  src: 'https://cdn.simpleicons.org/facebook/1877F2',
                },
                {
                  name: 'Meta',
                  src: 'https://cdn.simpleicons.org/meta/0082FB',
                },
                {
                  name: 'e-Fatura',
                  src: 'https://cdn.simpleicons.org/invoice/2563EB',
                },
                {
                  name: 'SMS',
                  src: 'https://cdn.simpleicons.org/twilio/F22F46',
                },
                {
                  name: 'Mail',
                  src: 'https://cdn.simpleicons.org/gmail/EA4335',
                },
                {
                  name: 'API',
                  src: 'https://cdn.simpleicons.org/fastapi/009688',
                },
              ].map((item) => (
                <div key={item.name} className="integration-logo-card">
                  <img src={item.src} alt="" width={28} height={28} loading="lazy" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="referanslar" className="section-pad testimonials-section">
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
                  <article className="testimonial-card testimonial-card--v2 group flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex gap-0.5 text-amber-400"
                        aria-label={`${t.rating} yıldız`}
                      >
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

        <TrustSection />

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
                    src="/assets/bachmain-logo-on-dark.png"
                    alt="BACHMAIN"
                    width={220}
                    height={48}
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
    </SmoothScrollProvider>
  )
}
