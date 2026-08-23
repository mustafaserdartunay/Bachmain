'use client'

import { Link } from 'react-router-dom'
import dynamic from 'next/dynamic'
import { ArrowRight, MapPin } from 'lucide-react'
import KadikoyFieldMap from '../components/landing/KadikoyFieldMap'
import TestimonialsCarousel from '../components/landing/TestimonialsCarousel'
import ScrollReveal, { Counter } from '../components/ScrollReveal'
import OptimizedImage from '../components/seo/OptimizedImage'
import { BLUR_LOGO, BLUR_PHOTO } from '../seo/imageBlur'
import SmoothScrollProvider from '../components/cinematic/SmoothScrollProvider'
import CustomCursor from '../components/cinematic/CustomCursor'
import HeroScene from '../components/cinematic/hero/HeroScene'
import CinematicPageFloor from '../components/cinematic/story/CinematicPageFloor'
import LiveAppPanel from '../components/landing/LiveAppPanel'
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

        <section className="stats-band stats-band-mesh stats-band--alive py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-3 lg:grid-cols-6 lg:px-8">
            {bandStats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 0.05} className="text-center">
                <div className="stats-band-value text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
                  <Counter
                    end={s.end}
                    prefix={s.prefix || ''}
                    suffix={s.suffix || ''}
                    decimals={s.decimals || 0}
                  />
                </div>
                <div className="stats-band-label mt-2 text-sm font-semibold text-white/80">
                  {s.label}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <ScrollStory />
        <AISection />
        <MobileSection />

        <div id="nasil-calisir">
          <ProcessFlowShowcase />
        </div>

        <ModulesShowcase />

        {/* GÜNCEL DURUM — ana panel ekranı */}
        <section id="panel" className="section-pad overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
            <ScrollReveal className="mb-10">
              <span className="pill">Ana sayfa · Güncel Durum</span>
              <h2 className="section-title mx-auto mt-4">Güncel Durum Sayfası</h2>
              <p className="section-desc mx-auto">
                BACHMAIN’e girişte sizi karşılayan ana ekran. Kasa, gelir-gider, teklif, müşteri ve
                fatura kısayolları; ay sonu nakit dengesi; finans özeti ve aktivasyon zaman tablosu
                tek bakışta — operasyonu anlık yönetin.
              </p>
            </ScrollReveal>
          </div>
          <div className="erp-full-bleed px-2 sm:px-4 lg:px-6 xl:px-8">
            <LiveAppPanel
              src="/assets/guncel-durum-panel.jpg"
              alt="BACHMAIN Güncel Durum ana sayfası — nakit dengesi, finans özeti ve hızlı aksiyonlar"
              caption="Güncel Durum · ana sayfa paneli"
            />
          </div>
          <div className="mx-auto mt-8 grid max-w-5xl gap-3 px-4 sm:grid-cols-3 lg:px-8">
            {[
              ['Hızlı aksiyonlar', 'Kasa, gelir, gider, teklif, müşteri ve fatura tek tıkla'],
              ['Nakit dengesi', 'Mevcut denge ve operasyonel senaryo göstergeleri'],
              ['Finans özeti', 'Tahsilat, ödeme, stok, kasa ve banka bakiyeleri'],
            ].map(([t, d]) => (
              <div
                key={t}
                className="guncel-durum-point rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left backdrop-blur"
              >
                <div className="text-sm font-bold text-white">{t}</div>
                <div className="mt-1 text-xs leading-relaxed text-white/75">{d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MÜŞTERİLER / B2B */}
        <section className="section-pad">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
            <ScrollReveal direction="left">
              <span className="pill">Müşteriler</span>
              <h2 className="section-title mt-4">Müşteri & Cari Yönetimi</h2>
              <p className="section-desc">
                Gerçek Müşteriler ekranı — özet kartlar, filtreler, tip/temsilci/puantaj ve güncel
                bakiye. Bayi ve müşteri kayıtlarını tek listeden yönetin; B2B portal ile aynı veri
                dilini paylaşın.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {b2bFeatures.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 shadow-sm"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <Link to="/features/crm" className="btn-primary mt-8">
                Müşteri Modülünü İncele
              </Link>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <LiveAppPanel
                compact
                src="/assets/musteriler-panel.jpg"
                alt="BACHMAIN Müşteriler sayfası — cari listesi, filtreler ve özet metrikler"
                caption="Müşteriler · canlı liste"
              />
            </ScrollReveal>
          </div>
        </section>

        {/* FIELD SALES */}
        <section className="section-pad field-sales-section">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
            <ScrollReveal direction="left">
              <KadikoyFieldMap />
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
                  src: '/assets/integrations/efatura.svg',
                },
                {
                  name: 'SMS',
                  src: '/assets/integrations/sms.svg',
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
            <TestimonialsCarousel items={testimonials} />
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
