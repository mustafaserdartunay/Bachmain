import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Package, Receipt, Trash2, Truck } from 'lucide-react'
import { EmptyState } from '@bachmain/ui'
import SearchInput from '../../components/Common/SearchInput'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import SplitCreateButton from '../../components/Common/SplitCreateButton'
import QuoteDeletedArchivedPanel from '../../components/Common/QuoteDeletedArchivedPanel'
import QuoteOrderInlineConfirm from '../../components/Common/QuoteOrderInlineConfirm'
import ProcessListRowMoreMenu from '../../components/Common/ProcessListRowMoreMenu'
import {
  QuoteListCell,
  QuoteListColumnHeader,
  QuoteListRowPanel,
  QuoteListSelectionCheckbox,
  TurkishLiraIcon,
} from '../../components/Common/QuoteStyleListChrome'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../../components/Layout/AppPageLayout'
import EditableDropdownPill from '../../components/EditableDropdownPill'
import { getListCustomerDisplay } from '../../data/customerProfiles'
import { computeDepoLineTotals, customerLabel, formatQty } from '../../utils/depoHelpers'
import { formatTL } from '../../utils/productPricing'
import {
  deleteDepoItem,
  loadDepoItems,
  permanentlyDeleteDepoItem,
  restoreDeletedDepoItem,
  syncDepoFromProduction,
} from '../../utils/depoStore'
import { getDepoItemStatusLabel, isDepoItemDelivered } from '../../utils/depoStageHelpers'
import { getDepoStageFilterOptions, loadDepoWorkflowStages } from '../../utils/depoWorkflowStages'
import { loadTrips } from '../../utils/sevkiyatStore'
import { resolveQuoteCode } from '../../utils/documentCodes'
import { formatListDateParts } from '../../utils/quoteListDateFormat'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { COP_KUTUSU_ICON_CLASS } from '../../utils/buttonStyles'
import {
  PAGE_BALANCE_AMOUNT_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  YF_TEXT_CLASS,
} from '../../utils/dashboardDesign'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }

function compareSortValue(a, b, dir) {
  const sign = dir === 'desc' ? -1 : 1
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * sign
  return String(a || '').localeCompare(String(b || ''), 'tr', { numeric: true }) * sign
}

