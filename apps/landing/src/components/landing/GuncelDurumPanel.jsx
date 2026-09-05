'use client'

import LiveAppPanel from './LiveAppPanel'

/**
 * Gerçek CRM «Güncel Durum» ekranı — orijinal UI, 4K kaynak, canlı hareket.
 */
export default function GuncelDurumPanel({ className = '' }) {
  return (
    <LiveAppPanel
      className={`hq-panel hq-panel--guncel ${className}`.trim()}
      src="/assets/guncel-durum-panel-4k.jpg"
      srcSet="/assets/guncel-durum-panel.jpg 1536w, /assets/guncel-durum-panel-4k.jpg 3840w"
      alt="Bachmain Güncel Durum paneli — kasa, gelir-gider, teklif, müşteri kısayolları, ay sonu nakit dengesi ve finans özeti"
      caption="Güncel Durum · gerçek uygulama ekranı"
      width={3840}
      height={2560}
      cinematic
    />
  )
}
