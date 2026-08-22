import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, MoreHorizontal, Trash2, Undo2, X } from 'lucide-react'
import { Button, Dropdown, DropdownSeparator } from '@bachmain/ui'
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
import { DeleteConfirmOverlay } from './ListDeleteConfirmPanel'
import QuoteRecordMetaPanel from './QuoteRecordMetaPanel'
import { AppPagePanel } from '../Layout/AppPageLayout'
import EditableDropdownPill from '../EditableDropdownPill'
import {
  formatListDateParts,
  formatQuoteDisplayWhen,
  getQuoteCreatedSource,
} from '../../utils/quoteListDateFormat'

const ROW_EXIT_MS = 880
const MENU_DELETE_ANIM_MS = 580

function formatWhen(value) {
  return formatQuoteDisplayWhen(value)
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

const PERMANENT_DELETE_ROW_WARNING = 'Bu teklif kalıcı olarak silinecek. Geri alınamaz.'

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

function DeletedListDateCell({ record }) {
  const stamp = formatListDateParts(getQuoteCreatedSource(record))

  if (!stamp.date) {
    return <span className="block text-center text-[14px] font-normal text-[var(--muted)]">—</span>
  }

  return (
    <span className="flex flex-col items-center justify-center gap-0.5 tabular-nums">
      <span className="text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
        {stamp.date}
      </span>
      {stamp.time ? (
        <span className="text-[12px] font-normal leading-tight text-[var(--muted)]/75">
          {stamp.time}
        </span>
      ) : null}
    </span>
  )
}

function QuoteDeletedRowMoreMenu({ item, disabled, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteAnimating, setDeleteAnimating] = useState(false)

  const handleConfirmDelete = (close) => {
    setDeleteAnimating(true)
    window.setTimeout(() => {
      setDeleteAnimating(false)
      setConfirmDelete(false)
      close()
      onDelete()
    }, MENU_DELETE_ANIM_MS)
  }

  return (
    <Dropdown
      align="end"
      menuClassName="az customer-filter-dropdown-menu customers-page-menu quote-record-meta-dropdown min-w-[15rem]"
      trigger={
        <Button
          variant="ghost"
          size="iconOnly"
          className="hover:!bg-transparent"
          aria-label={`${item.label} diğer işlemler`}
          disabled={disabled}
          onClick={() => {
            setConfirmDelete(false)
            setDeleteAnimating(false)
          }}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      }
    >
      {({ close }) => (
        <>
          <QuoteRecordMetaPanel quote={item.record} deletedAt={item.at} entryMeta={item} />
          <DropdownSeparator />
          {confirmDelete ? (
            <div
              className={`quote-menu-delete-confirm px-2 py-2${
                deleteAnimating ? ' is-vanishing' : ''
              }`}
              onClick={(event) => event.stopPropagation()}
              role="menuitem"
            >
              <p className="mb-2 text-[11px] font-medium leading-snug text-rose-600">
                {PERMANENT_DELETE_ROW_WARNING}
              </p>
              <div className="quote-meta-delete-suck-target">
                <Trash2
                  className={`quote-meta-delete-suck-icon h-5 w-5 text-[#ef4444]${
                    deleteAnimating ? ' is-sucking' : ''
                  }`}
                  strokeWidth={2.25}
                  aria-hidden
                />
              </div>
              {!deleteAnimating ? (
                <InlineSilConfirm
                  ariaLabel={`${item.label} kalıcı sil`}
                  onConfirm={() => handleConfirmDelete(close)}
                  onCancel={() => setConfirmDelete(false)}
                />
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              role="menuitem"
              aria-label="Sil"
              className="quote-record-meta-delete-item flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] font-normal leading-tight tracking-normal transition-colors hover:bg-transparent"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2
                className="h-[14px] w-[14px] shrink-0 text-[var(--muted)]"
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="min-w-0 truncate text-[#ef4444]">Sil</span>
            </button>
          )}
        </>
      )}
    </Dropdown>
  )
}

/** Ana liste satırı ile aynı 76px kart */
const DELETED_HEADER_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel quote-deleted-header-panel quote-list-data-panel flex h-[4.75rem] min-h-[4.75rem] max-h-[4.75rem] w-full items-center'

const DELETED_PANEL_WRAP_CLASS = 'quote-deleted-panel-wrap customer-deleted-archived-panel w-full'

function DeletedOrderRestoreCell({
  orderCreated,
  onRestore,
  disabled = false,
  restoreLabel = 'Geri yükle',
}) {
  return (
    <span
      className="quote-order-action inline-flex h-9 w-[5.75rem] min-w-[5.75rem] items-center justify-between"
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
          className="quote-order-chip inline-flex h-9 w-[3.75rem] flex-col items-center justify-center rounded-xl border border-ds-border bg-transparent px-1 text-center text-[10px] font-semibold leading-tight text-[var(--muted)]"
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
  layoutMode = 'standalone',
}) {
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [receiveActive, setReceiveActive] = useState(false)
  const [version, setVersion] = useState(0)
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
          deletedBy: entry.deletedBy,
          lastRestoredAt: entry.lastRestoredAt || '',
          restoredAt: entry.restoredAt || entry.restoredFromPurgeAt,
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
  const baseGrid = columnGrid || buildDeletedListGrid(resolvedSegmentTabs.length || 1)
  const gridTemplate = bulkSelectMode ? `2.75rem ${baseGrid}` : baseGrid
  const titleColumnSpan = (bulkSelectMode ? 1 : 0) + 3 + resolvedSegmentTabs.length + 1

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

  const scrollShellClass =
    layoutMode === 'inline'
      ? 'quote-deleted-inline-shell w-full'
      : 'w-full min-w-0 overflow-x-auto overflow-y-visible'

  return (
    <div
      ref={panelRef}
      className={`${DELETED_PANEL_WRAP_CLASS} ${className} ${
        receiveActive ? 'quote-deleted-panel-receive' : ''
      }`.trim()}
    >
      {open && bulkSelectMode ? (
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

      <div className={scrollShellClass}>
        <div className="quote-list-board quote-deleted-list-board w-full">
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
              <DeletedListCell
                data-deleted-header-interactive
                onClick={(event) => event.stopPropagation()}
              >
                {entries.length > 0 ? (
                  bulkSelectMode && selectedIds.length > 0 ? (
                    <InlineSilConfirm
                      ariaLabel={`${selectedIds.length} kayıt kalıcı sil`}
                      onConfirm={() => setPendingBulkDelete(true)}
                      onCancel={exitBulkSelectMode}
                    />
                  ) : (
                    <button
                      type="button"
                      className={`quote-list-bulk-trash-btn${bulkSelectMode ? ' is-active' : ''}`}
                      title={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil'}
                      aria-label={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil modu'}
                      onClick={() => {
                        if (!bulkSelectMode) {
                          setOpen(true)
                          setBulkSelectMode(true)
                          setSelectedIds([])
                          setPendingBulkDelete(false)
                        } else {
                          exitBulkSelectMode()
                        }
                      }}
                    >
                      <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                    </button>
                  )
                ) : (
                  <span className="inline-flex h-9 w-9" aria-hidden />
                )}
              </DeletedListCell>
            </div>
          </section>

          {open && entries.length === 0 ? (
            <div className={`${SP_EMPTY_CLASS} px-4`}>{emptyMessage}</div>
          ) : null}

          {open
            ? entries.map((item, rowIndex) => {
                const display = getListCustomerDisplay(item.record?.customer)
                const amount = getListAmount ? getListAmount(item.record) : quoteAmount(item.record)
                const orderCreated = isOrderCreated?.(item.record) ?? false
                const isSelected = selectedIds.includes(item.id)
                const isRestoring = restoringIds.includes(item.id)
                const isTrashing = trashingIds.includes(item.id)

                let wrapClass
                if (isTrashing) wrapClass = 'quote-deleted-row-collapse-wrap'
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
                          <DeletedListDateCell record={item.record} />
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
                              <QuoteDeletedRowMoreMenu
                                item={item}
                                disabled={isRestoring || isTrashing}
                                onDelete={() => runPermanentDelete(item)}
                              />
                            </span>
                          ) : (
                            <span className={YF_TEXT_CLASS}>{formatWhen(item.at)}</span>
                          )}
                        </DeletedListCell>
                      </div>
                    </AppPagePanel>
                  </div>
                )
              })
            : null}
        </div>
      </div>

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