export default function DeliveredPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() => loadDepoItems())
  const [trips, setTrips] = useState(() => loadTrips())
  const [depoStages, setDepoStages] = useState(() => loadDepoWorkflowStages())
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ status: 'Tümü' })
  const [activeMenu, setActiveMenu] = useState(null)
  const [listColumnSort, setListColumnSort] = useState({ key: null, dir: 'asc' })
  const listColumnSortRef = useRef(listColumnSort)
  listColumnSortRef.current = listColumnSort
  const listColumnSortLockRef = useRef(false)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [animatingDeleteIds, setAnimatingDeleteIds] = useState([])
  const [archiveReceiveKey, setArchiveReceiveKey] = useState(0)

  function refresh() {
    syncDepoFromProduction()
    setItems(loadDepoItems())
    setTrips(loadTrips())
    setDepoStages(loadDepoWorkflowStages())
  }

  useEffect(() => {
    refresh()
    window.addEventListener('bach:depo-updated', refresh)
    window.addEventListener('bach:production-updated', refresh)
    window.addEventListener('bach:sevkiyat-updated', refresh)
    window.addEventListener('bach:depo-workflow-stages-updated', refresh)
    return () => {
      window.removeEventListener('bach:depo-updated', refresh)
      window.removeEventListener('bach:production-updated', refresh)
      window.removeEventListener('bach:sevkiyat-updated', refresh)
      window.removeEventListener('bach:depo-workflow-stages-updated', refresh)
    }
  }, [])

  useEffect(() => {
    if (!activeMenu) return undefined
    function closeActiveMenu() {
      setActiveMenu(null)
    }
    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  const deliveredItems = useMemo(
    () => items.filter((item) => isDepoItemDelivered(item, depoStages)),
    [items, depoStages],
  )

  const statusFilterOptions = useMemo(() => {
    const labels = Array.from(
      new Set(
        deliveredItems.map((item) => getDepoItemStatusLabel(item, depoStages)).filter(Boolean),
      ),
    )
    return [filterAllOption, ...labels.map((label) => ({ label, color: 'bg-emerald-500' }))]
  }, [deliveredItems, depoStages])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return deliveredItems.filter((item) => {
      const haystack =
        `${item.product} ${item.orderId} ${item.productionJobId} ${item.productionCode} ${customerLabel(item.customer)}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      if (filters.status !== 'Tümü' && getDepoItemStatusLabel(item, depoStages) !== filters.status)
        return false
      return true
    })
  }, [deliveredItems, searchQuery, filters, depoStages])

  const listItems = useMemo(() => {
    if (!listColumnSort.key) return filteredItems
    const dir = listColumnSort.dir
    const ids = items.map((item) => item.id)
    return [...filteredItems].sort((a, b) => {
      const valueOf = (item) => {
        if (listColumnSort.key === 'date') return item.deliveredAt || item.createdAt || ''
        if (listColumnSort.key === 'code')
          return item.productionCode || resolveQuoteCode(item.id, ids)
        if (listColumnSort.key === 'customer') {
          const display = getListCustomerDisplay(item.customer)
          return (
            display.brandShortName || display.companyTitle || customerLabel(item.customer) || ''
          )
        }
        if (listColumnSort.key === 'process') return getDepoItemStatusLabel(item, depoStages)
        if (listColumnSort.key === 'qty')
          return Number(item.deliveredQuantity) || Number(item.quantity) || 0
        if (listColumnSort.key === 'amount') return computeDepoLineTotals(item).gross
        return ''
      }
      return compareSortValue(valueOf(a), valueOf(b), dir)
    })
  }, [filteredItems, listColumnSort, items, depoStages])

  const summary = useMemo(() => {
    const quantity = deliveredItems.reduce(
      (sum, item) =>
        sum +
        (Number(item.deliveredQuantity) ||
          Number(item.quantity) ||
          Number(item.producedQuantity) ||
          0),
      0,
    )
    const amount = deliveredItems.reduce((sum, item) => sum + computeDepoLineTotals(item).gross, 0)
    const invoiced = deliveredItems.filter((item) => item.invoiceNo).length
    const tripDelivered = trips.filter((trip) => trip.status === 'delivered').length
    return {
      total: deliveredItems.length,
      quantity,
      amount,
      invoiced,
      tripDelivered,
    }
  }, [deliveredItems, trips])

  function toggleListColumnSort(key) {
    if (listColumnSortLockRef.current) return
    listColumnSortLockRef.current = true
    window.setTimeout(() => {
      listColumnSortLockRef.current = false
    }, 0)
    const current = listColumnSortRef.current
    const next =
      current.key !== key
        ? { key, dir: 'asc' }
        : { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    listColumnSortRef.current = next
    setListColumnSort(next)
  }

  function exitBulkSelectMode() {
    setBulkSelectMode(false)
    setSelectedIds([])
  }

  function toggleBulkSelect(id) {
    const key = String(id)
    setSelectedIds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  function toggleBulkSelectAll(ids) {
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id))
    setSelectedIds(allSelected ? [] : ids)
  }

  function softDeleteItemWithAnimation(item) {
    if (!item?.id) return
    const key = String(item.id)
    setAnimatingDeleteIds((current) => [...current, key])
    window.setTimeout(() => {
      deleteDepoItem(item.id)
      refresh()
      setAnimatingDeleteIds((current) => current.filter((entry) => entry !== key))
      setArchiveReceiveKey((current) => current + 1)
      flushWorkspaceNow()
    }, 880)
  }

  function handleBulkDelete() {
    listItems
      .filter((item) => selectedIds.includes(String(item.id)))
      .forEach((item) => softDeleteItemWithAnimation(item))
    exitBulkSelectMode()
  }

  const listItemIds = listItems.map((item) => String(item.id))
  const allVisibleSelected =
    listItemIds.length > 0 && listItemIds.every((id) => selectedIds.includes(id))
  const someVisibleSelected =
    listItemIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected
  const deliveredListBaseColumnGrid = [
    '6.5rem',
    '4.75rem',
    'minmax(16rem, 2.4fr)',
    'minmax(9.25rem, 0.7fr)',
    '6.5rem',
    '6.75rem',
    '3rem',
  ]
  const deliveredListColumnGrid = [
    ...(bulkSelectMode ? ['2.75rem'] : []),
    ...deliveredListBaseColumnGrid.slice(0, -1),
    bulkSelectMode && selectedIds.length > 0 ? '6.5rem' : '3rem',
  ].join(' ')

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="TESLİM EDİLENLER"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <SplitCreateButton
            label="Yeni Teslimat İşlemi"
            onPrimaryClick={() => navigate('/depo')}
            menuAriaLabel="Teslimat seçenekleri"
            menuItems={[
              {
                id: 'depo',
                label: 'Depodan Devam Et',
                icon: Package,
                iconClassName: 'text-blue-300',
                onClick: () => navigate('/depo'),
              },
              {
                id: 'logistics',
                label: 'Lojistik Planına Git',
                icon: Truck,
                iconClassName: 'text-emerald-300',
                onClick: () => navigate('/lojistik/planlanan'),
              },
            ]}
          />
        }
      />

      <SummaryMetrics
        columns={5}
        className="customer-summary-metrics w-full"
        items={[
          {
            title: 'Teslim Edilen',
            value: summary.total,
            icon: CheckCircle2,
            valueTone: 'text-violet-800',
          },
          {
            title: 'Toplam Adet',
            value: formatQty(summary.quantity),
            icon: Package,
            tone: 'emerald',
            valueTone: 'text-blue-800',
          },
          {
            title: 'Toplam Tutar',
            value: formatTL(summary.amount),
            icon: TurkishLiraIcon,
            tone: 'orange',
            valueTone: 'text-emerald-800',
          },
          {
            title: 'Faturalanan',
            value: summary.invoiced,
            icon: Receipt,
            tone: 'purple',
            valueTone: 'text-[#ea580c]',
          },
          {
            title: 'Sevkiyat Teslim',
            value: summary.tripDelivered,
            icon: Truck,
            tone: 'orange',
            valueTone: 'text-emerald-800',
          },
        ]}
      />

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-2 px-1">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Filtre :</span>
          </div>
          <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Durum :</p>
              <EditableDropdownPill
                value={filters.status}
                options={statusFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="filter-delivered-status"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
              />
            </div>
          </div>
        </div>
      </AppPagePanel>

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full min-w-0 items-center gap-3 px-1">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Teslim Listesi :</span>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sipariş, ürün veya müşteri ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>{filteredItems.length} Kayıt</span>
        </div>
      </AppPagePanel>

      {listItems.length === 0 ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <EmptyState
            title="Teslim edilen kayıt yok."
            description="Depodan çıkan ve müşteriye teslim edilen kalemler burada listelenir."
          />
        </AppPagePanel>
      ) : null}

      <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
        <div className="quote-teklifler-list-stack flex min-w-[56rem] w-full flex-col gap-5">
          {listItems.length > 0 ? (
            <div className="quote-list-board">
              <QuoteListRowPanel header gridTemplate={deliveredListColumnGrid}>
                {bulkSelectMode ? (
                  <QuoteListCell>
                    <QuoteListSelectionCheckbox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      aria-label="Tümünü seç"
                      onChange={() => toggleBulkSelectAll(listItemIds)}
                    />
                  </QuoteListCell>
                ) : null}
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Tarih"
                    sortable
                    sortKey="date"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Kod"
                    sortable
                    sortKey="code"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Müşteri Adı"
                    sortable
                    sortKey="customer"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Süreç"
                    sortable
                    sortKey="process"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Adet"
                    sortable
                    sortKey="qty"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Tutar"
                    sortable
                    sortKey="amount"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  {bulkSelectMode && selectedIds.length > 0 ? (
                    <QuoteOrderInlineConfirm
                      label="Sil"
                      labelClass="quote-order-undo-sil"
                      ariaLabel={`${selectedIds.length} teslim kaydı silinsin mi?`}
                      onConfirm={handleBulkDelete}
                      onCancel={exitBulkSelectMode}
                    />
                  ) : (
                    <button
                      type="button"
                      className={`quote-list-bulk-trash-btn${bulkSelectMode ? ' is-active' : ''}`}
                      title={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil'}
                      aria-label={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil modu'}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (!bulkSelectMode) {
                          setBulkSelectMode(true)
                          setSelectedIds([])
                          return
                        }
                        exitBulkSelectMode()
                      }}
                    >
                      <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                    </button>
                  )}
                </QuoteListCell>
              </QuoteListRowPanel>

              {listItems.map((item, rowIndex) => {
                const stamp = formatListDateParts(item.deliveredAt || item.createdAt)
                const display = getListCustomerDisplay(item.customer)
                const itemKey = String(item.id)
                const isBulkSelected = selectedIds.includes(itemKey)
                const isAnimatingOut = animatingDeleteIds.includes(itemKey)
                const incomingQuantity = Math.max(
                  0,
                  Number(item.deliveredQuantity) ||
                    Number(item.quantity) ||
                    Number(item.producedQuantity) ||
                    0,
                )
                const statusLabel = getDepoItemStatusLabel(item, depoStages)
                const totals = computeDepoLineTotals(item)
                return (
                  <div
                    key={item.id}
                    className={
                      isAnimatingOut
                        ? 'quote-list-row-into-trash-wrap'
                        : bulkSelectMode
                          ? undefined
                          : 'cursor-pointer'
                    }
                    style={
                      isAnimatingOut
                        ? { animationDelay: `${Math.min(rowIndex, 6) * 70}ms` }
                        : undefined
                    }
                    role={bulkSelectMode && !isAnimatingOut ? undefined : 'button'}
                    tabIndex={bulkSelectMode && !isAnimatingOut ? undefined : 0}
                    onClick={() => {
                      if (isAnimatingOut) return
                      if (bulkSelectMode) toggleBulkSelect(item.id)
                      else navigate('/depo')
                    }}
                    onKeyDown={(event) => {
                      if (bulkSelectMode || isAnimatingOut) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate('/depo')
                      }
                    }}
                  >
                    <QuoteListRowPanel
                      gridTemplate={deliveredListColumnGrid}
                      className={isBulkSelected ? 'ring-1 ring-blue-400/35' : ''}
                    >
                      {bulkSelectMode ? (
                        <QuoteListCell>
                          <QuoteListSelectionCheckbox
                            checked={isBulkSelected}
                            aria-label={`${item.product || item.id} seç`}
                            onChange={() => toggleBulkSelect(item.id)}
                          />
                        </QuoteListCell>
                      ) : null}
                      <QuoteListCell>
                        {stamp.date ? (
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
                        ) : (
                          <span className="block text-center text-[14px] font-normal text-[var(--muted)]">
                            —
                          </span>
                        )}
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className={`${YF_TEXT_CLASS} tabular-nums`}>
                          {item.productionCode ||
                            resolveQuoteCode(
                              item.id,
                              items.map((entry) => entry.id),
                            )}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                          <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                            {display.brandShortName ||
                              customerLabel(item.customer) ||
                              'Müşteri girilmedi'}
                          </span>
                          {display.companyTitle ? (
                            <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                              {display.companyTitle}
                            </span>
                          ) : item.product ? (
                            <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                              {item.product}
                            </span>
                          ) : null}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span
                          className="flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EditableDropdownPill
                            value={statusLabel || 'Teslim Edildi'}
                            options={statusFilterOptions.filter(
                              (option) => option.label !== 'Tümü',
                            )}
                            includePlaceholderOption={false}
                            editable={false}
                            buttonClassName={PAGE_LIST_PILL_CLASS}
                            wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                            menuClassName={PAGE_FILTER_MENU_CLASS}
                            menuMatchWidth={false}
                            openKey={`${item.id}-process`}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onChange={() => {}}
                          />
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}>
                          {formatQty(incomingQuantity)}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}>
                          {formatTL(totals.gross)}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span
                          className="inline-flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ProcessListRowMoreMenu
                            record={item}
                            deleteAriaLabel="Teslim kaydı sil"
                            onEdit={() => navigate('/depo')}
                            onDelete={() => softDeleteItemWithAnimation(item)}
                            extraItems={[
                              {
                                id: 'depo',
                                icon: Package,
                                label: 'Depoda Gör',
                                tone: 'primary',
                                onClick: () => navigate('/depo'),
                              },
                            ]}
                          />
                        </span>
                      </QuoteListCell>
                    </QuoteListRowPanel>
                  </div>
                )
              })}
            </div>
          ) : null}

          <QuoteDeletedArchivedPanel
            layoutMode="inline"
            title="Silinenler"
            collection="depo"
            storeEvent="bach:depo-updated"
            restoreRecord={restoreDeletedDepoItem}
            permanentlyDelete={permanentlyDeleteDepoItem}
            resolveCode={(id, extraIds) => {
              const item = items.find((entry) => entry.id === id)
              return item?.productionCode || resolveQuoteCode(id, extraIds)
            }}
            onRestored={() => {
              refresh()
              flushWorkspaceNow()
            }}
            emptyMessage="Silinen teslim kaydı yok."
            receivePulseKey={archiveReceiveKey}
            className="customer-deleted-archived-panel w-full"
            segmentTabs={[{ id: 'process', label: 'Süreç' }]}
            getProcessValue={(item) => getDepoItemStatusLabel(item, depoStages) || '—'}
            getProcessOptions={() =>
              getDepoStageFilterOptions(depoStages).filter((option) => option.label !== 'Tümü')
            }
            getListAmount={(item) => computeDepoLineTotals(item).gross}
            columnGrid={deliveredListBaseColumnGrid.join(' ')}
          />
        </div>
      </div>
    </AppPageShell>
  )
}
