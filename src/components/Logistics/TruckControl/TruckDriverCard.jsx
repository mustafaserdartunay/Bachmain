import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'
import TruckContactActions from './TruckContactActions'

export default function TruckDriverCard({ driver, stats, plate, vehicle }) {
  const d = driver || {}
  const shipment = stats?.shipment || {}
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className={`${TCC_YFB} mb-3 uppercase`}>Şoför</p>
      <div className="flex items-start gap-3">
        {d.photoUrl ? (
          <img src={d.photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(37,99,235,0.12)] text-[18px]"
            aria-hidden
          >
            👤
          </div>
        )}
        <div className="min-w-0">
          <p className={`${TCC_YFB} text-[var(--ink)]`}>{d.name || 'Şoför atanmadı'}</p>
          <p className={TCC_MUTED}>{d.phone || '—'}</p>
          <p className={TCC_MUTED}>{d.email || '—'}</p>
          <p className={TCC_MUTED}>Personel ID: {d.employeeNo || d.id || '—'}</p>
          <p className={TCC_MUTED}>Durum: {d.status || '—'}</p>
          <p className={TCC_MUTED}>
            Araç: {plate || d.plate || '—'} {vehicle?.model || ''}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <TruckContactActions phone={d.phone} name={d.name} />
      </div>
      <div className="mt-4">
        <p className={`${TCC_YFB} mb-1 uppercase`}>Bu sevkiyat</p>
        <p className={TCC_YF}>
          Teslimat: {shipment.delivered || 0} / {shipment.total || 0} · Zamanında:{' '}
          {shipment.onTime ?? '—'} · Geciken: {shipment.delayed || 0} · Başarısız:{' '}
          {shipment.failed || 0}
        </p>
        {stats?.overall ? (
          <p className={`${TCC_MUTED} mt-2`}>
            Genel:{' '}
            {stats.overall.totalShipments != null
              ? `${stats.overall.totalShipments} sevkiyat`
              : 'kayıt yok'}
            {stats.overall.totalKm != null ? ` · ${stats.overall.totalKm} km` : ''}
          </p>
        ) : (
          <p className={`${TCC_MUTED} mt-2`}>
            Genel performans verisi yok. Sahte istatistik gösterilmiyor.
          </p>
        )}
      </div>
    </section>
  )
}
