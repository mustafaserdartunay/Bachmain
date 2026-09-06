import { lastSeenLabel } from '../../live/entities'
import { PERSONNEL_STATUS, DRIVER_STATUS, ENTITY_KINDS } from '../../live/constants'

const FILTERS = [
  { id: 'all', label: 'Hepsi' },
  { id: 'personnel', label: 'Personel' },
  { id: 'driver', label: 'Sürücü' },
  { id: 'vehicle', label: 'Araç' },
  { id: 'delivery', label: 'Teslimat' },
  { id: 'offline', label: 'Çevrimdışı' },
  { id: 'delayed', label: 'Geciken' },
  { id: 'on_task', label: 'Durakta' },
  { id: 'active', label: 'Hareket halinde' },
  { id: 'waiting', label: 'Boşta' },
]

const LAYERS = [
  { id: 'personnel', label: 'Personel' },
  { id: 'driver', label: 'Sürücü' },
  { id: 'vehicle', label: 'Araç' },
  { id: 'delivery', label: 'Teslimatlar' },
  { id: 'customer', label: 'Müşteriler' },
  { id: 'geofence', label: 'Geofences' },
  { id: 'route', label: 'Rotalar' },
]

export default function LiveOpsPanel({
  query,
  onQuery,
  filter,
  onFilter,
  layers,
  onToggleLayer,
  entities,
  selectedId,
  onSelect,
  usingDemo,
}) {
  return (
    <aside className="live-ops__panel">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">
            Live Operations
          </p>
          <h2 className="text-sm font-black">Operasyon merkezi</h2>
        </div>
        <span className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-400">
          <span className="live-ops__pulse" /> Canlı
        </span>
      </div>
      {usingDemo ? (
        <p className="mt-2 text-[11px] text-amber-300">Demo senaryosu — İstanbul sahte hareket.</p>
      ) : null}
      <input
        className="live-ops__search mt-3"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Personel, sürücü, araç, müşteri, sipariş ara..."
      />
      <div className="live-ops__chips">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`live-ops__chip ${filter === item.id ? 'is-on' : ''}`}
            onClick={() => onFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
        Katmanlar
      </p>
      <div className="live-ops__chips">
        {LAYERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`live-ops__chip ${layers[item.id] !== false ? 'is-on' : ''}`}
            onClick={() => onToggleLayer(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="live-ops__list mt-2">
        {entities.length ? (
          entities.map((row) => {
            const status = PERSONNEL_STATUS[row.status] ||
              DRIVER_STATUS[row.status] || { label: row.status }
            return (
              <button
                key={row.id}
                type="button"
                className={`live-ops__row ${selectedId === row.id ? 'is-on' : ''}`}
                onClick={() => onSelect(row.id)}
              >
                <span>{ENTITY_KINDS[row.kind]?.icon || '•'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{row.name}</span>
                  <span className="block truncate text-[11px] text-[var(--muted)]">
                    {status.label} · {lastSeenLabel(row.updatedAt)}
                  </span>
                </span>
              </button>
            )
          })
        ) : (
          <p className="live-ops__empty">Henüz canlı takip edilecek kayıt bulunmuyor.</p>
        )}
      </div>
    </aside>
  )
}
