import { Link } from 'react-router-dom'
import { Check, HardDrive, Users } from 'lucide-react'
import { useState } from 'react'
import { CRM_PRICING_PLANS, checkoutPath, formatTry } from '../../data/pricingPlans'
import BrandLogo from '../../components/Layout/BrandLogo'

function BuyRow({ period, className = '' }) {
  return (
    <div className={`crm-pricing-buy-row ${className}`.trim()}>
      {CRM_PRICING_PLANS.map((p) => (
        <Link
          key={p.id}
          to={checkoutPath(p.id, period)}
          className={`crm-pricing-buy-btn ${p.featured ? 'is-primary' : p.id === 'enterprise' ? 'is-navy' : 'is-ghost'}`}
        >
          {p.plan} Satın Al
        </Link>
      ))}
    </div>
  )
}

export default function PackagesPage() {
  const [period, setPeriod] = useState('month')
  const perLabel = period === 'year' ? '/ yıl · KDV hariç' : '/ ay · KDV hariç'

  return (
    <div className="crm-pricing-page">
      <section className="crm-pricing-hero">
        <div className="crm-pricing-brand">
          <BrandLogo />
        </div>
        <h1 className="crm-pricing-hero-title">İşinize uyan paket</h1>
        <p className="crm-pricing-hero-sub">
          Starter, Professional veya Enterprise — ihtiyaçlarınıza göre seçin. Ödeme adımında kart veya havale ile devam edebilirsiniz.
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

      <BuyRow period={period} className="is-top" />

      <section className="crm-pricing-plans">
        <div className="crm-pricing-grid">
          {CRM_PRICING_PLANS.map((p) => {
            const amount = p.prices[period]
            return (
              <article key={p.id} className={`crm-pricing-card ${p.featured ? 'is-featured' : ''}`}>
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
                <ul className="crm-pricing-features">
                  {p.features.map((f) => (
                    <li key={f}>
                      <Check className="crm-pricing-check" strokeWidth={2.5} aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={checkoutPath(p.id, period)}
                  className={`crm-pricing-cta ${p.featured ? 'is-primary' : p.id === 'enterprise' ? 'is-navy' : 'is-ghost'}`}
                >
                  Satın Al
                </Link>
              </article>
            )
          })}
        </div>
        <p className="crm-pricing-footnote">
          Fiyatlar katalog fiyatlarıdır. Satın Al ile ödeme sayfasına geçersiniz; seçtiğiniz dönem korunur.
        </p>
      </section>

      <section className="crm-pricing-details">
        <h2 className="crm-pricing-details-title">Paketlerin detaylı özellikleri</h2>
        <p className="crm-pricing-details-lead">
          Her paketin kapsadığı süreçleri aşağıdan inceleyin; hazır olduğunuzda Satın Al ile ödeme adımına geçin.
        </p>
        <div className="crm-pricing-details-grid">
          {CRM_PRICING_PLANS.map((p) => (
            <article key={`detail-${p.id}`} className={`crm-pricing-detail-card ${p.featured ? 'is-featured' : ''}`}>
              <div className="crm-pricing-detail-top">
                <h3>{p.plan}</h3>
                <span>{formatTry(p.prices[period])} {perLabel}</span>
              </div>
              <div className="crm-pricing-detail-blocks">
                {p.details.map((block) => (
                  <div key={block.title} className="crm-pricing-detail-block">
                    <h4>{block.title}</h4>
                    <p>{block.body}</p>
                  </div>
                ))}
              </div>
              <Link
                to={checkoutPath(p.id, period)}
                className={`crm-pricing-cta ${p.featured ? 'is-primary' : p.id === 'enterprise' ? 'is-navy' : 'is-ghost'}`}
              >
                {p.plan} Satın Al
              </Link>
            </article>
          ))}
        </div>
      </section>

      <BuyRow period={period} className="is-bottom" />
    </div>
  )
}
