import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Trash2, Undo2, X } from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DELETED_RECORDS_EVENT, getDeletedRecords } from '../../utils/deletedRecordsStore'
import { permanentlyDeleteQuote, restoreDeletedQuote } from '../../utils/quotesStore'
import { resolveQuoteCode } from '../../utils/documentCodes'
import { getListCustomerDisplay } from '../../data/customerProfiles'
import { formatTL } from '../../utils/productPricing'
import {
  PAGE_BALANCE_AMOUNT_CLASS,
  APP_LABEL_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  SP_CHEVRON_CLASS,
  SP_EMPTY_CLASS,
  YF_TEXT_CLASS,
} from '../../utils/dashboardDesign'
import { COP_KUTUSU_ICON_CLASS } from '../../utils/buttonStyles'
import { DeleteConfirmOverlay, captureDeleteConfirmAnchor } from './ListDeleteConfirmPanel'
import { AppPagePanel } from '../Layout/AppPageLayout'
import EditableDropdownPill from '../EditableDropdownPill'

const ROW_EXIT_MS = 720

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

function formatListDateParts(value) {
  if (!value) return { date: '', time: '' }
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}))/)
  if (trMatch) {
    const [hours, minutes] = (trMatch[2] || '').split(':')
    return {
      date: trMatch[1],
      time: hours && minutes ? `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}` : '',
    }
  }

  try {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) {
      return {
        date: d.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    }
  } catch {
    /* ignore */
  }

  return { date: formatListDate(raw), time: '' }
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

