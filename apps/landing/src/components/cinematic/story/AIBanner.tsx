'use client'

import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function AIBanner() {
  return (
    <section className="cine-ai-banner" aria-label="Bachy AI asistanı">
      <div className="cine-ai-inner">
        <div className="cine-ai-copy">
          <div className="cine-ai-title-row">
            <span className="cine-ai-title">BACHY AI ASİSTANI</span>
            <span className="cine-ai-new">Yeni</span>
          </div>
          <p>Yapay zeka destekli iş asistanınız Bachy, tüm süreçlerinizi kolaylaştırır.</p>
        </div>
        <Link to="/openai" className="cine-ai-link">
          Bachy ile Tanış <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
