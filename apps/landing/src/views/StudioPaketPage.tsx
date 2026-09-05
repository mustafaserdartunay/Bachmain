'use client'

import { Link } from 'react-router-dom'
import './studio-landing.css'

export default function StudioPaketPage() {
  return (
    <div className="spl spl-simple spl-paket">
      <section className="spl-paket-wrap">
        <p className="spl-paket-kicker">Modül Seç</p>
        <h1>Studio paketi</h1>
        <p className="spl-paket-lead">Yalnızca Studio. Tek paket.</p>
        <article className="spl-pack-card">
          <img
            src="/assets/bachmain-studio-logo.png"
            alt="Bachmain Studio"
            width={200}
            height={40}
            className="spl-logo-mark"
            draggable={false}
          />
          <h2>Bachmain Studio</h2>
          <p>
            Canlı sürükle-bırak editör, şablonlar, SEO, domain ve yayın. Kendi çalışma alanınızda
            sitenizi kurup canlıya alın.
          </p>
          <strong className="spl-price">990,00₺</strong>
          <span className="spl-price-note">aylık</span>
          <div className="spl-actions">
            <Link to="/uye-ol?next=studio" className="spl-btn spl-btn-buy">
              Satın al
            </Link>
            <Link to="/studio/demo" className="spl-btn spl-btn-ghost">
              Demo oluştur
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