function InlineSilConfirm({ onConfirm, onCancel, ariaLabel = 'Kalıcı sil' }) {
  return (
    <div
      className="quote-order-undo-confirm quote-order-action inline-flex h-9 items-center justify-center"
      onClick={(event) => event.stopPropagation()}
      role="alertdialog"
      aria-label={ariaLabel}
    >
      <div className="quote-order-undo-box flex h-9 w-full items-center justify-between rounded-xl border border-ds-border bg-transparent px-1">
        <button
          type="button"
          onClick={onConfirm}
          className="quote-order-undo-sil px-1.5 text-[11px] font-semibold leading-none"
        >
          Sil
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="quote-order-undo-close inline-flex h-7 w-7 items-center justify-center rounded-lg"
          aria-label="Vazgeç"
          title="Vazgeç"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

const PERMANENT_DELETE_WARNING =
  'Bu kayıtlar silinenler / arşiv alanından kaldırılacak ve kullanıcı tarafından geri getirilemez.'

/** Ana teklif listesi ile aynı sütun iskeleti (segment sayısı üstten gelir) */
function buildDeletedListGrid(segmentCount = 1) {
  const segments = Math.max(1, Number(segmentCount) || 1)
  return [
    '6.5rem',
    '4.75rem',
    'minmax(16rem, 2.4fr)',
    ...Array.from({ length: segments }, () => 'minmax(9.25rem, 0.7fr)'),
    '6.75rem',
    '6.5rem',
    '3rem',
  ].join(' ')
}

const DATA_ROW_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel quote-deleted-list-row flex w-full items-center min-h-[4.75rem] quote-list-data-panel'

/** Geri yükle ile aynı ölçü (1.75rem) — yuvarlak kırmızı hover */
const DELETED_CK_BUTTON_CLASS =
  'quote-deleted-ck-btn customer-permanent-delete-action inline-flex h-[1.75rem] w-[1.75rem] items-center justify-center rounded-full bg-transparent text-red-500 transition-[background-color,color] hover:bg-red-500/15 hover:text-red-600'

/** Ana liste satırı ile aynı 76px kart */
const DELETED_HEADER_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel quote-deleted-header-panel quote-list-data-panel flex h-[4.75rem] min-h-[4.75rem] max-h-[4.75rem] w-full items-center'

const DELETED_PANEL_WRAP_CLASS =
  'quote-deleted-panel-wrap customer-deleted-archived-panel w-full flex flex-col gap-5'

function getDeletedRecordDateSource(record) {
  return record?.activities?.[0]?.date || record?.createdAt || ''
}

function DeletedOrderRestoreCell({
  orderCreated,
  onRestore,
  disabled = false,
  restoreLabel = 'Geri yükle',
}) {
  return (
    <span
      className="quote-order-action inline-flex h-9 items-center justify-between"
      onClick={(event) => event.stopPropagation()}
    >
      {orderCreated ? (
        <span
          className="quote-order-chip inline-flex h-9 w-[3.75rem] flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-1 text-center text-[10px] font-bold leading-tight text-emerald-700"
          title="Sipariş oluşturuldu"
        >
          <span>Sipariş</span>
          <span>Oluştu</span>
        </span>
      ) : (
        <span
          className="quote-order-chip quote-order-action inline-flex h-9 flex-col items-center justify-center rounded-xl border border-ds-border bg-transparent px-1 text-center text-[10px] font-semibold leading-tight text-[var(--muted)]"
          title="Sipariş oluşturulmamış"
        >
          <span>Sipariş</span>
          <span>Oluştur</span>
        </span>
      )}
      <button
        type="button"
        onClick={onRestore}
        disabled={disabled}
        className="glass-sidebar-toggle glass-sidebar-collapse flex h-9 w-9 items-center justify-center rounded-xl"
        title="Geri yükle"
        aria-label={restoreLabel}
      >
        <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </span>
  )
}

function DeletedDateCell({ record, deletedAt }) {
  const createdStamp = formatListDateParts(getDeletedRecordDateSource(record))
  const deletedStamp = formatListDateParts(deletedAt)
  const createdLine = [createdStamp.date, createdStamp.time].filter(Boolean).join(' ')
  const deletedLine = [deletedStamp.date, deletedStamp.time].filter(Boolean).join(' ')

  return (
    <span className="quote-deleted-date-cell flex max-w-full flex-col items-center justify-center leading-none">
      <span className="flex w-full max-w-[6.5rem] flex-col items-center gap-px">
        <span className="text-[8px] font-normal leading-tight text-[var(--muted)]/55">
          Oluşturulma tarihi
        </span>
        <span className="text-[9px] font-normal tabular-nums leading-tight text-[var(--muted)]">
          {createdLine || '—'}
        </span>
      </span>
      <span
        className="my-0.5 h-px w-full max-w-[4.75rem] shrink-0 bg-[var(--glass-border)]/80"
        aria-hidden
      />
      <span className="flex w-full max-w-[6.5rem] flex-col items-center gap-px">
        <span className="text-[8px] font-normal leading-tight text-[var(--muted)]/55">
          Silinme tarihi
        </span>
        <span className="text-[9px] font-normal tabular-nums leading-tight text-[var(--muted)]/70">
          {deletedLine || '—'}
        </span>
      </span>
    </span>
  )
}

function DeletedListCell({ className = '', style, children }) {
  return (
    <div className={`quote-list-cell min-w-0 ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}

export default function QuoteDeletedArchivedPanel({
  title = 'Silinenler ve Arşivlenenler',
  onRestored,
  emptyMessage = 'Silinen teklif yok.',
  className = '',
  receivePulseKey = 0,
  segmentTabs = [],
  getProcessValue,
  getProcessOptions,
  getListAmount,
  isOrderCreated,
  columnGrid,
}) {
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [receiveActive, setReceiveActive] = useState(false)
  const [version, setVersion] = useState(0)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [deleteConfirmAnchor, setDeleteConfirmAnchor] = useState(null)
  const [restoringIds, setRestoringIds] = useState([])
  const [trashingIds, setTrashingIds] = useState([])
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
    if (!item?.record?.id || restoringIds.includes(item.id) || trashingIds.includes(item.id)) return
    setRestoringIds((current) => [...current, item.id])
    window.setTimeout(() => {
      const restored = restoreDeletedQuote(item.record.id)
      if (restored) onRestored?.(restored, item)
      setRestoringIds((current) => current.filter((id) => id !== item.id))
      setVersion((current) => current + 1)
    }, ROW_EXIT_MS)
  }

  function runPermanentDelete(item) {
    if (!item?.record?.id || trashingIds.includes(item.id)) return
    setPendingDeleteId(null)
    setTrashingIds((current) => [...current, item.id])
    window.setTimeout(() => {
      permanentlyDeleteQuote(item.record.id)
      setTrashingIds((current) => current.filter((id) => id !== item.id))
      setVersion((current) => current + 1)
    }, ROW_EXIT_MS)
  }

  function handleBulkPermanentDelete() {
    const selected = entries.filter((item) => selectedIds.includes(item.id) && item.record?.id)
    if (!selected.length) return
    const ids = selected.map((item) => item.id)
    setPendingBulkDelete(false)
    setDeleteConfirmAnchor(null)
    setTrashingIds((current) => [...current, ...ids])
    window.setTimeout(() => {
      selected.forEach((item) => permanentlyDeleteQuote(item.record.id))
      setTrashingIds([])
      exitBulkSelectMode()
      setVersion((current) => current + 1)
    }, ROW_EXIT_MS)
  }

  const allSelected = entries.length > 0 && selectedIds.length === entries.length
  const resolvedSegmentTabs = Array.isArray(segmentTabs) ? segmentTabs : []
  const baseGrid =
    columnGrid ||
    buildDeletedListGrid(resolvedSegmentTabs.length || 1)
  const gridTemplate = bulkSelectMode ? `2.75rem ${baseGrid}` : baseGrid
  const titleColumnSpan =
    (bulkSelectMode ? 1 : 0) + 3 + resolvedSegmentTabs.length + 1

  const deletedQuoteIds = useMemo(
    () => entries.map((entry) => entry.record?.id).filter(Boolean),
    [entries],
  )

  function processLabelForRecord(record, tab) {
    if (typeof getProcessValue === 'function') {
      return getProcessValue(record, tab) || '—'
    }
    if (!record) return '—'
    return record.status || '—'
  }

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

  const togglePanelOpen = () => setOpen((current) => !current)

  const handleHeaderPanelClick = (event) => {
    if (event.target.closest('[data-deleted-header-interactive]')) return
    togglePanelOpen()
  }

  const handleHeaderPanelKeyDown = (event) => {
    if (event.target.closest('[data-deleted-header-interactive]')) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      togglePanelOpen()
    }
  }

  return (
    <div
      ref={panelRef}
      className={`${DELETED_PANEL_WRAP_CLASS} ${className} ${
        receiveActive ? 'quote-deleted-panel-receive' : ''
      }`.trim()}
    >
      <section
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={handleHeaderPanelClick}
        onKeyDown={handleHeaderPanelKeyDown}
        className={`card px-4 py-3 ${DELETED_HEADER_PANEL_CLASS}${
          open ? ' quote-deleted-header-panel-open' : ''
        } cursor-pointer`}
      >
        <div
          className="quote-list-row quote-deleted-header-row w-full min-w-0"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {bulkSelectMode ? <DeletedListCell aria-hidden /> : null}
          <DeletedListCell
            className="is-start quote-deleted-header-title-cell"
            style={{ gridColumn: `span ${titleColumnSpan}` }}
          >
            <span className="flex min-w-0 items-center gap-2 px-0 py-0 text-left">
              <RedPingDot />
              <span className={APP_LABEL_CLASS}>{title}</span>
            </span>
          </DeletedListCell>
          <DeletedListCell>
            <span className="inline-flex w-full items-center justify-center gap-2">
              <span className={`${APP_LABEL_CLASS} shrink-0`}>{entries.length} Kayıt</span>
              <ChevronDown className={`${SP_CHEVRON_CLASS} ${open ? 'rotate-180' : ''}`} />
            </span>
          </DeletedListCell>
          <DeletedListCell>
            {entries.length > 0 ? (
              <span
                data-deleted-header-interactive
                className="inline-flex w-full items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreMenu items={headerActions} aria-label="Silinen teklif işlemleri" />
              </span>
            ) : (
              <span className="inline-flex h-9 w-9" aria-hidden />
            )}
          </DeletedListCell>
        </div>
      </section>

      {open ? (
        <div className="quote-deleted-body-plain w-full">
          {entries.length === 0 ? (
            <div className={SP_EMPTY_CLASS}>{emptyMessage}</div>
          ) : (
            <>
              {bulkSelectMode ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 py-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
                      aria-label="Tümünü seç"
                    />
                    <p className={YF_TEXT_CLASS}>
                      {selectedIds.length > 0
                        ? `${selectedIds.length} kayıt seçildi`
                        : 'Kalıcı silmek için kayıt seçin'}
                    </p>
                  </div>
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
                <div className="quote-list-board">
                  {entries.map((item, rowIndex) => {
                    const display = getListCustomerDisplay(item.record?.customer)
                    const amount = getListAmount
                      ? getListAmount(item.record)
                      : quoteAmount(item.record)
                    const orderCreated = isOrderCreated?.(item.record) ?? false
                    const isSelected = selectedIds.includes(item.id)
                    const isRestoring = restoringIds.includes(item.id)
                    const isTrashing = trashingIds.includes(item.id)
                    const pendingConfirm = pendingDeleteId === item.id

                    let wrapClass
                    if (isTrashing) wrapClass = 'quote-list-row-into-trash-wrap'
                    else if (isRestoring) wrapClass = 'quote-list-row-restore-wrap'

                    return (
                      <div
                        key={item.id}
                        className={wrapClass}
                        style={
                          isTrashing || isRestoring
                            ? { animationDelay: `${Math.min(rowIndex, 5) * 50}ms` }
                            : undefined
                        }
                      >
                        <AppPagePanel
                          className={`${DATA_ROW_PANEL_CLASS} ${
                            isSelected ? 'ring-1 ring-rose-400/40' : ''
                          }`}
                        >
                          <div
                            className="quote-list-row w-full min-w-0"
                            style={{ gridTemplateColumns: gridTemplate }}
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
                              <DeletedDateCell record={item.record} deletedAt={item.at} />
                            </DeletedListCell>
                            <DeletedListCell>
                              <span className={`${YF_TEXT_CLASS} tabular-nums`}>
                                {item.record?.id
                                  ? resolveQuoteCode(item.record.id, deletedQuoteIds)
                                  : '—'}
                              </span>
                            </DeletedListCell>
                            <DeletedListCell>
                              <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                                <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                                  {display.brandShortName || item.label}
                                </span>
                                {display.companyTitle &&
                                display.companyTitle !== display.brandShortName ? (
                                  <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                                    {display.companyTitle}
                                  </span>
                                ) : null}
                              </span>
                            </DeletedListCell>
                            {(resolvedSegmentTabs.length
                              ? resolvedSegmentTabs
                              : [{ id: 'status', label: 'Durum' }]
                            ).map((tab) => (
                              <DeletedListCell key={tab.id || tab.label}>
                                <span
                                  className="flex w-full items-center justify-center"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <EditableDropdownPill
                                    value={processLabelForRecord(item.record, tab)}
                                    options={getProcessOptions?.(tab) || []}
                                    includePlaceholderOption={false}
                                    editable={false}
                                    disabled
                                    buttonClassName={PAGE_LIST_PILL_CLASS}
                                    wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                                    openKey={`deleted-${item.id}-${tab.id}`}
                                    activeMenu={null}
                                    setActiveMenu={() => {}}
                                    onChange={() => {}}
                                  />
                                </span>
                              </DeletedListCell>
                            ))}
                            <DeletedListCell>
                              <span
                                className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}
                              >
                                {amount ? formatTL(amount) : '—'}
                              </span>
                            </DeletedListCell>
                            <DeletedListCell>
                              <span className="inline-flex w-full items-center justify-center">
                                <DeletedOrderRestoreCell
                                  orderCreated={orderCreated}
                                  disabled={isRestoring || isTrashing}
                                  restoreLabel={`${item.label} geri yükle`}
                                  onRestore={() => handleRestore(item)}
                                />
                              </span>
                            </DeletedListCell>
                            <DeletedListCell>
                              {!bulkSelectMode ? (
                                <span
                                  className="inline-flex w-full items-center justify-center"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {pendingConfirm ? (
                                    <InlineSilConfirm
                                      ariaLabel={`${item.label} kalıcı sil`}
                                      onConfirm={() => runPermanentDelete(item)}
                                      onCancel={() => setPendingDeleteId(null)}
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setPendingDeleteId(item.id)}
                                      disabled={isRestoring || isTrashing}
                                      className={DELETED_CK_BUTTON_CLASS}
                                      aria-label={`${item.label} kalıcı olarak sil`}
                                      title="Sil"
                                    >
                                      <Trash2
                                        className={COP_KUTUSU_ICON_CLASS}
                                        strokeWidth={2.25}
                                      />
                                    </button>
                                  )}
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
        onConfirm={handleBulkPermanentDelete}
      />
    </div>
  )
}
