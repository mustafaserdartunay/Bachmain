'use client'

import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Boxes, LayoutTemplate, Sparkles } from 'lucide-react'

type Side = 'business' | 'studio' | null

const businessPoints = ['CRM & ERP tek panel', 'Üretim · Depo · Finans', 'E-Fatura & WhatsApp']
const studioPoints = [
  'Sürükle-bırak sayfa tasarımı',
  'Domain & yayın yönetimi',
  'SEO ve içerik paneli',
]

export default function GatewayPage() {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState<Side>(null)

  const onMove = useCallback(
    (side: Side) => {
      if (!reduceMotion) setActive(side)
    },
    [reduceMotion],
  )

  const businessFlex = active === 'business' ? 1.18 : active === 'studio' ? 0.82 : 1
  const studioFlex = active === 'studio' ? 1.18 : active === 'business' ? 0.82 : 1

  return (
    <div className="gateway-root">
      <div className="gateway-ambient" aria-hidden>
        <span className="gateway-orb gateway-orb-a" />
        <span className="gateway-orb gateway-orb-b" />
      </div>

      <div className="gateway-brand-bar">
        <p className="gateway-brand-kicker">bachmain.com</p>
        <p className="gateway-brand-sub">İki ürün · tek ekosistem</p>
      </div>

      <div className="gateway-split" onMouseLeave={() => setActive(null)}>
        <motion.section
          className="gateway-panel gateway-panel-business"
          style={{ flex: businessFlex }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          onMouseEnter={() => onMove('business')}
          onFocus={() => onMove('business')}
          aria-labelledby="gateway-business-title"
        >
          <div className="gateway-panel-glow" aria-hidden />
          <div className="gateway-panel-inner">
            <div className="gateway-logo-row">
              <img
                src="/assets/bachmain-logo.png"
                alt="BACHMAIN"
                width={200}
                height={44}
                className="gateway-logo"
                draggable={false}
              />
              <span className="gateway-product-tag gateway-product-tag-dark">Business</span>
            </div>

            <h1 id="gateway-business-title" className="gateway-title gateway-title-dark">
              İşinizi tek panelden yönetin
            </h1>
            <p className="gateway-lead gateway-lead-dark">
              Bachmain Business; CRM, ERP, üretim, depo, finans ve e-faturayı aynı bulutta
              birleştirir. Tekliften tahsilata tüm süreçler burada.
            </p>

            <ul className="gateway-points">
              {businessPoints.map((item) => (
                <li key={item}>
                  <Boxes className="gateway-point-icon" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/" className="gateway-cta gateway-cta-business">
              BACHMAIN&apos;e gir
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <motion.div
            className="gateway-float-card gateway-float-card-light"
            animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [0, 1.2, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>CRM · ERP · Muhasebe</span>
          </motion.div>
        </motion.section>

        <motion.section
          className="gateway-panel gateway-panel-studio"
          style={{ flex: studioFlex }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          onMouseEnter={() => onMove('studio')}
          onFocus={() => onMove('studio')}
          aria-labelledby="gateway-studio-title"
        >
          <div className="gateway-panel-mesh" aria-hidden />
          <div className="gateway-panel-inner">
            <div className="gateway-logo-row">
              <img
                src="/assets/bachmain-logo-on-dark.png"
                alt="BACHMAIN"
                width={200}
                height={44}
                className="gateway-logo"
                draggable={false}
              />
              <span className="gateway-product-tag gateway-product-tag-light">Studio</span>
            </div>

            <h2 id="gateway-studio-title" className="gateway-title gateway-title-light">
              Web sitenizi özgürce tasarlayın
            </h2>
            <p className="gateway-lead gateway-lead-light">
              Bachmain Studio; sürükle-bırak editör, şablonlar ve yayın paneliyle markanıza özel web
              siteleri kurmanızı sağlar.
            </p>

            <ul className="gateway-points gateway-points-light">
              {studioPoints.map((item) => (
                <li key={item}>
                  <LayoutTemplate className="gateway-point-icon" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/studio" className="gateway-cta gateway-cta-studio">
              Studio&apos;ya gir
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <motion.div
            className="gateway-float-card gateway-float-card-dark"
            animate={reduceMotion ? undefined : { y: [0, 12, 0], rotate: [0, -1.4, 0] }}
            transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            aria-hidden
          >
            <LayoutTemplate className="h-4 w-4 text-sky-200" />
            <span>Builder · Domain · SEO</span>
          </motion.div>
        </motion.section>
      </div>
    </div>
  )
}
