import { formatClock } from '../../../utils/truckControlCenter'
import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

export default function TruckEventTimeline({ events }) {
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className={`${TCC_YFB} uppercase`}>Geçmiş / olaylar</p>
      <div className="mt-3 space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3">
            <span className={`${TCC_MUTED} w-36 shrink-0`}>{formatClock(event.at) || '—'}</span>
            <span className={TCC_YF}>{event.label}</span>
          </div>
        ))}
        {!events.length ? (
          <p className={TCC_MUTED}>Kayıtlı durum geçmişi yok. Sahte timeline üretilmez.</p>
        ) : null}
      </div>
    </section>
  )
}
