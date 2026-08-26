import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

export default function TruckOperationStatus({ banner, kpis, windowRisk, hasLiveGps }) {
  if (!banner) return null
  return (
    <section
      className={`${APP_SURFACE_PANEL_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={`tcc-status-dot ${banner.tone || 'muted'}`} />
        <div className="min-w-0">
          <p className={`${TCC_YFB} uppercase text-[var(--ink)]`}>{banner.title}</p>
          <p className={`${TCC_YF} mt-0.5`}>{banner.detail}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className={TCC_MUTED}>{kpis.totalStops} teslimat</span>
        <span className={TCC_MUTED}>✓ {kpis.delivered} teslim</span>
        <span className={TCC_MUTED}>● {kpis.inTransit} yolda</span>
        <span className={TCC_MUTED}>○ {kpis.waiting} bekliyor</span>
        <span className={TCC_MUTED}>⚠ {kpis.delayed} gecikmiş</span>
      </div>
      {windowRisk ? <p className={`${TCC_YFB} text-amber-600`}>⚠ {windowRisk.label}</p> : null}
      {!hasLiveGps ? (
        <p className={TCC_MUTED}>Rota ilerleme yüzdesi GPS olmadan hesaplanmaz.</p>
      ) : null}
    </section>
  )
}
