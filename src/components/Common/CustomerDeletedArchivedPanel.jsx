import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, RotateCcw, Trash2 } from 'lucide-react'
import { DELETED_RECORDS_EVENT, getDeletedRecords } from '../../utils/deletedRecordsStore'
import {
  getArchivedCustomers,
  purgeCustomerRecycleEntry,
  restoreCustomer,
  restoreDeletedCustomer,
} from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import {
  getCustomerMetaSelection,
  matchesPartyListFilter,
  readCustomerMeta,
} from '../../utils/customerMeta'
import { APP_LABEL_CLASS, APP_SUBLABEL_CLASS } from '../../utils/dashboardDesign'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { DeleteConfirmPopover, DELETE_TRASH_BUTTON_CLASS } from './ListDeleteConfirmPanel'

const ROW_CLASS =
  'relative flex w-full min-h-[2.5625rem] items-center justify-between gap-2 bg-transparent px-2 py-1.5 text-left'
const RESTORE_BTN_CLASS =
  'inline-flex h-8 min-h-8 items-center justify-center gap-1.5 rounded-xl border border-current bg-transparent px-3 text-xs font-extrabold uppercase text-gray-300 transition-colors hover:bg-[var(--ds-surface-muted)] hover:text-gray-200'

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
 * Müşteriler / Tedarikçiler — silinen + arşivlenen kayıtlar (geri yükleme / kalıcı silme).
 */
export default function CustomerDeletedArchivedPanel({
  title = 'Silinenler ve Arşivlenenler',
  listKind = 'customer',
  onRestored,
  emptyMessage = 'Silinen veya arşivlenen kayıt yok.',
}) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [pendingPurgeId, setPendingPurgeId] = useState(null)

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
    setPendingPurgeId(null)
    setVersion((current) => current + 1)
  }

  function handlePurge(item) {
    if (!item?.record?.id) return
    purgeCustomerRecycleEntry(item.record.id, item.kind)
    setPendingPurgeId(null)
    setVersion((current) => current + 1)
  }

  return (
    <section className="app-page-header !min-h-0 overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <AppPanelDot color="rose" />
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
            <div className="px-4 py-8 text-center text-xs font-extrabold text-[var(--muted)]">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((item) => {
                const isArchived = item.kind === 'archived'
                const confirming = pendingPurgeId === item.id
                return (
                  <div key={item.id} className={ROW_CLASS}>
                    <AppPanelDot color={isArchived ? 'amber' : 'rose'} />
                    <div className="min-w-0 flex-1">
                      <p className={`${APP_LABEL_CLASS} text-[var(--ink)]`}>{item.label}</p>
                      <p className={APP_SUBLABEL_CLASS}>
                        {isArchived ? 'Arşivlendi' : 'Silindi'} · {formatWhen(item.at)}
                      </p>
                    </div>
                    <div className="relative flex h-8 shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        className={RESTORE_BTN_CLASS}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Geri Yükle
                      </button>
                      <button
                        type="button"
                        className={`${DELETE_TRASH_BUTTON_CLASS} inline-flex h-8 w-8 min-h-8 items-center justify-center !p-0`}
                        aria-label="Kalıcı sil"
                        title="Kalıcı sil"
                        onClick={() =>
                          setPendingPurgeId((current) => (current === item.id ? null : item.id))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {confirming ? (
                        <DeleteConfirmPopover
                          title={`"${item.label}" kalıcı silinsin mi?`}
                          description="Bu işlem geri alınamaz."
                          confirmLabel="Evet"
                          cancelLabel="Hayır"
                          onConfirm={() => handlePurge(item)}
                          onCancel={() => setPendingPurgeId(null)}
                          className="absolute right-0 top-11 z-50 min-w-[18rem]"
                        />
                      ) : null}
                    </div>
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
