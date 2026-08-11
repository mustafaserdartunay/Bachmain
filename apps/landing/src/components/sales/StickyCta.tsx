'use client'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trackCta } from '../../analytics/track'

/** Sticky conversion bar — appears after scroll, design-safe. */
export default function StickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200/80 bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:px-6"
      role="region"
      aria-label="Hızlı dönüşüm çubuğu"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="hidden text-sm font-semibold text-slate-700 sm:block">
          7 gün ücretsiz · Kredi kartı gerekmez
        </p>
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <Link
            to="/demo"
            className="btn-primary !px-4 !py-2.5 text-[13px]"
            onClick={() => trackCta('cta_demo', { source: 'sticky' })}
          >
            Hemen Demo Talep Et
          </Link>
          <Link
            to="/uye-ol"
            className="btn-secondary !px-4 !py-2.5 text-[13px]"
            onClick={() => trackCta('cta_trial', { source: 'sticky' })}
          >
            Ücretsiz Dene
          </Link>
          <Link
            to="/iletisim"
            className="btn-gold !px-4 !py-2.5 text-[13px]"
            onClick={() => trackCta('cta_expert', { source: 'sticky' })}
          >
            Uzmanla Görüş
          </Link>
        </div>
      </div>
    </div>
  )
}
