import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Trash2, ChevronDown } from 'lucide-react'
import {
  DELETED_RECORDS_EVENT,
  getDeletedRecords,
  restoreDeletedRecord,
} from '../../utils/deletedRecordsStore'
import { APP_ICON_WRAP_CLASS, APP_LABEL_CLASS, APP_METRIC_ROW_CLASS, APP_SUBLABEL_CLASS } from '../../utils/dashboardDesign'

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('tr-TR')
  } catch {
    return value
  }
}

/**
 * User-visible "Silinenler" list with restore — backed by erlenbox-deleted-records.
 */
export default function DeletedRecordsPanel({
  title = 'Silinenler',
  collection,
  onRestore,
  emptyMessage = 'Silinen kayıt yok.',
}) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    function refresh() {
      setVersion((current) => current + 1)
    }
    window.addEventListener(DELETED_RECORDS_EVENT, refresh)
    return () => window.removeEventListener(DELETED_RECORDS_EVENT, refresh)
  }, [])

  const entries = useMemo(() => getDeletedRecords(collection), [collection, version])

  function handleRestore(entry) {
    const record = restoreDeletedRecord(collection, entry.record?.id)
    if (!record) return
    if (typeof onRestore === 'function') onRestore(record, entry)
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
          <span className={`${APP_ICON_WRAP_CLASS} text-rose-500`}>
            <Trash2 className="h-3.5 w-3.5" />
          </span>
          <span className={APP_LABEL_CLASS}>{title}</span>
          <span className="badge badge-red shrink-0 !px-2 !py-0.5 !text-[12px]">{entries.length}</span>
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
              {entries.map((entry) => (
                <div key={entry.record?.id || entry.deletedAt} className={`${APP_METRIC_ROW_CLASS} items-center`}>
                  <span className={`${APP_ICON_WRAP_CLASS} text-rose-500`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`${APP_LABEL_CLASS} text-[var(--ink)]`}>
                      {entry.entityLabel || entry.record?.id}
                    </p>
                    <p className={APP_SUBLABEL_CLASS}>
                      Silindi · {formatWhen(entry.deletedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(entry)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-[11px] font-black uppercase text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Geri Yükle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
