import { TCC_MUTED, TCC_YF, TCC_YFB, toneClass } from './truckControlUi'

export default function TruckRouteTimeline({ origin, stops, onSelectStop, selectedId }) {
  const rows = [
    origin
      ? {
          id: 'origin',
          seq: '0',
          label: origin.label || 'Çıkış',
          meta: 'Başlangıç',
          statusTone: 'muted',
        }
      : null,
    ...stops.map((stop) => ({
      id: stop.id,
      seq: String(stop.seq).padStart(2, '0'),
      label: stop.customerLabel,
      meta: stop.city || stop.address,
      status: stop.statusLabel,
      statusTone: stop.statusTone,
    })),
  ].filter(Boolean)

  return (
    <div className="space-y-2">
      <p className={`${TCC_YFB} uppercase`}>Rota</p>
      {rows.map((row, index) => (
        <button
          key={row.id}
          type="button"
          onClick={() => row.id !== 'origin' && onSelectStop?.(stops.find((s) => s.id === row.id))}
          className={`flex w-full items-start gap-2 rounded-xl px-1 py-1 text-left transition-transform hover:translate-x-0.5 ${selectedId === row.id ? 'bg-white/30' : ''}`}
        >
          <span className={`${TCC_YFB} w-6 shrink-0 text-[var(--ink)]`}>
            {row.seq === '0' ? '●' : row.seq}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`${TCC_YF} block text-[var(--ink)]`}>{row.label}</span>
            <span className={`${TCC_MUTED} block truncate`}>{row.meta}</span>
            {row.status ? (
              <span className={`${TCC_MUTED} ${toneClass(row.statusTone)}`}>{row.status}</span>
            ) : null}
            {index < rows.length - 1 ? <span className={`${TCC_MUTED} block`}>↓</span> : null}
          </span>
        </button>
      ))}
      {!rows.length ? <p className={TCC_MUTED}>Durak yok.</p> : null}
    </div>
  )
}
