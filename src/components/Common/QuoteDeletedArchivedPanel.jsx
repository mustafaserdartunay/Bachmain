import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Trash2, Undo2 } from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DELETED_RECORDS_EVENT, getDeletedRecords } from '../../utils/deletedRecordsStore'
import { permanentlyDeleteQuote, restoreDeletedQuote } from '../../utils/quotesStore'
import { getListCustomerDisplay } from '../../data/customerProfiles'
import { formatTL } from '../../utils/productPricing'
import {
  APP_LABEL_CLASS,
  PAGE_BALANCE_AMOUNT_CLASS,
  SP_BODY_CLASS,
  SP_CHEVRON_CLASS,
  SP_EMPTY_CLASS,
  SP_HEADER_BUTTON_CLASS,
  SP_PANEL_SHELL_CLASS,
  YF_TEXT_CLASS,
  YFB_TEXT_CLASS,
} from '../../utils/dashboardDesign'
import { COP_KUTUSU_BUTTON_CLASS, COP_KUTUSU_ICON_CLASS } from '../../utils/buttonStyles'
import { DeleteConfirmOverlay, captureDeleteConfirmAnchor } from './ListDeleteConfirmPanel'
import { AppPagePanel } from '../Layout/AppPageLayout'

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

function formatListDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

const DELETED_LIST_GRID =
  'minmax(7.5rem,0.9fr) minmax(4.5rem,0.55fr) minmax(9rem,1.35fr) minmax(7rem,0.9fr) minmax(6.5rem,0.8fr) minmax(5.5rem,0.7fr)'

const ROW_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel quote-deleted-list-row flex w-full items-center min-h-[4.75rem]'

function DeletedListCell({ className = '', children }) {
  return <div className={`quote-list-cell min-w-0 ${className}`.trim()}>{children}</div>
}

function DeletedColumnTitle({ label }) {
  return (
    <span className={`${YFB_TEXT_CLASS} quote-list-column-title uppercase text-[var(--muted)]`}>
      {`${String(label).toLocaleUpperCase('tr-TR')} :`}
    </span>
  )
}

