import { useEffect, useMemo, useState } from 'react'
import { Archive, ChevronDown, RotateCcw, Trash2 } from 'lucide-react'
import { DELETED_RECORDS_EVENT, getDeletedRecords } from '../../utils/deletedRecordsStore'
import {
  getArchivedCustomers,
  restoreCustomer,
  restoreDeletedCustomer,
} from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import {
  getCustomerMetaSelection,
  matchesPartyListFilter,
  readCustomerMeta,
} from '../../utils/customerMeta'
import {
  APP_ICON_WRAP_CLASS,
  APP_LABEL_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_SUBLABEL_CLASS,
} from '../../utils/dashboardDesign'

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return value
  }
}

/**
 * Müşteriler / Tedarikçiler — silinen + arşivlenen kayıtlar (geri yükleme).
 * Yalnızca müşteri profili silme/arşiv akışından beslenir.
 */
export default function CustomerDeletedArchivedPanel({
  title = 'Silinenler ve Arşivlenenler',
  listKind = 'customer',
  onRestored,
  emptyMessage = 'Silinen veya arşivlenen kayıt yok.',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    function refresh() {
      setVersion((current) => current + 1)
    }
    window.addEventListener(DELETED_RECORDS_EVENT, refresh)
    window.addEventListener('bach:customers-updated', refresh)
    window.addEventListener('bach:customer-meta-updated', refresh)
    return () => {
      window.removeEventListener(DELETED_RECORDS_EVENT, refresh)
      window.removeEventListener('bach:customers-updated', refresh)
      window.removeEventListener('bach:customer-meta-updated', refresh)
    }
  }, [])

  const entries = useMemo(() => {
    void version
    const meta = readCustomerMeta()
    const deleted = getDeletedRecords('customers').map((entry) => {
      const record = entry.record
      return {
        id: `deleted-${record?.id || entry.deletedAt}`,
        kind: 'deleted',
        record,
        label:
          entry.entityLabel ||
          getCustomerDisplay(record || {}).brandShortName ||
          record?.company ||
          record?.id,
        at: entry.deletedAt,
      }
    })
    const archived = getArchivedCustomers().map((entry) => {
      const record = entry.customer
      return {
        id: `archived-${record?.id || entry.archivedAt}`,
        kind: 'archived',
        record,
        label: getCustomerDisplay(record || {}).brandShortName || record?.company || record?.id,
        at: entry.archivedAt,
      }
    })

    return [...deleted, ...archived]
      .filter((item) => {
        if (!item.record?.id) return false
        const settings = meta[item.record.id] || {}
        const selected = getCustomerMetaSelection(item.record, settings)
        return matchesPartyListFilter(selected.type, listKind)
      })
      .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  }, [listKind, version])

  function handleRestore(item) {
    if (!item?.record?.id) return
    if (item.kind === 'archived') {
      restoreCustomer(item.record.id)
    } else {
      restoreDeletedCustomer(item.record)
    }
    onRestored?.(item.record, item)
    setVersion((current) => current + 1)
  }

  return (
    <section className={`card overflow-hidden p-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[4.75rem] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/35"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`${APP_ICON_WRAP_CLASS} text-rose-500`}>
            <Trash2 className="h-3.5 w-3.5" />
          </span>
          <span className={APP_LABEL_CLASS}>{title}</span>
          <span className="badge badge-red shrink-0 !px-2 !py-0.5 !text-[12px]">
            {entries.length}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="border-t border-white/50 px-4 py-3">
          {entries.length === 0 ? (
            <div className="glass-inset px-4 py-8 text-center text-[12px] font-semibold text-[var(--muted)]">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((item) => {
                const isArchived = item.kind === 'archived'
                return (
                  <div key={item.id} className={`${APP_METRIC_ROW_CLASS} items-center`}>
                    <span
                      className={`${APP_ICON_WRAP_CLASS} ${isArchived ? 'text-amber-600' : 'text-rose-500'}`}
                    >
                      {isArchived ? (
                        <Archive className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`${APP_LABEL_CLASS} text-[var(--ink)]`}>{item.label}</p>
                      <p className={APP_SUBLABEL_CLASS}>
                        {isArchived ? 'Arşivlendi' : 'Silindi'} · {formatWhen(item.at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-[11px] font-black uppercase text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Geri Yükle
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
