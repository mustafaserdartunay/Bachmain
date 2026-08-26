import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_LABEL, TCC_VALUE } from './truckControlUi'

const ITEMS = [
  ['remainingKmLabel', 'Kalan mesafe', 'planKmLabel'],
  ['remainingDurationLabel', 'Kalan süre', 'planDurationLabel'],
  ['etaLabel', 'ETA', null],
  ['delivery', 'Teslimat', null],
  ['deliveryPct', 'İlerleme', null],
  ['fillPct', 'Yük', null],
]

export default function TruckKpiBar({ kpis = {} }) {
  const cells = ITEMS.map(([key, label, fallbackKey]) => {
    let value = '—'
    let hint = ''
    if (key === 'delivery') {
      value = kpis.totalStops ? `${kpis.delivered} / ${kpis.totalStops}` : '—'
    } else if (key === 'deliveryPct') {
      value = kpis.totalStops ? `%${kpis.deliveryPct}` : '—'
    } else if (key === 'fillPct') {
      value = kpis.fillPct != null ? `%${kpis.fillPct}` : '—'
    } else if (kpis[key]) {
      value = kpis[key]
    } else if (fallbackKey && kpis[fallbackKey]) {
      value = kpis[fallbackKey]
      hint = 'Plan'
    }
    return { label, value, hint }
  })

  return (
    <div className="tcc-kpi-grid">
      {cells.map((cell) => (
        <section key={cell.label} className={`${APP_SURFACE_PANEL_CLASS} px-3 py-3`}>
          <p className={`${TCC_LABEL} uppercase`}>{cell.label}</p>
          <p className={`${TCC_VALUE} mt-1 text-[var(--ink)]`}>{cell.value}</p>
          {cell.hint ? <p className={`${TCC_LABEL} mt-0.5`}>{cell.hint}</p> : null}
        </section>
      ))}
    </div>
  )
}
