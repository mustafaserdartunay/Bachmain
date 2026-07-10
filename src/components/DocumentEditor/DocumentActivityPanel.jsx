import { ChevronRight } from 'lucide-react'

export default function DocumentActivityPanel({
  activities = [],
  isOpen,
  onToggle,
  title = 'Aktivite Geçmişi',
  variant = 'card',
}) {
  const shellClass = variant === 'card'
    ? 'card'
    : 'rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow)]'

  return (
    <section className={shellClass}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-sm font-black text-[var(--text-strong)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {activities.length} kayıt
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)] transition-all hover:border-[var(--accent)]/40 hover:text-[var(--text-strong)]">
          <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={activity.id || `${activity.date}-${index}`}
              className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Tarih</p>
                <p className="mt-1 text-[13px] font-semibold tabular-nums text-[var(--accent)]">{activity.date || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Detay</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--text-strong)]">{activity.text || '—'}</p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center text-sm text-[var(--text-muted)]">
              Henüz aktivite kaydı yok.
            </div>
          )}
        </div>
      )}
    </section>
  )
}
