'use client'

import { Link } from 'react-router-dom'
import PricingMascot from './PricingMascot'
import { trackCta } from '../../analytics/track'

/** Marketing comparison — Bachy poses: point / hug / lounge */
const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Hızlı başlangıç',
    priceLabel: 'Demo ile başla',
    points: ['CRM + temel satış', 'Cari görünümü', '7 gün deneme', 'E-posta destek'],
    cta: 'Ücretsiz Dene',
    href: '/uye-ol?plan=starter',
    event: 'cta_trial',
    variant: 'starter' as const,
    mascot: '/bachy/bachy-starter.png',
    mascotAlt: 'Bachy Starter paketini işaret ediyor',
    featured: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Büyüyen ekipler',
    priceLabel: 'Uzmanla planla',
    points: ['CRM + ERP omurgası', 'Stok & depo', 'WhatsApp inbox', 'Öncelikli onboarding'],
    cta: 'Uzmanla Görüş',
    href: '/demo?plan=pro',
    event: 'cta_expert',
    variant: 'pro' as const,
    mascot: '/bachy/bachy-pro.webp',
    mascotAlt: 'Bachy Pro paketine sarılıyor',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Tüm süreçler açık',
    priceLabel: '2.990 ₺/ay',
    points: ['Full paket tüm modüller', 'Üretim + lojistik', 'AI asistan', '100 kontör hediye'],
    cta: 'Teklif Al / Satın Al',
    href: '/uye-ol?plan=full',
    event: 'cta_quote',
    variant: 'enterprise' as const,
    mascot: '/bachy/bachy-enterprise.png',
    mascotAlt: 'Bachy Enterprise paketinin üzerinde',
    featured: false,
  },
]

export default function PricingTierBachy() {
  return (
    <div className="mx-auto mt-16 max-w-[1600px]">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Starter · Pro · Enterprise
        </h2>
        <p className="mt-3 text-sm text-slate-500">
          Bachy size yol göstersin. Starter’ı işaret eder, Pro’ya sarılır, Enterprise’da keyifle
          uzanır — siz ihtiyacınıza göre ilerlersiniz.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
        {TIERS.map((tier) => (
          <article
            key={tier.id}
            className={`relative overflow-visible rounded-[32px] border bg-white p-8 pt-14 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
              tier.featured ? 'border-[3px] border-[#2563EB]' : 'border border-slate-200'
            }`}
          >
            <PricingMascot src={tier.mascot} alt={tier.mascotAlt} variant={tier.variant} />
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              {tier.tagline}
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-900">{tier.name}</h3>
            <p className="mt-2 text-lg font-bold text-blue-700">{tier.priceLabel}</p>
            <ul className="mt-5 space-y-2">
              {tier.points.map((p) => (
                <li key={p} className="text-sm font-medium text-slate-600">
                  · {p}
                </li>
              ))}
            </ul>
            <Link
              to={tier.href}
              className={
                tier.featured
                  ? 'btn-primary mt-8 w-full justify-center'
                  : 'btn-secondary mt-8 w-full justify-center'
              }
              onClick={() => trackCta(tier.event, { source: 'pricing_tier', plan: tier.id })}
            >
              {tier.cta}
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
