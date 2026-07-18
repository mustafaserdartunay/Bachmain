export default function ProductionActivityTimeline({ activities = [], className = '' }) {
  const rows = Array.isArray(activities) ? [...activities].reverse() : []

  if (!rows.length) {
    return (
      <div className={`rounded-2xl border border-dashed border-[var(--border)] bg-white/40 px-4 py-6 text-center ${className}`.trim()}>
        <p className="text-[13px] font-semibold text-[var(--muted)]">Henüz süreç günlüğü yok.</p>
      </div>
    )
  }

  return (
    <ol className={`space-y-0 ${className}`.trim()}>
      {rows.map((item, index) => {
        const rawDate = String(item.date || '')
        const timeMatch = rawDate.match(/(\d{1,2}:\d{2})/)
        const timeLabel = timeMatch ? timeMatch[1] : rawDate.slice(0, 16) || '—'
        const isLast = index === rows.length - 1

        return (
          <li key={item.id || `${item.date}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast ? (
              <span className="absolute left-[7px] top-3 bottom-0 w-px bg-[rgba(140,145,165,0.25)]" aria-hidden />
            ) : null}
            <span className="relative z-[1] mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--bach-sky,#79a6d2)] bg-white" />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[12px] font-bold tabular-nums text-[var(--bach-sky,#79a6d2)]">{timeLabel}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[var(--ink)]">{item.text || '—'}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
