'use client'

import { Globe, Smartphone } from 'lucide-react'

export default function PlatformBar() {
  return (
    <section className="cine-platforms" aria-label="Platformlar">
      <p>Bachmain ile işinizi geleceğe taşıyın.</p>
      <ul>
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
    </section>
  )
}
