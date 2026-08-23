'use client'

import LiveAppPanel from './LiveAppPanel'

/**
 * Gerçek CRM «Güncel Durum» ekran görüntüsü — vektör taklit değil, orijinal UI.
 */
export default function GuncelDurumPanel({ className = '' }) {
  return (
    <LiveAppPanel
      className={`hq-panel hq-panel--guncel ${className}`.trim()}
      src="/assets/guncel-durum-panel.jpg"
      alt="Bachmain Güncel Durum paneli — kasa, gelir-gider, teklif, müşteri kısayolları, ay sonu nakit dengesi ve finans özeti"
      caption="Güncel Durum · gerçek uygulama ekranı"
    />
  )
}
