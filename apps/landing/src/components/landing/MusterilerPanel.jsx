'use client'

import LiveAppPanel from './LiveAppPanel'

/**
 * Gerçek CRM «Müşteriler» ekran görüntüsü — orijinal UI.
 */
export default function MusterilerPanel({ className = '', compact = false }) {
  return (
    <LiveAppPanel
      className={`hq-panel hq-panel--musteriler ${className}`.trim()}
      compact={compact}
      src="/assets/musteriler-panel.jpg"
      alt="Bachmain Müşteriler listesi — cari, bakiye ve B2B görünümü"
      caption={compact ? undefined : 'Müşteriler · gerçek uygulama ekranı'}
    />
  )
}
