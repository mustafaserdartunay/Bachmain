const TABS = [
  { id: 'Tümü', label: 'Tümü' },
  { id: 'Devam Eden', label: 'Devam Eden' },
  { id: 'Tamamlanan', label: 'Tamamlanan' },
  { id: 'Beklemede', label: 'Beklemede' },
  { id: 'İptal', label: 'İptal' },
]

export { TABS as PRODUCTION_STATUS_TABS }

export default function ProductionStatusTabs({ value = 'Tümü', onChange, counts = {} }) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="tablist"
      aria-label="Üretim durumu filtreleri"
    >
      {TABS.map((tab) => {
        const active = value === tab.id
        const count = counts[tab.id]
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition-all duration-200 ${
              active
                ? 'bg-[var(--accent,#2563EB)] text-white shadow-[0_6px_16px_rgba(37,99,235,0.28)] scale-[1.02]'
                : 'bg-[var(--surface-raised,#F8FAFC)] text-[var(--muted,#64748B)] ring-1 ring-[var(--border,#E2E8F0)] hover:bg-white hover:text-[var(--ink,#0F172A)]'
            }`}
          >
            {tab.label}
            {typeof count === 'number' ? (
              <span
                className={`tabular-nums text-[11px] ${
                  active ? 'text-white/80' : 'text-[var(--muted,#94A3B8)]'
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
