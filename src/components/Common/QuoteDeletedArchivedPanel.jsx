import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, RotateCcw, Trash2 } from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DELETED_RECORDS_EVENT, getDeletedRecords } from '../../utils/deletedRecordsStore'
import { permanentlyDeleteQuote, restoreDeletedQuote } from '../../utils/quotesStore'
import { getListCustomerDisplay } from '../../data/customerProfiles'
import { formatTL } from '../../utils/productPricing'
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
  YF_TEXT_CLASS,
} from '../../utils/dashboardDesign'
import {
  COP_KUTUSU_BUTTON_CLASS,
  COP_KUTUSU_ICON_CLASS,
  GERI_YUKLE_BUTTON_CLASS,
  GERI_YUKLE_ICON_CLASS,
} from '../../utils/buttonStyles'
import { DeleteConfirmOverlay, captureDeleteConfirmAnchor } from './ListDeleteConfirmPanel'

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

function quoteAmount(quote) {
  const candidates = [quote?.grandTotal, quote?.total, quote?.amount, quote?.amountNet]
  for (const value of candidates) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

function quoteDetails(record = {}) {
  const display = getListCustomerDisplay(record.customer)
  const amount = quoteAmount(record)
  return [
    record.id ? `Kod: ${record.id}` : null,
    display.companyTitle && display.companyTitle !== display.brandShortName
      ? display.companyTitle
      : null,
    record.status ? `Durum: ${record.status}` : null,
    amount ? `Tutar: ${formatTL(amount)}` : null,
    record.contact ? `Yetkili: ${record.contact}` : null,
  ].filter(Boolean)
}

function quoteTitle(record, fallbackLabel) {
  const display = getListCustomerDisplay(record?.customer)
  return (
    display.brandShortName ||
    record?.customer ||
    record?.title ||
    fallbackLabel ||
    record?.id ||
    'Teklif'
  )
}

function RedPingDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-50" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
    </span>
  )
}

const PERMANENT_DELETE_WARNING =
  'Bu kayıtlar silinenler / arşiv alanından kaldırılacak ve kullanıcı tarafından geri getirilemez.'

