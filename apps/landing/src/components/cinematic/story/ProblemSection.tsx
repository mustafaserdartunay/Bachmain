'use client'

import { Link } from 'react-router-dom'

export default function ProblemSection() {
  return (
    <section className="cine-problem" id="problem">
      <p className="cine-kicker">Neden tek platform?</p>
      <h2 className="cine-problem-title">
        İşletmenizde onlarca farklı sistem kullanmak zorunda değilsiniz.
      </h2>
      <p className="cine-problem-lead">
        Satış, üretim, stok, lojistik ve finans aynı dilde konuşsun. Dağınık yazılımlar yerine tek
        ekosistem — Tüm süreçler tek platform.
      </p>
      <Link to="/features" className="cine-btn cine-btn-ghost cine-problem-cta">
        Tüm özellikleri gör
      </Link>
    </section>
  )
}
