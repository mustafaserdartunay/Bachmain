import { Link } from 'react-router-dom'
import { lastSeenLabel } from '../../live/entities'
import { PERSONNEL_STATUS, DRIVER_STATUS } from '../../live/constants'

export default function LiveDetailPanel({ entity, onShowRoute, onClose }) {
  if (!entity) {
    return (
      <aside className="live-ops__detail hidden lg:block">
        <p className="live-ops__empty">Haritadan bir kayıt seçin.</p>
      </aside>
    )
  }

  const status = PERSONNEL_STATUS[entity.status] ||
    DRIVER_STATUS[entity.status] || { label: entity.status }
  const speed = Number(entity.speed)
  const speedLabel = Number.isFinite(speed) ? `${Math.round(speed * 3.6)} km/h` : '—'

  return (
    <aside className="live-ops__detail">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black">{entity.name}</h3>
          <p className="text-xs text-[var(--muted)]">{entity.subtitle || entity.kind}</p>
        </div>
        <button type="button" className="text-xs font-bold text-[var(--muted)]" onClick={onClose}>
          Kapat
        </button>
      </div>
      <p className="mt-3 text-sm font-bold text-emerald-400">{status.label}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-[11px] uppercase text-[var(--muted)]">Konum</dt>
          <dd>
            {entity.lat?.toFixed?.(5)}, {entity.lng?.toFixed?.(5)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase text-[var(--muted)]">Son güncelleme</dt>
          <dd>{lastSeenLabel(entity.updatedAt)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase text-[var(--muted)]">Hız</dt>
          <dd>{speedLabel}</dd>
        </div>
        {entity.task ? (
          <div>
            <dt className="text-[11px] uppercase text-[var(--muted)]">Görev</dt>
            <dd>{entity.task}</dd>
          </div>
        ) : null}
        {entity.nextStop ? (
          <div>
            <dt className="text-[11px] uppercase text-[var(--muted)]">Sonraki durak</dt>
            <dd>{entity.nextStop}</dd>
          </div>
        ) : null}
        {entity.etaClock ? (
          <div>
            <dt className="text-[11px] uppercase text-[var(--muted)]">ETA</dt>
            <dd>
              {entity.etaClock}
              {entity.remainingMin != null ? ` · ${entity.remainingMin} dk` : ''}
              {entity.distanceKm != null ? ` · ${entity.distanceKm} km` : ''}
            </dd>
          </div>
        ) : null}
        {entity.offRoute ? <p className="text-amber-300">Rota dışına çıktı</p> : null}
        {entity.delayed ? <p className="text-orange-300">Teslimat gecikmiş</p> : null}
      </dl>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="btn-ghost !justify-center"
          onClick={() => onShowRoute(entity)}
        >
          Rotayı göster
        </button>
        <Link to={`/ik/harita`} className="btn-ghost !justify-center">
          Geçmişi gör
        </Link>
        <Link to="/ik/gorevler" className="btn-ghost !justify-center">
          Göreve git
        </Link>
        <Link to="/mesajlar" className="btn-ghost !justify-center">
          Mesaj gönder
        </Link>
      </div>
    </aside>
  )
}
