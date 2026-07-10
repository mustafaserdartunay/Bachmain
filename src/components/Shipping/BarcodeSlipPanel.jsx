import { t } from '../../utils/shippingI18n'

function BarcodeBars({ code }) {
  const bars = code.split('').map((char, index) => {
    const width = (char.charCodeAt(0) % 3) + 1
    return <span key={`${code}-${index}`} className="inline-block bg-slate-900" style={{ width, height: 36, marginRight: 1 }} />
  })
  return <div className="flex items-end justify-center gap-0.5">{bars}</div>
}

export default function BarcodeSlipPanel({ lang, slips = [], unitTotals = [] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {unitTotals.map((row) => (
          <div key={row.unitType} className="rounded-xl border border-dark-500/50 bg-dark-700/40 p-3">
            <p className="text-[12px] font-bold uppercase tracking-wide text-gray-500">{t(`unit.${row.unitType}`, lang)}</p>
            <p className="mt-1 text-lg font-black text-white">{row.quantity}</p>
            <p className="text-[12px] text-gray-500">{row.weightKg} kg · {(row.volumeM3 ?? row.areaM2 ?? 0).toFixed(2)} m³</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {slips.map((slip) => (
          <div key={slip.id} className="rounded-xl border border-dark-500/50 bg-white p-4 text-slate-900 shadow-card">
            <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">{t(`unit.${slip.unitType}`, lang)}</p>
            <p className="mt-1 text-sm font-bold">{slip.productName}</p>
            <p className="mt-2 text-[12px] text-slate-500">#{slip.sequence} · {slip.weightKg} kg · {(slip.volumeM3 ?? slip.areaM2 ?? 0).toFixed?.(2) || slip.volumeM3 || slip.areaM2} m³</p>
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <BarcodeBars code={slip.barcode} />
              <p className="mt-2 text-center font-mono text-[12px] font-bold tracking-widest">{slip.barcode}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