export default function QuoteDeletedArchivedPanel({
  title = 'Silinenler ve Arşivlenenler',
  onRestored,
  emptyMessage = 'Silinen teklif yok.',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState(null)
  const [deleteConfirmAnchor, setDeleteConfirmAnchor] = useState(null)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const bulkDeleteButtonRef = useRef(null)

  useEffect(() => {
    function refresh() {
      setVersion((current) => current + 1)
    }
    window.addEventListener(DELETED_RECORDS_EVENT, refresh)
    window.addEventListener('bach:quotes-updated', refresh)
    return () => {
      window.removeEventListener(DELETED_RECORDS_EVENT, refresh)
      window.removeEventListener('bach:quotes-updated', refresh)
    }
  }, [])

  const entries = useMemo(() => {
    void version
    return getDeletedRecords('quotes')
      .map((entry) => {
        const record = entry.record
        return {
          id: `deleted-${record?.id || entry.deletedAt}`,
          kind: 'deleted',
          record,
          label: quoteTitle(record, entry.entityLabel),
          at: entry.deletedAt,
        }
      })
      .filter((item) => item.record?.id)
      .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  }, [version])

  function exitBulkSelectMode() {
    setBulkSelectMode(false)
    setSelectedIds([])
    setPendingBulkDelete(false)
  }

  function toggleSelect(entryId) {
    const key = String(entryId)
    setSelectedIds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  function toggleSelectAll() {
    const keys = entries.map((item) => item.id)
    setSelectedIds((current) => {
      const allSelected = keys.length > 0 && keys.every((id) => current.includes(id))
      return allSelected ? [] : keys
    })
  }

  function handleRestore(item) {
    if (!item?.record?.id) return
    const restored = restoreDeletedQuote(item.record.id)
    if (restored) onRestored?.(restored, item)
    setVersion((current) => current + 1)
  }

  function handlePermanentDelete(item) {
    if (!item?.record?.id) return
    permanentlyDeleteQuote(item.record.id)
    setPendingPermanentDelete(null)
    setVersion((current) => current + 1)
  }

  function handleBulkPermanentDelete() {
    const selected = new Set(selectedIds)
    entries
      .filter((item) => selected.has(item.id) && item.record?.id)
      .forEach((item) => permanentlyDeleteQuote(item.record.id))
    exitBulkSelectMode()
    setVersion((current) => current + 1)
  }

  const allSelected = entries.length > 0 && selectedIds.length === entries.length
  const headerActions = bulkSelectMode
    ? [
        {
          id: 'bulk-delete-confirm',
          label:
            selectedIds.length > 0
              ? `Seçilenleri Sil (${selectedIds.length})`
              : 'Seçilenleri Sil',
          icon: Trash2,
          tone: 'danger',
          onClick: (event) => {
            if (selectedIds.length > 0) {
              setDeleteConfirmAnchor(captureDeleteConfirmAnchor(event))
              setPendingBulkDelete(true)
            }
          },
        },
        {
          id: 'bulk-delete-cancel',
          label: 'İptal',
          onClick: exitBulkSelectMode,
        },
      ]
    : [
        {
          id: 'bulk-delete',
          label: 'Toplu Sil',
          icon: Trash2,
          tone: 'danger',
          onClick: () => {
            setOpen(true)
            setBulkSelectMode(true)
            setSelectedIds([])
            setPendingBulkDelete(false)
          },
        },
      ]

  return (
    <section className={`${SP_PANEL_SHELL_CLASS} ${className}`.trim()}>
      <div className="relative flex min-h-[4.75rem] items-stretch">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`${SP_HEADER_BUTTON_CLASS} min-w-0 flex-1`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <RedPingDot />
            <span className={APP_LABEL_CLASS}>{title}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3 pr-12">
            <span className={`${APP_LABEL_CLASS} shrink-0`}>{entries.length} Kayıt</span>
            <ChevronDown className={`${SP_CHEVRON_CLASS} ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {entries.length > 0 ? (
          <div
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreMenu items={headerActions} aria-label="Silinen teklif işlemleri" />
          </div>
        ) : null}
      </div>

      {open ? (
        <div className={SP_BODY_CLASS}>
          {entries.length === 0 ? (
            <div className={SP_EMPTY_CLASS}>{emptyMessage}</div>
          ) : (
            <>
              {bulkSelectMode ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                  <p className={YF_TEXT_CLASS}>
                    {selectedIds.length > 0
                      ? `${selectedIds.length} kayıt seçildi`
                      : 'Kalıcı silmek için kayıt seçin'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exitBulkSelectMode}
                      className={`${YF_TEXT_CLASS} rounded-lg px-2 py-1 transition-colors hover:bg-black/5`}
                    >
                      İptal
                    </button>
                    <button
                      ref={bulkDeleteButtonRef}
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => setPendingBulkDelete(true)}
                      className="customer-bulk-delete-action inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#fda4af] via-[#f43f5e] to-[#e11d48] px-2.5 py-1.5 text-[14px] font-bold leading-tight tracking-normal transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                    >
                      <Trash2
                        className="h-3.5 w-3.5 shrink-0"
                        strokeWidth={2.25}
                        aria-hidden
                        style={{ color: '#ffffff', stroke: '#ffffff' }}
                      />
                      <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
                        Seçilenleri Sil
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              {bulkSelectMode ? (
                <label className={`mb-2 flex cursor-pointer items-center gap-2 ${YF_TEXT_CLASS}`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
                  />
                  Tümünü seç
                </label>
              ) : null}

              <div className={SP_ROW_LIST_CLASS}>
                {entries.map((item) => {
                  const details = quoteDetails(item.record)
                  const isSelected = selectedIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`${SP_ROW_CLASS} ${isSelected ? 'ring-1 ring-rose-400/40' : ''}`}
                      onClick={bulkSelectMode ? () => toggleSelect(item.id) : undefined}
                    >
                      {bulkSelectMode ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`${item.label} seç`}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
                        />
                      ) : (
                        <RedPingDot />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={SP_ROW_TITLE_CLASS}>{item.label}</p>
                        <p className={SP_ROW_META_CLASS}>
                          Silindi · {formatWhen(item.at)}
                        </p>
                        {details.length ? (
                          <p className={SP_ROW_DETAILS_CLASS}>{details.join(' · ')}</p>
                        ) : null}
                      </div>
                      {!bulkSelectMode ? (
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
                            onClick={(event) => {
                              setDeleteConfirmAnchor(captureDeleteConfirmAnchor(event))
                              setPendingPermanentDelete(item)
                            }}
                            className={`customer-permanent-delete-action ${COP_KUTUSU_BUTTON_CLASS}`}
                            aria-label={`${item.label} kalıcı olarak sil`}
                            title="Sil"
                          >
                            <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      ) : null}

      <DeleteConfirmOverlay
        open={Boolean(pendingPermanentDelete) && !pendingBulkDelete}
        anchorRect={deleteConfirmAnchor}
        title="Teklif kalıcı olarak silinsin mi?"
        description={`${pendingPermanentDelete?.label || 'Bu teklif'} silinenler alanından kaldırılacak. Kullanıcı tarafından geri getirilemez.`}
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => {
          setPendingPermanentDelete(null)
          setDeleteConfirmAnchor(null)
        }}
        onConfirm={() => {
          handlePermanentDelete(pendingPermanentDelete)
          setDeleteConfirmAnchor(null)
        }}
      />

      <DeleteConfirmOverlay
        open={pendingBulkDelete && selectedIds.length > 0}
        anchorRef={bulkDeleteButtonRef}
        anchorRect={deleteConfirmAnchor}
        title={`${selectedIds.length} teklif kalıcı olarak silinsin mi?`}
        description={`${PERMANENT_DELETE_WARNING} Bu işlem kullanıcı tarafında geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => {
          setPendingBulkDelete(false)
          setDeleteConfirmAnchor(null)
        }}
        onConfirm={() => {
          handleBulkPermanentDelete()
          setDeleteConfirmAnchor(null)
        }}
      />
    </section>
  )
}
