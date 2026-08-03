import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, RotateCcw, Trash2 } from 'lucide-react'
import { DELETED_RECORDS_EVENT, getDeletedRecords } from '../../utils/deletedRecordsStore'
import {
  getArchivedCustomers,
  permanentlyDeleteCustomer,
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
  APP_LABEL_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_SUBLABEL_CLASS,
  APP_SURFACE_PANEL_CLASS,
} from '../../utils/dashboardDesign'
import ConfirmModal from './ConfirmModal'

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

function customerDetails(record = {}) {
  const display = getCustomerDisplay(record)
  return [
    display.companyTitle && display.companyTitle !== display.brandShortName
      ? display.companyTitle
      : null,
    record.contact ? `Yetkili: ${record.contact}` : null,
    record.email ? `E-posta: ${record.email}` : null,
    record.phone ? `Telefon: ${record.phone}` : null,
    record.taxNo || record.vkn ? `Vergi No: ${record.taxNo || record.vkn}` : null,
    [record.district, record.city].filter(Boolean).join(' / ') || null,
  ].filter(Boolean)
}

function RedPingDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-50" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
    </span>
  )
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
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState(null)

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

  function handlePermanentDelete(item) {
    if (!item?.record?.id) return
    permanentlyDeleteCustomer(item.record.id)
    setPendingPermanentDelete(null)
    setVersion((current) => current + 1)
  }

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[4.75rem] w-full items-center justify-between gap-3 bg-transparent px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <RedPingDot />
          <span className={APP_LABEL_CLASS}>{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className={`${APP_LABEL_CLASS} shrink-0`}>{entries.length} Kayıt</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open ? (
        <div className="border-t border-[var(--glass-border)] bg-transparent px-4 py-3">
          {entries.length === 0 ? (
            <div className="bg-transparent px-4 py-8 text-center text-[12px] font-normal text-[var(--muted)]">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((item) => {
                const isArchived = item.kind === 'archived'
                const details = customerDetails(item.record)
                return (
                  <div
                    key={item.id}
                    className={`${APP_METRIC_ROW_CLASS} flex-col !items-stretch gap-3 sm:flex-row sm:!items-center`}
                  >
                    <RedPingDot />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold leading-tight text-[var(--ink)]">
                        {item.label}
                      </p>
                      <p className={`${APP_SUBLABEL_CLASS} mt-1`}>
                        {isArchived ? 'Arşivlendi' : 'Silindi'} · {formatWhen(item.at)}
                      </p>
                      {details.length ? (
                        <p className="mt-1 text-[11px] font-normal leading-relaxed text-[var(--muted)]">
                          {details.join(' · ')}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        className="customer-restore-action inline-flex items-center gap-1.5 rounded-lg bg-[rgba(37,99,235,0.16)] px-2.5 py-1.5 text-[14px] font-normal leading-tight text-blue-600 transition-[transform,background-color,color] hover:scale-110 hover:bg-[rgba(37,99,235,0.22)] hover:text-blue-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Geri Yükle
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingPermanentDelete(item)}
                        className="customer-permanent-delete-action inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 p-1 text-red-500 transition-[transform,background-color,color] hover:scale-110 hover:bg-red-500/25 hover:text-red-600"
                        aria-label={`${item.label} kalıcı olarak sil`}
                        title="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingPermanentDelete)}
        title="Kayıt kalıcı olarak silinsin mi?"
        description={`${pendingPermanentDelete?.label || 'Bu kayıt'} tüm detaylarıyla kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="Hayır"
        onCancel={() => setPendingPermanentDelete(null)}
        onConfirm={() => handlePermanentDelete(pendingPermanentDelete)}
      />
    </section>
  )
}
