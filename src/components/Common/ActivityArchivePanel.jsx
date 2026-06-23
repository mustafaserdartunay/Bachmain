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

export default function ActivityArchivePanel({
  title = 'Arşiv ve İşlem Geçmişi',
  modules = [],
  actions = ['archive', 'delete', 'restore'],
  onRestore,
  emptyMessage = 'Henüz arşiv veya işlem kaydı yok.',
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
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-dark-700/30"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-amber-300">
            <Archive className="h-4 w-4" />
          </span>
          <span className="text-sm font-black uppercase tracking-wide text-gray-200">{title}</span>
          <span className="rounded-lg bg-dark-700/70 px-2 py-0.5 text-[11px] font-black text-gray-400">{entries.length}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-dark-500/40 p-5">
          {entries.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-dark-500/50 bg-dark-700/25 px-4 py-8 text-center text-xs font-semibold text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const canRestore = Boolean(entry.snapshot) && !entry.restoredAt && typeof onRestore === 'function'
                return (
                  <div key={entry.id} className="flex items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/35 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dark-700/70 text-amber-300">
                      <Clock3 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-200">
                        {entry.entityLabel || getActivityActionLabel(entry.action)}
                      </p>
                      <p className="truncate text-xs font-semibold text-gray-500">
                        {getActivityModuleLabel(entry.module)} · {getActivityActionLabel(entry.action)} · {formatActivityArchiveDate(entry.at)}
                      </p>
                      {entry.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs font-medium text-gray-500">{entry.description}</p>
                      )}
                      {entry.restoredAt && (
                        <p className="mt-0.5 text-[11px] font-black text-emerald-300">
                          Geri alındı: {formatActivityArchiveDate(entry.restoredAt)}
                        </p>
                      )}
                    </div>
                    {canRestore && (
                      <button
                        type="button"
                        onClick={() => handleRestore(entry)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-300 transition-colors hover:bg-emerald-500/20"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Geri Al
                      </button>
                    )}
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
