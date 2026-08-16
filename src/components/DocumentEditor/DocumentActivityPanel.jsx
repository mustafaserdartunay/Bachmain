import { ChevronRight, Clock } from 'lucide-react'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { APP_PANEL_TITLE_CLASS, YF_TEXT_CLASS } from '../../utils/dashboardDesign'

export default function DocumentActivityPanel({
  activities = [],
  isOpen,
  onToggle,
  title = 'Aktivite Geçmişi',
}) {
  const countLabel = `${activities.length} Kayıt`

  return (
    <section className="card customer-list-panel px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        className="mb-0 flex w-full min-w-0 items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <AppPanelDot color="blue" />
          <h2 className={APP_PANEL_TITLE_CLASS}>{title} :</h2>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>{countLabel}</span>
        </div>
        <span className="glass-sidebar-toggle flex h-8 w-8 items-center justify-center rounded-xl">
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            strokeWidth={2.25}
          />
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 max-h-80 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--search-border)] px-4 py-8 text-center text-[14px] font-normal text-[var(--muted)]">
              Henüz bir işlem yapılmadı. Yaptığınız değişiklikler burada listelenecek.
            </div>
          ) : (
            <ol className="relative space-y-3 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-[var(--search-border)]">
              {[...activities].reverse().map((activity, index) => (
                <li
                  key={activity.id || `${activity.date}-${index}`}
                  className="relative flex items-start gap-3 pl-6"
                >
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#2563eb] bg-[var(--glass-bg,var(--app-bg))]" />
                  <div className="document-frame-only min-w-0 flex-1 rounded-xl border border-[var(--search-border)] bg-transparent px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="customer-name-primary min-w-0 truncate">
                        {activity.text || '—'}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 ${YF_TEXT_CLASS}`}
                      >
                        <Clock className="h-3.5 w-3.5" strokeWidth={2.25} />
                        {activity.date || '—'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