export default function QuoteDeletedArchivedPanel({
  title = 'Silinenler ve Arşivlenenler',
  onRestored,
  emptyMessage = 'Silinen teklif yok.',
  className = '',
  receivePulseKey = 0,
}) {
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [receiveActive, setReceiveActive] = useState(false)
  const [version, setVersion] = useState(0)
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState(null)
  const [deleteConfirmAnchor, setDeleteConfirmAnchor] = useState(null)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [restoringIds, setRestoringIds] = useState([])
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

  useEffect(() => {
    if (!receivePulseKey) return undefined
    setReceiveActive(true)
    const timer = window.setTimeout(() => setReceiveActive(false), 900)
    return () => window.clearTimeout(timer)
  }, [receivePulseKey])

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
      const allOn = keys.length > 0 && keys.every((id) => current.includes(id))
      return allOn ? [] : keys
    })
  }

  function handleRestore(item) {
    if (!item?.record?.id || restoringIds.includes(item.id)) return
    setRestoringIds((current) => [...current, item.id])
    window.setTimeout(() => {
      const restored = restoreDeletedQuote(item.record.id)
      if (restored) onRestored?.(restored, item)
      setRestoringIds((current) => current.filter((id) => id !== item.id))
      setVersion((current) => current + 1)
    }, 720)
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
            selectedIds.length > 0 ? `Seçilenleri Sil (${selectedIds.length})` : 'Seçilenleri Sil',
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
    <section
      ref={panelRef}
      className={`${SP_PANEL_SHELL_CLASS} ${className} ${
        receiveActive ? 'quote-deleted-panel-receive' : ''
      }`.trim()}
    >
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

              <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
                <div className="quote-list-board quote-deleted-list-board">
                  <AppPagePanel className={`${ROW_PANEL_CLASS} quote-list-header-panel`}>
                    <div
                      className="quote-list-row w-full min-w-0"
                      style={{
                        gridTemplateColumns: bulkSelectMode
                          ? `2.25rem ${DELETED_LIST_GRID}`
                          : DELETED_LIST_GRID,
                      }}
                    >
                      {bulkSelectMode ? (
                        <DeletedListCell>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
                            aria-label="Tümünü seç"
                          />
                        </DeletedListCell>
                      ) : null}
                      <DeletedListCell>
                        <DeletedColumnTitle label="Tarih" />
                      </DeletedListCell>
                      <DeletedListCell>
                        <DeletedColumnTitle label="Kod" />
                      </DeletedListCell>
                      <DeletedListCell>
                        <DeletedColumnTitle label="Müşteri Adı" />
                      </DeletedListCell>
                      <DeletedListCell>
                        <DeletedColumnTitle label="Durum" />
                      </DeletedListCell>
                      <DeletedListCell>
                        <DeletedColumnTitle label="Tutar" />
                      </DeletedListCell>
                      <DeletedListCell>
                        <DeletedColumnTitle label="İşlem" />
                      </DeletedListCell>
                    </div>
                  </AppPagePanel>

                  {entries.map((item) => {
                    const display = getListCustomerDisplay(item.record?.customer)
                    const amount = quoteAmount(item.record)
                    const isSelected = selectedIds.includes(item.id)
                    const isRestoring = restoringIds.includes(item.id)
                    const grid = bulkSelectMode ? `2.25rem ${DELETED_LIST_GRID}` : DELETED_LIST_GRID

                    return (
                      <div
                        key={item.id}
                        className={isRestoring ? 'quote-list-row-exit-wrap' : undefined}
                      >
                        <AppPagePanel
                          className={`${ROW_PANEL_CLASS} quote-list-data-panel ${
                            isSelected ? 'ring-1 ring-rose-400/40' : ''
                          }`}
                        >
                          <div
                            className="quote-list-row w-full min-w-0"
                            style={{ gridTemplateColumns: grid }}
                            onClick={bulkSelectMode ? () => toggleSelect(item.id) : undefined}
                          >
                            {bulkSelectMode ? (
                              <DeletedListCell>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(item.id)}
                                  onClick={(event) => event.stopPropagation()}
                                  aria-label={`${item.label} seç`}
                                  className="h-4 w-4 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
                                />
                              </DeletedListCell>
                            ) : null}
                            <DeletedListCell>
                              <span className={YF_TEXT_CLASS}>{formatListDate(item.at)}</span>
                            </DeletedListCell>
                            <DeletedListCell>
                              <span className={YF_TEXT_CLASS}>{item.record?.id || '—'}</span>
                            </DeletedListCell>
                            <DeletedListCell align="start" className="is-start">
                              <div className="min-w-0 text-left">
                                <p className="customer-name-primary truncate text-[14px] font-semibold leading-tight text-[var(--ink)]">
                                  {display.brandShortName || item.label}
                                </p>
                                {display.companyTitle &&
                                display.companyTitle !== display.brandShortName ? (
                                  <p className={`${YF_TEXT_CLASS} truncate`}>
                                    {display.companyTitle}
                                  </p>
                                ) : null}
                              </div>
                            </DeletedListCell>
                            <DeletedListCell>
                              <span className={YF_TEXT_CLASS}>
                                {item.record?.status || 'Silindi'}
                              </span>
                            </DeletedListCell>
                            <DeletedListCell>
                              <span
                                className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}
                              >
                                {amount ? formatTL(amount) : '—'}
                              </span>
                            </DeletedListCell>
                            <DeletedListCell>
                              {!bulkSelectMode ? (
                                <span
                                  className="inline-flex w-full items-center justify-center gap-1.5"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleRestore(item)}
                                    disabled={isRestoring}
                                    className="glass-sidebar-toggle glass-sidebar-collapse flex h-9 w-9 items-center justify-center rounded-xl"
                                    title="Geri yükle"
                                    aria-label={`${item.label} geri yükle`}
                                  >
                                    <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
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
                                </span>
                              ) : (
                                <span className={YF_TEXT_CLASS}>{formatWhen(item.at)}</span>
                              )}
                            </DeletedListCell>
                          </div>
                        </AppPagePanel>
                      </div>
                    )
                  })}
                </div>
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
