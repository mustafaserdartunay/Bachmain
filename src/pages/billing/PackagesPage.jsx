import { Link } from 'react-router-dom'
import { Check, HardDrive, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CRM_PRICING_PLANS,
  STUDIO_PRICING_PLAN,
  checkoutPath,
  formatTry,
} from '../../data/pricingPlans'
import { startStudioTrial, STUDIO_ORIGIN, hasStudioAccess } from '../../utils/studioAccess'
import { useAuth } from '../../auth/AuthContext'
import BrandLogo from '../../components/Layout/BrandLogo'
import {
  fetchProductUpdates,
  filterChannel,
  getUnreadIds,
  markChannelSeen,
  readUpdatesCache,
  UNREAD_PILL_CLASS,
  UPDATE_CHANNELS,
} from '../../utils/productUpdates'

export default function PackagesPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('month')
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const studioFocus = params.get('urun') === 'studio'
  const cachedItems = readUpdatesCache().items
  const [notices, setNotices] = useState(() => filterChannel(cachedItems, UPDATE_CHANNELS.package))
  const [freshIds, setFreshIds] = useState(
    () => new Set(getUnreadIds(cachedItems, UPDATE_CHANNELS.package)),
  )
  const perLabel = period === 'year' ? '/ yıl · KDV hariç' : '/ ay · KDV hariç'

  useEffect(() => {
    let cancelled = false
    fetchProductUpdates()
      .then((payload) => {
        if (cancelled) return
        const next = filterChannel(payload.items, UPDATE_CHANNELS.package)
        setFreshIds(new Set(getUnreadIds(payload.items, UPDATE_CHANNELS.package)))
        setNotices(next)
        markChannelSeen(payload.items, UPDATE_CHANNELS.package)
      })
      .catch(() => {
        if (!cancelled) markChannelSeen(notices, UPDATE_CHANNELS.package)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="crm-pricing-page">
      <section className="crm-pricing-hero">
        <div className="crm-pricing-brand">
          <BrandLogo />
        </div>
        <h1 className="crm-pricing-hero-title">
          {studioFocus ? 'Bachmain Studio denemesi' : 'İşinize uyan paket'}
        </h1>
        <p className="crm-pricing-hero-sub">
          {studioFocus
            ? 'Studio, uygulamadan ayrı satın alınır. 7 gün deneme ile kendi web sitenizi kurun — verileriniz yalnızca size aittir.'
            : 'Starter, Professional veya Enterprise — her sütunda özet özellikler ve detaylı açıklamalar yukarıdan aşağıya sıralıdır. Studio ayrı üründür.'}
        </p>

        <div className="crm-pricing-period" role="group" aria-label="Fatura dönemi">
          <button
            type="button"
            className={period === 'month' ? 'is-active' : undefined}
            onClick={() => setPeriod('month')}
          >
            Aylık
          </button>
          <button
            type="button"
            className={period === 'year' ? 'is-active' : undefined}
            onClick={() => setPeriod('year')}
          >
            Yıllık
            <span className="crm-pricing-save">2 ay hediye</span>
          </button>
        </div>
      </section>

      {notices.length ? (
        <section className="crm-pricing-plans" style={{ paddingTop: 0 }}>
          <div className="mx-auto max-w-4xl space-y-3 px-4">
            <h2 className="inline-flex items-center justify-center gap-2 text-center text-[14px] font-bold text-[var(--muted)]">
              Fiyat ve paket bildirimleri
              {freshIds.size ? (
                <span className={UNREAD_PILL_CLASS}>
                  {freshIds.size > 9 ? '9+' : freshIds.size}
                </span>
              ) : null}
            </h2>
            {notices.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[14px] font-bold text-[var(--muted)]">{item.title}</h3>
                  {item.code ? (
                    <span className="rounded-md bg-black/5 px-2 py-0.5 font-mono text-[12px] font-bold text-[var(--muted)]">
                      {item.code}
                    </span>
                  ) : null}
                  {freshIds.has(item.id) ? <span className={UNREAD_PILL_CLASS}>Yeni</span> : null}
                </div>
                {item.planName ? (
                  <p className="mt-1 text-[14px] text-[var(--muted)]">Paket: {item.planName}</p>
                ) : null}
                {item.priceFrom != null || item.priceTo != null ? (
                  <p className="mt-1 text-[14px] font-bold text-[var(--muted)]">
                    {item.priceFrom != null ? formatTry(item.priceFrom) : '—'}
                    {' → '}
                    {item.priceTo != null ? formatTry(item.priceTo) : '—'}
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[var(--muted)]">
                  {item.body || item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="crm-pricing-plans">
        <article
          className={`crm-pricing-card crm-pricing-card-full ${studioFocus ? 'is-featured' : ''}`}
          style={{ maxWidth: 720, margin: '0 auto 2rem' }}
        >
          {STUDIO_PRICING_PLAN.badge ? (
            <div className="crm-pricing-badge">{STUDIO_PRICING_PLAN.badge}</div>
          ) : null}
          <header className="crm-pricing-card-head">
            <h2 className="crm-pricing-plan-name">{STUDIO_PRICING_PLAN.plan}</h2>
            <p className="crm-pricing-tagline">{STUDIO_PRICING_PLAN.tagline}</p>
          </header>
          <div className="crm-pricing-amount-row">
            <span className="crm-pricing-amount">
              {formatTry(STUDIO_PRICING_PLAN.prices[period])}
            </span>
            <span className="crm-pricing-per">{perLabel}</span>
          </div>
          <ul className="crm-pricing-features">
            {STUDIO_PRICING_PLAN.features.map((f) => (
              <li key={f}>
                <Check className="crm-pricing-check" strokeWidth={2.5} aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {hasStudioAccess(user) ? (
              <a href={STUDIO_ORIGIN} className="crm-pricing-cta is-primary">
                Studio’yu aç
              </a>
            ) : (
              <button
                type="button"
                className="crm-pricing-cta is-primary"
                onClick={() => {
                  startStudioTrial(user)
                  window.location.href = STUDIO_ORIGIN
                }}
              >
                7 gün ücretsiz dene
              </button>
            )}
            <Link to={checkoutPath('studio', period)} className="crm-pricing-cta is-ghost">
              Studio satın al
            </Link>
          </div>
        </article>
      </section>

      <section className="crm-pricing-plans">
        <div className="crm-pricing-grid">
          {CRM_PRICING_PLANS.map((p) => {
            const amount = p.prices[period]
            const ctaClass = p.featured
              ? 'is-primary'
              : p.id === 'enterprise'
                ? 'is-navy'
                : 'is-ghost'
            return (
              <article
                key={p.id}
                className={`crm-pricing-card crm-pricing-card-full ${p.featured ? 'is-featured' : ''}`}
              >
                {p.badge ? <div className="crm-pricing-badge">{p.badge}</div> : null}

                <header className="crm-pricing-card-head">
                  <h2 className="crm-pricing-plan-name">{p.plan}</h2>
                  <p className="crm-pricing-tagline">{p.tagline}</p>
                </header>

                <div className="crm-pricing-amount-row">
                  <span className="crm-pricing-amount">{formatTry(amount)}</span>
                  <span className="crm-pricing-per">{perLabel}</span>
                </div>

                <div className="crm-pricing-meta">
                  <span>
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {p.users}
                  </span>
                  <span>
                    <HardDrive className="h-3.5 w-3.5" aria-hidden />
                    {p.storage}
                  </span>
                </div>

                <div className="crm-pricing-section">
                  <h3 className="crm-pricing-section-title">Dahil olanlar</h3>
                  <ul className="crm-pricing-features">
                    {p.features.map((f) => (
                      <li key={f}>
                        <Check className="crm-pricing-check" strokeWidth={2.5} aria-hidden />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="crm-pricing-section crm-pricing-section-detail">
                  <h3 className="crm-pricing-section-title">Detaylı özellikler</h3>
                  <ol className="crm-pricing-detail-flow">
                    {p.details.map((block, index) => (
                      <li key={block.title} className="crm-pricing-detail-step">
                        <span className="crm-pricing-step-num" aria-hidden>
                          {index + 1}
                        </span>
                        <div className="crm-pricing-detail-block">
                          <h4>{block.title}</h4>
                          <p>{block.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <Link to={checkoutPath(p.id, period)} className={`crm-pricing-cta ${ctaClass}`}>
                  {p.plan} Satın Al
                </Link>
              </article>
            )
          })}
        </div>
        <p className="crm-pricing-footnote">
          Fiyatlar katalog fiyatlarıdır. Satın Al ile ödeme sayfasına geçersiniz; seçtiğiniz dönem
          korunur.
        </p>
      </section>
    </div>
  )
}
