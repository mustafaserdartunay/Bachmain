import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, RotateCcw, Trash2, Undo2 } from 'lucide-react'
import { Button, Dropdown, DropdownItem, DropdownSeparator } from '@bachmain/ui'
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
  PAGE_BALANCE_AMOUNT_CLASS,
  SP_CHEVRON_CLASS,
  SP_EMPTY_CLASS,
  YF_TEXT_CLASS,
} from '../../utils/dashboardDesign'
import { COP_KUTUSU_ICON_CLASS } from '../../utils/buttonStyles'
import { AppPagePanel } from '../Layout/AppPageLayout'
import QuoteOrderInlineConfirm from './QuoteOrderInlineConfirm'
import {
  formatTreasuryCurrency,
  getCustomerLedgerBalance,
  getTreasuryMovements,
} from '../../utils/treasuryStore'

function formatWhen(value) {
  if (!value) return { date: '', time: '' }
  try {
    const d = new Date(value)
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
  } catch {
    return { date: String(value), time: '' }
  }
}

function RedPingDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-50" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
    </span>
  )
}

function DeletedBulkSelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  'aria-label': ariaLabel,
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(node) => {
        if (node) node.indeterminate = Boolean(indeterminate)
      }}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
    />
  )
}

function DeletedListCell({ className = '', style, children, ...rest }) {
  return (
    <div className={`quote-list-cell min-w-0 ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  )
}

function balanceClass(balance) {
  if (balance > 0) return 'customer-balance-positive'
  if (balance < 0) return 'customer-balance-negative'
  return 'customer-balance-zero'
}

const DATA_ROW_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel quote-deleted-list-row flex w-full items-center min-h-[4.75rem] quote-list-data-panel'

const DELETED_HEADER_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel quote-deleted-header-panel quote-list-data-panel flex h-[4.75rem] min-h-[4.75rem] max-h-[4.75rem] w-full items-center'

const DELETED_PANEL_WRAP_CLASS = 'quote-deleted-panel-wrap customer-deleted-archived-panel w-full'

const BASE_COLUMN_GRID = [
  'minmax(16rem, 2.4fr)',
  'minmax(9.25rem, 0.7fr)',
  'minmax(9.25rem, 0.7fr)',
  'minmax(9.25rem, 0.7fr)',
  '6.75rem',
  '6.5rem',
]

/**
 * Müşteriler / Tedarikçiler — silinen + arşivlenen kayıtlar.
 * Teklifler silinenler paneli ile aynı kart / grid dili.
 */
export default function CustomerDeletedArchivedPanel({
  title = 'Silinenler ve Arşivlenenler',
  listKind = 'customer',
  onRestored,
  emptyMessage = 'Silinen veya arşivlenen kayıt yok.',
  className = '',
}) {
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [restoringIds, setRestoringIds] = useState([])
  const [trashingIds, setTrashingIds] = useState([])
  const [movements] = useState(() => getTreasuryMovements())

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

  function exitBulkSelectMode() {
    setBulkSelectMode(false)
    setSelectedIds([])
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
      if (item.kind === 'archived') {
        restoreCustomer(item.record.id)
      } else {
        restoreDeletedCustomer(item.record)
      }
      onRestored?.(item.record, item)
      setRestoringIds((current) => current.filter((id) => id !== item.id))
      setVersion((current) => current + 1)
    }, 420)
  }

  function handlePermanentDelete(item) {
    if (!item?.record?.id || trashingIds.includes(item.id)) return
    setTrashingIds((current) => [...current, item.id])
    window.setTimeout(() => {
      permanentlyDeleteCustomer(item.record.id)
      setTrashingIds((current) => current.filter((id) => id !== item.id))
      setVersion((current) => current + 1)
    }, 420)
  }

  function handleBulkPermanentDelete() {
    const selected = new Set(selectedIds)
    const doomed = entries.filter((item) => selected.has(item.id) && item.record?.id)
    setTrashingIds((current) => [...current, ...doomed.map((item) => item.id)])
    window.setTimeout(() => {
      doomed.forEach((item) => permanentlyDeleteCustomer(item.record.id))
      exitBulkSelectMode()
      setTrashingIds([])
      setVersion((current) => current + 1)
    }, 420)
  }

  const allSelected = entries.length > 0 && selectedIds.length === entries.length
  const someSelected = selectedIds.length > 0 && !allSelected

  const rowGridTemplate = [
    ...(bulkSelectMode ? ['2.75rem'] : []),
    ...BASE_COLUMN_GRID.slice(0, -1),
    bulkSelectMode && selectedIds.length > 0 ? '6.5rem' : '6.5rem',
  ].join(' ')

  const headerMidStart = bulkSelectMode ? 2 : 1
  const headerMidEnd = -1
  const headerActionCol = -1

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

  const bulkWarningText =
    'Silme işlemini onaylamanız dahilinde artık bilgiler geri gelmeyecek. Silmek istediğinize emin misiniz?'

  const meta = readCustomerMeta()

  return (
    <div ref={panelRef} className={`${DELETED_PANEL_WRAP_CLASS} ${className}`.trim()}>
      <div className="quote-deleted-inline-shell w-full">
        <div className="quote-list-board quote-deleted-list-board w-full">
          <section
            role="button"
            tabIndex={0}
            aria-expanded={open}
            onClick={handleHeaderPanelClick}
            onKeyDown={handleHeaderPanelKeyDown}
            className={`card px-4 py-3 ${DELETED_HEADER_PANEL_CLASS}${
              bulkSelectMode ? ' quote-deleted-header-panel-open' : ''
            } cursor-pointer`}
          >
            <div
              className={`quote-list-row quote-deleted-header-row w-full min-w-0${
                bulkSelectMode && selectedIds.length > 0 ? ' is-bulk-confirm' : ''
              }${bulkSelectMode ? ' is-bulk-select' : ''}`}
              style={{ gridTemplateColumns: rowGridTemplate }}
            >
              {bulkSelectMode ? (
                <DeletedListCell
                  data-deleted-header-interactive
                  onClick={(event) => event.stopPropagation()}
                >
                  <DeletedBulkSelectCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    aria-label="Tümünü seç"
                    onChange={toggleSelectAll}
                  />
                </DeletedListCell>
              ) : null}

              <DeletedListCell
                className="quote-deleted-header-mid is-start"
                style={{ gridColumn: `${headerMidStart} / ${headerMidEnd}` }}
              >
                <div className="flex w-full min-w-0 items-center gap-2">
                  <span className="quote-deleted-header-title flex shrink-0 items-center gap-2">
                    <RedPingDot />
                    <span className={APP_LABEL_CLASS}>{title}</span>
                    {bulkSelectMode ? (
                      <span className={`${APP_LABEL_CLASS} shrink-0 opacity-50`} aria-hidden>
                        /
                      </span>
                    ) : null}
                  </span>

                  {bulkSelectMode ? (
                    <p className="quote-deleted-bulk-warning min-w-0 truncate px-1 text-[11px] font-medium leading-snug text-rose-600/90">
                      {bulkWarningText}
                    </p>
                  ) : null}

                  <span className="min-w-0 flex-1" aria-hidden />

                  <span className="quote-deleted-header-count inline-flex shrink-0 items-center justify-center gap-2">
                    <span className={`${APP_LABEL_CLASS} shrink-0`}>{entries.length} Kayıt</span>
                    <ChevronDown className={`${SP_CHEVRON_CLASS} ${open ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </DeletedListCell>

              <DeletedListCell
                className="quote-deleted-header-action-cell"
                style={{ gridColumn: headerActionCol }}
                data-deleted-header-interactive
                onClick={(event) => event.stopPropagation()}
              >
                {entries.length > 0 ? (
                  bulkSelectMode && selectedIds.length > 0 ? (
                    <span className="quote-deleted-header-sil-wrap">
                      <QuoteOrderInlineConfirm
                        label="Sil"
                        labelClass="quote-order-undo-sil"
                        ariaLabel={`${selectedIds.length} kayıt kalıcı silinsin mi?`}
                        onConfirm={handleBulkPermanentDelete}
                        onCancel={exitBulkSelectMode}
                      />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`quote-list-bulk-trash-btn${bulkSelectMode ? ' is-active' : ''}`}
                      title={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil'}
                      aria-label={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil modu'}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (!bulkSelectMode) {
                          setOpen(true)
                          setBulkSelectMode(true)
                          setSelectedIds([])
                          return
                        }
                        exitBulkSelectMode()
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
                const display = getCustomerDisplay(item.record || {})
                const settings = meta[item.record?.id] || {}
                const selected = getCustomerMetaSelection(item.record || {}, settings)
                const balance = getCustomerLedgerBalance(item.record || {}, movements)
                const stamp = formatWhen(item.at)
                const isSelected = selectedIds.includes(item.id)
                const isRestoring = restoringIds.includes(item.id)
                const isTrashing = trashingIds.includes(item.id)
                const isArchived = item.kind === 'archived'

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
                        style={{ gridTemplateColumns: rowGridTemplate }}
                        onClick={bulkSelectMode ? () => toggleSelect(item.id) : undefined}
                      >
                        {bulkSelectMode ? (
                          <DeletedListCell>
                            <DeletedBulkSelectCheckbox
                              checked={isSelected}
                              aria-label={`${item.label} seç`}
                              onChange={() => toggleSelect(item.id)}
                            />
                          </DeletedListCell>
                        ) : null}
                        <DeletedListCell>
                          <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                            <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                              {display.brandShortName || item.label}
                            </span>
                            {display.companyTitle ? (
                              <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                                {display.companyTitle}
                              </span>
                            ) : (
                              <span className="text-[12px] font-normal leading-tight text-[var(--muted)]/75">
                                {isArchived ? 'Arşivlendi' : 'Silindi'}
                                {stamp.date ? ` · ${stamp.date}` : ''}
                                {stamp.time ? ` ${stamp.time}` : ''}
                              </span>
                            )}
                          </span>
                        </DeletedListCell>
                        <DeletedListCell>
                          <span className={`${YF_TEXT_CLASS} text-center`}>
                            {selected.type || '—'}
                          </span>
                        </DeletedListCell>
                        <DeletedListCell>
                          <span className={`${YF_TEXT_CLASS} text-center`}>
                            {selected.representative || '—'}
                          </span>
                        </DeletedListCell>
                        <DeletedListCell>
                          <span className={`${YF_TEXT_CLASS} text-center`}>
                            {selected.scoring || '—'}
                          </span>
                        </DeletedListCell>
                        <DeletedListCell>
                          <span className={`${PAGE_BALANCE_AMOUNT_CLASS} ${balanceClass(balance)}`}>
                            {formatTreasuryCurrency(balance)}
                          </span>
                        </DeletedListCell>
                        <DeletedListCell>
                          {!bulkSelectMode ? (
                            <span
                              className="quote-order-action inline-flex h-9 items-center justify-center gap-1"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleRestore(item)}
                                disabled={isRestoring || isTrashing}
                                className="glass-sidebar-toggle glass-sidebar-collapse flex h-9 w-9 items-center justify-center rounded-xl"
                                title="Geri yükle"
                                aria-label={`${item.label} geri yükle`}
                              >
                                <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                              </button>
                              <Dropdown
                                align="end"
                                menuClassName="az customer-filter-dropdown-menu customers-page-menu min-w-[12rem]"
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="iconOnly"
                                    className="hover:!bg-transparent"
                                    aria-label="Diğer işlemler"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" strokeWidth={2.25} />
                                  </Button>
                                }
                              >
                                {({ close }) => (
                                  <>
                                    <DropdownItem
                                      icon={RotateCcw}
                                      label="Geri Yükle"
                                      tone="primary"
                                      close={close}
                                      onClick={() => handleRestore(item)}
                                    />
                                    <DropdownSeparator />
                                    <DropdownItem
                                      icon={Trash2}
                                      label="Kalıcı Sil"
                                      tone="danger"
                                      close={close}
                                      onClick={() => handlePermanentDelete(item)}
                                    />
                                  </>
                                )}
                              </Dropdown>
                            </span>
                          ) : null}
                        </DeletedListCell>
                      </div>
                    </AppPagePanel>
                  </div>
                )
              })
            : null}
        </div>
      </div>
    </div>
  )
}
