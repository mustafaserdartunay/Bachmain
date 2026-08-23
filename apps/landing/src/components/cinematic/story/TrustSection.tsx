'use client'

import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { TRUST_POINTS } from '../../../data/cinematicStory'

export default function TrustSection() {
  return (
    <section className="cine-trust" aria-labelledby="cine-trust-title">
      <div className="cine-trust-head">
        <ShieldCheck className="cine-trust-icon" aria-hidden />
        <div>
          <p className="cine-kicker">Güven</p>
          <h2 id="cine-trust-title" className="cine-act-title">
            Güvenli, ölçeklenebilir ve profesyonel.
          </h2>
        </div>
      </div>
      <div className="cine-trust-grid">
        {TRUST_POINTS.map((p) => (
          <article key={p.label} className="cine-trust-card">
            <span className="cine-trust-value">{p.value}</span>
            <span className="cine-trust-label">{p.label}</span>
          </article>
        ))}
      </div>
      <Link to="/veri-guvenligi" className="cine-btn cine-btn-ghost">
        Veri güvenliği detayları
      </Link>
    </section>
  )
}
