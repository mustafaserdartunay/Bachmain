import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

export default function TruckDeliveryPanel({ stop, onClose, onOpenProof }) {
  if (!stop) return null
  const load = (stop.cargo || []).reduce(
    (acc, item) => {
      acc.boxes += Number(item.boxes) || 0
      acc.pallets += Number(item.pallets) || 0
      acc.kg += Number(item.kg) || 0
      return acc
    },
    { boxes: 0, pallets: 0, kg: 0 },
  )

  return (
    <aside className="app-surface-panel tcc-drawer p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={`${TCC_YFB} uppercase`}>Teslimat detayı</p>
        <button type="button" className={TCC_MUTED} onClick={onClose}>
          Kapat
        </button>
      </div>
      <p className={`${TCC_YFB} text-[var(--ink)]`}>
        {String(stop.seq).padStart(2, '0')} · {stop.customerLabel}
      </p>
      <p className={TCC_YF}>{stop.address || stop.city}</p>
      <p className={`${TCC_MUTED} mt-2`}>{stop.statusLabel}</p>
      <p className={TCC_MUTED}>Sipariş: {stop.orderNo || '—'}</p>
      <p className={TCC_MUTED}>Fatura: {stop.invoiceNo || '—'}</p>
      <p className={TCC_MUTED}>
        {load.boxes ? `${load.boxes} koli · ` : ''}
        {load.pallets ? `${load.pallets} palet · ` : ''}
        {load.kg ? `${Math.round(load.kg)} kg` : 'Yük kaydı yok'}
      </p>
      <p className={TCC_MUTED}>ETA: {stop.etaAt || '—'}</p>
      {stop.proof ? (
        <button type="button" className="tcc-chip mt-3" onClick={() => onOpenProof?.(stop)}>
          Teslimat kanıtı
        </button>
      ) : null}
    </aside>
  )
}
