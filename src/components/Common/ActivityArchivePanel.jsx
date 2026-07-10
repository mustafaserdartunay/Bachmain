import { useEffect, useMemo, useState } from 'react'
import { Archive, ChevronDown, Clock3, RotateCcw } from 'lucide-react'
import {
  ACTIVITY_ARCHIVE_EVENT,
  filterActivityEntries,
  formatActivityArchiveDate,
  getActivityActionLabel,
  getActivityModuleLabel,
  markActivityEntryRestored,
} from '../../utils/activityArchiveStore'
import { APP_ICON_WRAP_CLASS, APP_LABEL_CLASS, APP_METRIC_ROW_CLASS, APP_SUBLABEL_CLASS } from '../../utils/dashboardDesign'

export default function ActivityArchivePanel({
  title = 'Arşiv ve İşlem Geçmişi',
  modules = [],
  actions = ['archive', 'delete', 'restore'],
  onRestore,
  emptyMessage = 'Henüz arşiv veya silme kaydı yok.',
}) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    function refresh() {
      setVersion((current) => current + 1)
    }
    window.addEventListener(ACTIVITY_ARCHIVE_EVENT, refresh)
    return () => window.removeEventListener(ACTIVITY_ARCHIVE_EVENT, refresh)
  }, [])

  const entries = useMemo(
    () => filterActivityEntries({ modules, actions }).slice(0, 80),
    [actions.join('|'), modules.join('|'), version],
  )

  async function handleRestore(entry) {
    if (!entry.snapshot || entry.restoredAt || typeof onRestore !== 'function') return
    const restored = await onRestore(entry)
    if (restored === false) return
    markActivityEntryRestored(entry.id)
    setVersion((current) => current + 1)
  }

  return (
    <section className="card overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/35"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`${APP_ICON_WRAP_CLASS} text-amber-600`}>
            <Archive className="h-3.5 w-3.5" />
          </span>
          <span className={APP_LABEL_CLASS}>{title}</span>
          <span className="badge badge-orange shrink-0 !px-2 !py-0.5 !text-[12px]">{entries.length}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-white/50 px-4 py-3">
          {entries.length === 0 ? (
            <div className="glass-inset px-4 py-8 text-center text-[12px] font-semibold text-[var(--muted)]">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => {
                const canRestore = Boolean(entry.snapshot) && !entry.restoredAt && typeof onRestore === 'function'
                return (
                  <div key={entry.id} className={`${APP_METRIC_ROW_CLASS} items-start`}>
                    <span className={`${APP_ICON_WRAP_CLASS} text-amber-600`}>
                      <Clock3 className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`${APP_LABEL_CLASS} text-[var(--ink)]`}>
                        {entry.entityLabel || getActivityActionLabel(entry.action)}
                      </p>
                      <p className={APP_SUBLABEL_CLASS}>
                        {getActivityModuleLabel(entry.module)} · {getActivityActionLabel(entry.action)} · {formatActivityArchiveDate(entry.at)}
                      </p>
                      {entry.restoredAt ? (
                        <p className={`${APP_SUBLABEL_CLASS} text-emerald-600`}>Geri alındı</p>
                      ) : null}
                    </div>
                    {canRestore ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(entry)}
                        className="btn-ghost shrink-0 !px-2.5 !py-1.5 text-[12px] font-bold"
                      >
                        <RotateCcw className="mr-1 inline h-3 w-3" />
                        Geri Al
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
