'use client'

import { Globe, Smartphone } from 'lucide-react'

export default function MobileSection() {
  return (
    <section className="cine-mobile-section" aria-labelledby="cine-mobile-title">
      <p className="cine-kicker">Mobil uygulamalar</p>
      <h2 id="cine-mobile-title" className="cine-act-title">
        İşiniz artık her yerde.
      </h2>
      <p className="cine-act-body cine-mobile-lead">
        Web paneli, saha satış ve müşteri portalı aynı veriyle senkron — mobil uygulamalar yakında.
      </p>
      <ul className="cine-platform-list">
        <li>
          <Globe className="h-4 w-4" aria-hidden />
          Web
        </li>
        <li className="is-soon">
          <Smartphone className="h-4 w-4" aria-hidden />
          iOS Yakında
        </li>
        <li className="is-soon">
          <Smartphone className="h-4 w-4" aria-hidden />
          Android Yakında
        </li>
      </ul>
      <p className="cine-mobile-tagline">Bachmain ile işinizi geleceğe taşıyın.</p>
    </section>
  )
}
