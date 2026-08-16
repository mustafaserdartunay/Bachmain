import { useState } from 'react'
import { ChevronDown, Clock, History } from 'lucide-react'
import { APP_PANEL_TITLE_CLASS, YF_TEXT_CLASS } from '../../utils/dashboardDesign'

export default function DocumentActivityPanel({
  activities = [],
  isOpen: controlledOpen,
  onToggle,
  title = 'Aktivite Geçmişi',
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = typeof controlledOpen === 'boolean'
  const open = isControlled ? controlledOpen : uncontrolledOpen

  function handleToggle() {
    if (isControlled) onToggle?.()
    else setUncontrolledOpen((current) => !current)
  }

  const rows = [...activities].reverse()

  return (
    <section className="card customer-list-panel overflow-hidden p-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-opacity hover:opacity-90"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--search-border)] bg-transparent text-[#2563eb]">
            <History className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className={`${APP_PANEL_TITLE_CLASS} !font-bold uppercase tracking-wide`}>{title}</span>
          <span className="rounded-lg border border-[var(--search-border)] bg-transparent px-2 py-0.5 text-[13px] font-bold text-[var(--muted)]">
            {activities.length}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.25}
        />
      </button>

      {open ? (
        <div className="border-t border-[var(--search-border)] px-5 py-5">
          {rows.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--search-border)] px-4 py-8 text-center text-[14px] font-normal text-[var(--muted)]">
              Henüz bir işlem yapılmadı. Yaptığınız değişiklikler tarih, saat ve kullanıcı bilgisiyle
              burada listelenecek.
            </div>
          ) : (
            <ol className="relative space-y-3 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-[var(--search-border)]">
              {rows.map((activity, index) => {
                const key = activity.id || `${activity.date || 'act'}-${index}`
                return (
                  <li key={key} className="relative flex items-start gap-3 pl-6">
                    <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-[#2563eb] bg-[var(--glass-bg,var(--app-bg))]" />
                    <div className="document-frame-only min-w-0 flex-1 rounded-2xl border border-[var(--search-border)] bg-transparent px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="customer-name-primary min-w-0 truncate uppercase tracking-wide">
                          {activity.text || '-'}
                        </span>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap ${YF_TEXT_CLASS}`}
                        >
                          <Clock className="h-3 w-3" strokeWidth={2.25} />
                          {activity.date || '-'}
                        </span>
                      </div>
                      {activity.detail ? (
                        <p className="customer-name-secondary mt-0.5 truncate">{activity.detail}</p>
                      ) : null}
                      {activity.user ? (
                        <p className="mt-1 text-[13px] font-bold text-[#2563eb]">{activity.user}</p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  )
}
