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
  SP_BODY_CLASS,
  SP_CHEVRON_CLASS,
  SP_EMPTY_CLASS,
  SP_HEADER_BUTTON_CLASS,
  SP_PANEL_SHELL_CLASS,
  SP_ROW_ACTIONS_CLASS,
  SP_ROW_CLASS,
  SP_ROW_DETAILS_CLASS,
  SP_ROW_LIST_CLASS,
  SP_ROW_META_CLASS,
  SP_ROW_TITLE_CLASS,
} from '../../utils/dashboardDesign'
import {
  COP_KUTUSU_BUTTON_CLASS,
  COP_KUTUSU_ICON_CLASS,
  GERI_YUKLE_BUTTON_CLASS,
  GERI_YUKLE_ICON_CLASS,
} from '../../utils/buttonStyles'
import { DeleteConfirmOverlay } from './ListDeleteConfirmPanel'

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
    <section className={`${SP_PANEL_SHELL_CLASS} ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={SP_HEADER_BUTTON_CLASS}
      >
        <span className="flex min-w-0 items-center gap-2">
          <RedPingDot />
          <span className={APP_LABEL_CLASS}>{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className={`${APP_LABEL_CLASS} shrink-0`}>{entries.length} Kayıt</span>
          <ChevronDown className={`${SP_CHEVRON_CLASS} ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open ? (
        <div className={SP_BODY_CLASS}>
          {entries.length === 0 ? (
            <div className={SP_EMPTY_CLASS}>{emptyMessage}</div>
          ) : (
            <div className={SP_ROW_LIST_CLASS}>
              {entries.map((item) => {
                const isArchived = item.kind === 'archived'
                const details = customerDetails(item.record)
                return (
                  <div key={item.id} className={SP_ROW_CLASS}>
                    <RedPingDot />
                    <div className="min-w-0 flex-1">
                      <p className={SP_ROW_TITLE_CLASS}>{item.label}</p>
                      <p className={SP_ROW_META_CLASS}>
                        {isArchived ? 'Arşivlendi' : 'Silindi'} · {formatWhen(item.at)}
                      </p>
                      {details.length ? (
                        <p className={SP_ROW_DETAILS_CLASS}>{details.join(' · ')}</p>
                      ) : null}
                    </div>
                    <div className={SP_ROW_ACTIONS_CLASS}>
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        className={GERI_YUKLE_BUTTON_CLASS}
                      >
                        <RotateCcw className={GERI_YUKLE_ICON_CLASS} /> Geri Yükle
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingPermanentDelete(item)}
                        className={`customer-permanent-delete-action ${COP_KUTUSU_BUTTON_CLASS}`}
                        aria-label={`${item.label} kalıcı olarak sil`}
                        title="Sil"
                      >
                        <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      <DeleteConfirmOverlay
        open={Boolean(pendingPermanentDelete)}
        title="Kayıt kalıcı olarak silinsin mi?"
        description={`${pendingPermanentDelete?.label || 'Bu kayıt'} tüm detaylarıyla kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingPermanentDelete(null)}
        onConfirm={() => handlePermanentDelete(pendingPermanentDelete)}
      />
    </section>
  )
}
