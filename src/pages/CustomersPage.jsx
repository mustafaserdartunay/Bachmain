import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Link2, Pencil, Search, Trash2, Users, WalletCards } from 'lucide-react'
import { DataTable } from '@bachmain/ui'
import { useNavigate } from 'react-router-dom'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import CustomerDeletedArchivedPanel from '../components/Common/CustomerDeletedArchivedPanel'
import SplitCreateButton from '../components/Common/SplitCreateButton'
import {
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import { LIST_PILL_CLASS, DeleteConfirmPopover } from '../components/Common/ListDeleteConfirmPanel'
import { APP_PANEL_TITLE_CLASS } from '../utils/dashboardDesign'
import { deleteCustomer, getCustomerProfiles } from '../data/customerProfiles'
import { appendActivity } from '../utils/customerActivity'
import {
  formatTreasuryCurrency,
  getCustomerLedgerBalance,
  getTreasuryMovements,
} from '../utils/treasuryStore'
import { getCustomerDisplay } from '../utils/customerDisplay'
import {
  CUSTOMER_META_KEY,
  getCustomerMetaSelection,
  matchesPartyListFilter,
  notifyCustomerMetaUpdated,
  OPTION_LISTS_KEY,
  OPTION_LISTS_UPDATED_EVENT,
  SUPPLIER_TYPE_LABEL,
  readCustomerMeta,
  readOptionLists,
  saveOptionList,
} from '../utils/customerMeta'
import { CUSTOM_PROCESS_PANELS_EVENT } from '../utils/customProcessPanelsStore'
import {
  CUSTOMER_PROCESS_ORDER_EVENT,
  resolveCustomerProcessRows,
  syncCustomerProcessOrderWithPanels,
} from '../utils/customerProcessOrderStore'
import EditableDropdownPill from '../components/EditableDropdownPill'
import { resolveListColumnLabel } from '../components/DocumentEditor/processPanelUtils'
import { enableB2bAccess, getB2bAccess, getPortalUrl } from '../utils/b2bPortalStore'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
const balanceFilterOptions = [
  filterAllOption,
  { label: 'Alacak', color: 'bg-emerald-500' },
  { label: 'Borç', color: 'bg-red-500' },
  { label: 'Sıfır', color: 'bg-orange-500' },
]

const LIST_TEXT = 'text-xs font-extrabold tracking-wide text-gray-300'
const LIST_PILL = `${LIST_PILL_CLASS} !h-8 !min-h-0 !w-auto !max-w-full !justify-start !gap-1 !px-2.5 !text-xs !font-extrabold !tracking-wide !text-gray-300`
const LIST_CELL_PILL =
  'inline-flex h-8 min-h-0 w-auto max-w-full items-center justify-start gap-1 bg-transparent px-0 text-xs font-extrabold tracking-wide text-gray-300'
const LIST_PILL_LABEL = 'text-xs font-extrabold tracking-wide text-gray-300'
const LIST_META_COL = 'w-[1%] whitespace-nowrap !max-w-[8.5rem] px-1.5'
const LIST_NAME_COL = 'min-w-[9rem] !max-w-none w-[22%]'
const LIST_TITLE_COL = 'min-w-[12rem] !max-w-none w-[28%]'
const LIST_BALANCE_COL = 'w-[1%] whitespace-nowrap text-right'
const LIST_BAR_LABEL_CLASS = 'flex shrink-0 items-center gap-2'
const ROW_ICON_BTN =
  'inline-flex h-6 w-6 items-center justify-center rounded-md bg-transparent p-0 transition-colors'
const ROW_EDIT_BTN = `${ROW_ICON_BTN} text-[#3b82f6] hover:bg-[#3b82f6]/15 hover:text-[#60a5fa]`
const ROW_DELETE_BTN = `${ROW_ICON_BTN} text-[#f43f5e] hover:bg-[#f43f5e]/15 hover:text-[#fb7185]`
const ROW_B2B_BTN = `${ROW_ICON_BTN} text-[#10b981] hover:bg-[#10b981]/15 hover:text-[#34d399]`
const ROW_ICON_SIZE = 'h-3 w-3'

function balanceClass(balance) {
  if (balance > 0) return 'text-[#059669]'
  if (balance < 0) return 'text-[#e11d48]'
  return 'text-gray-300'
}

function currentBalance(customer, movements) {
  return getCustomerLedgerBalance(customer, movements)
}

export default function CustomersPage({
  pageTitle = 'Müşteriler',
  createLabel = 'Yeni Müşteri Oluştur',
  listTitle = 'Müşteriler Listesi',
  totalLabel = 'Toplam Müşteri',
  columnLabel = 'Müşteri',
  emptyTitle = 'Müşteri bulunamadı.',
  listKind = 'customer',
  createPath = '/musteriler/yeni',
}) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState(() => ({
    type: 'Tümü',
    representative: 'Tümü',
    scoring: 'Tümü',
    balance: 'Tümü',
  }))
  const [movements] = useState(() => getTreasuryMovements())
  const [customerProfiles, setCustomerProfiles] = useState(() => getCustomerProfiles())
  const [customerSettings, setCustomerSettings] = useState(readCustomerMeta)
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [customerProcessRows, setCustomerProcessRows] = useState(() => {
    syncCustomerProcessOrderWithPanels()
    return resolveCustomerProcessRows()
  })
  const [activeMenu, setActiveMenu] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [b2bMap, setB2bMap] = useState(() => {
    const map = {}
    getCustomerProfiles().forEach((customer) => {
      map[customer.id] = getB2bAccess(customer.id)
    })
    return map
  })

  function updateOptionList(field, nextVisible, visibleSnapshot = nextVisible) {
    let nextOptions = nextVisible
    if (field === 'type') {
      const visibleKeys = new Set(
        (visibleSnapshot || []).map((option) => option.id || option.label),
      )
      const preserved = (optionLists.type || []).filter(
        (option) => !visibleKeys.has(option.id) && !visibleKeys.has(option.label),
      )
      nextOptions = [...preserved, ...nextVisible]
    }
    const saved = saveOptionList(field, nextOptions)
    setOptionLists(saved)
  }

  useEffect(() => {
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    function refreshCustomerProcesses() {
      syncCustomerProcessOrderWithPanels()
      setCustomerProcessRows(resolveCustomerProcessRows())
      setOptionLists(readOptionLists())
    }
    function onStorage(event) {
      if (event.key === OPTION_LISTS_KEY || event.key === null) {
        refreshOptionLists()
      }
    }
    window.addEventListener(OPTION_LISTS_UPDATED_EVENT, refreshOptionLists)
    window.addEventListener(CUSTOM_PROCESS_PANELS_EVENT, refreshCustomerProcesses)
    window.addEventListener(CUSTOMER_PROCESS_ORDER_EVENT, refreshCustomerProcesses)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(OPTION_LISTS_UPDATED_EVENT, refreshOptionLists)
      window.removeEventListener(CUSTOM_PROCESS_PANELS_EVENT, refreshCustomerProcesses)
      window.removeEventListener(CUSTOMER_PROCESS_ORDER_EVENT, refreshCustomerProcesses)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    function refreshProfiles() {
      setCustomerProfiles(getCustomerProfiles())
      setCustomerSettings(readCustomerMeta())
    }
    window.addEventListener('bach:customers-updated', refreshProfiles)
    window.addEventListener('bach:customer-meta-updated', refreshProfiles)
    return () => {
      window.removeEventListener('bach:customers-updated', refreshProfiles)
      window.removeEventListener('bach:customer-meta-updated', refreshProfiles)
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

  const scopedProfiles = useMemo(
    () =>
      customerProfiles.filter((customer) => {
        const settings = customerSettings[customer.id] || {}
        const selected = getCustomerMetaSelection(customer, settings)
        return matchesPartyListFilter(selected.type, listKind)
      }),
    [customerProfiles, customerSettings, listKind],
  )

  const typeOptions = useMemo(() => {
    if (listKind === 'supplier') {
      return optionLists.type.filter((option) => option.label === SUPPLIER_TYPE_LABEL)
    }
    return optionLists.type.filter((option) => option.label !== SUPPLIER_TYPE_LABEL)
  }, [listKind, optionLists.type])

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR')
    return scopedProfiles.filter((customer) => {
      const settings = customerSettings[customer.id] || {}
      const selected = getCustomerMetaSelection(customer, settings)
      const balance = currentBalance(customer, movements)
      const display = getCustomerDisplay(customer)
      const brand = display.brandShortName.toLocaleLowerCase('tr-TR')
      const title = display.companyTitle.toLocaleLowerCase('tr-TR')
      const matchesQuery = !query || brand.includes(query) || title.includes(query)
      const matchesType = filters.type === 'Tümü' || selected.type === filters.type
      const matchesRepresentative =
        filters.representative === 'Tümü' || selected.representative === filters.representative
      const matchesScoring = filters.scoring === 'Tümü' || selected.scoring === filters.scoring
      const matchesCustomPanels = customerProcessRows
        .filter((row) => !row.builtin)
        .every((row) => {
          const filterValue = filters[row.fieldKey] || 'Tümü'
          if (filterValue === 'Tümü') return true
          return (selected[row.fieldKey] || '') === filterValue
        })
      const matchesBalance =
        filters.balance === 'Tümü' ||
        (filters.balance === 'Alacak' && balance > 0) ||
        (filters.balance === 'Borç' && balance < 0) ||
        (filters.balance === 'Sıfır' && balance === 0)
      return (
        matchesQuery &&
        matchesType &&
        matchesRepresentative &&
        matchesScoring &&
        matchesCustomPanels &&
        matchesBalance
      )
    })
  }, [scopedProfiles, customerSettings, filters, movements, searchQuery, customerProcessRows])

  const totalReceivable = scopedProfiles.reduce(
    (sum, customer) => Math.max(currentBalance(customer, movements), 0) + sum,
    0,
  )
  const totalPayable = scopedProfiles.reduce(
    (sum, customer) => Math.abs(Math.min(currentBalance(customer, movements), 0)) + sum,
    0,
  )

  function grantB2bAccess(event, customerId) {
    event?.stopPropagation?.()
    const access = enableB2bAccess(customerId)
    setB2bMap((current) => ({ ...current, [customerId]: access }))
    appendActivity(customerId, 'B2B', 'Müşteri paneli erişimi verildi')
  }

  function handleDeleteCustomer(customer) {
    const selectedSet = new Set(selectedIds.map(String))
    const customerId = String(customer.id)
    const ids =
      selectedSet.size > 0 && selectedSet.has(customerId) ? [...selectedSet] : [customerId]

    if (ids.length > 1) {
      setPendingDelete({
        ids,
        anchorId: customerId,
        source: 'row',
        title: `${ids.length} kayıt silinsin mi?`,
        description: 'Seçilen kayıtlar silinenlere taşınır.',
      })
      return
    }

    const label = getCustomerDisplay(customer).brandShortName || customer.company || 'Kayıt'
    setPendingDelete({
      ids,
      anchorId: customerId,
      source: 'row',
      title: 'Silinsin mi?',
      description: `“${label}” silinenlere taşınır.`,
    })
  }

  function handleBulkDelete() {
    if (!selectedIds.length) return
    setPendingDelete({
      ids: [...selectedIds],
      anchorId: null,
      source: 'bulk',
      title: `${selectedIds.length} kayıt silinsin mi?`,
      description: 'Seçilen kayıtlar silinenlere taşınır.',
    })
  }

  function confirmPendingDelete() {
    if (!pendingDelete?.ids?.length) {
      setPendingDelete(null)
      return
    }
    pendingDelete.ids.forEach((id) => {
      const customer = customerProfiles.find((item) => String(item.id) === String(id))
      const label = customer
        ? getCustomerDisplay(customer).brandShortName || customer.company || id
        : id
      deleteCustomer(id)
      appendActivity(id, 'Silindi', `${label} silindi`)
    })
    setSelectedIds((ids) => ids.filter((id) => !pendingDelete.ids.map(String).includes(String(id))))
    setPendingDelete(null)
    setCustomerProfiles(getCustomerProfiles())
  }

  function updateCustomerSetting(customerId, field, value) {
    setCustomerSettings((current) => {
      const next = {
        ...current,
        [customerId]: {
          ...(current[customerId] || {}),
          [field]: value,
        },
      }
      localStorage.setItem(CUSTOMER_META_KEY, JSON.stringify(next))
      notifyCustomerMetaUpdated({ customerId, field })
      return next
    })
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function handleRestoreDeletedOrArchived(record, item) {
    const label = getCustomerDisplay(record).brandShortName || record.company || 'Kayıt'
    const from = item?.kind === 'archived' ? 'arşivden' : 'silinenlerden'
    appendActivity(record.id, 'Geri Alındı', `${label} ${from} geri alındı`)
    setCustomerProfiles(getCustomerProfiles())
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={pageTitle}
        titleClassName="text-gray-300"
        backTo="/"
        backLabel="Güncel Durum"
        actions={
          <SplitCreateButton label={createLabel} onPrimaryClick={() => navigate(createPath)} />
        }
      />

      <SummaryMetrics
        columns={4}
        items={[
          {
            title: totalLabel,
            value: scopedProfiles.length,
            icon: Users,
            tone: 'text-[#8b5cf6]',
            valueTone: 'text-[#8b5cf6]',
            valueAlign: 'center',
          },
          {
            title: 'Aktif Cari',
            value: filteredCustomers.length,
            icon: CheckCircle2,
            tone: 'text-[#2563eb]',
            valueTone: 'text-[#2563eb]',
            valueAlign: 'center',
          },
          {
            title: 'Toplam Ödenecek',
            value: formatTreasuryCurrency(totalPayable),
            icon: WalletCards,
            tone: 'text-[#e11d48]',
            valueTone: 'text-[#e11d48]',
            valueAlign: 'center',
          },
          {
            title: 'Toplam Tahsil Edilecek',
            value: formatTreasuryCurrency(totalReceivable),
            icon: WalletCards,
            tone: 'text-[#059669]',
            valueTone: 'text-[#059669]',
            valueAlign: 'center',
          },
        ]}
      />

      <AppPagePanel>
        <div className="space-y-3">
          <div className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-3 gap-y-3">
            <div className={`${LIST_BAR_LABEL_CLASS} justify-self-end`}>
              <AppPanelDot color="orange" />
              <h2 className={APP_PANEL_TITLE_CLASS}>Filtrele :</h2>
            </div>
            <div className="glass-inset app-filter-bar flex h-10 min-w-0 items-center gap-3 px-2.5">
              <div className="grid min-w-0 flex-1 grid-cols-2 items-center gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {customerProcessRows.map((row) => {
                  const options =
                    row.fieldKey === 'type' ? typeOptions : optionLists[row.fieldKey] || []
                  return (
                    <EditableDropdownPill
                      key={row.fieldKey}
                      value={filters[row.fieldKey] || 'Tümü'}
                      options={[filterAllOption, ...options]}
                      includePlaceholderOption={false}
                      editable={false}
                      triggerLabel={`${row.title} :`}
                      buttonClassName={LIST_PILL}
                      labelClassName={LIST_PILL_LABEL}
                      openKey={`filter-${row.fieldKey}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => updateFilter(row.fieldKey, value)}
                    />
                  )
                })}
                <EditableDropdownPill
                  value={filters.balance}
                  options={balanceFilterOptions}
                  includePlaceholderOption={false}
                  editable={false}
                  triggerLabel="Bakiye :"
                  buttonClassName={LIST_PILL}
                  labelClassName={LIST_PILL_LABEL}
                  openKey="filter-balance"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateFilter('balance', value)}
                />
              </div>
            </div>
            <div className={LIST_BAR_LABEL_CLASS}>
              <AppPanelDot color="blue" />
              <h2 className={APP_PANEL_TITLE_CLASS}>{listTitle} :</h2>
            </div>
            <div className="glass-inset app-filter-bar flex h-10 min-w-0 items-center gap-3 px-2.5">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={listKind === 'supplier' ? 'Tedarikçi ara...' : 'Müşteri ara...'}
                  className="app-search-field h-8 w-full border-0 bg-transparent py-0 pl-6 pr-2 text-xs font-extrabold tracking-wide text-gray-300 shadow-none placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
              <div className="relative flex shrink-0 items-center gap-2">
                {selectedIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-transparent px-2.5 text-xs font-extrabold tracking-wide text-[#f43f5e] transition-colors hover:text-[#e11d48]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Toplu Sil ({selectedIds.length})
                  </button>
                ) : null}
                {pendingDelete?.source === 'bulk' ? (
                  <DeleteConfirmPopover
                    title={pendingDelete.title}
                    description={pendingDelete.description}
                    confirmLabel="Evet"
                    cancelLabel="Hayır"
                    onConfirm={confirmPendingDelete}
                    onCancel={() => setPendingDelete(null)}
                    className="absolute right-0 top-10 z-40 min-w-[18rem]"
                  />
                ) : null}
                <span className={`${LIST_TEXT} shrink-0`}>{filteredCustomers.length} kayıt</span>
              </div>
            </div>
          </div>

          <DataTable
            emptyTitle={emptyTitle}
            emptyDescription="Arama veya segment filtresini değiştirin."
            data={filteredCustomers}
            getRowId={(customer) => customer.id}
            selectable
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            onRowClick={(customer) => navigate(`/musteriler/${customer.id}`)}
            columns={[
              {
                id: 'name',
                header: `${columnLabel} Adı`,
                sortable: true,
                accessorKey: 'name',
                className: LIST_NAME_COL,
                sortValue: (customer) => getCustomerDisplay(customer).brandShortName,
                cell: (customer) => {
                  const display = getCustomerDisplay(customer)
                  return (
                    <span className={`block truncate ${LIST_TEXT}`}>{display.brandShortName}</span>
                  )
                },
              },
              {
                id: 'title',
                header: `${columnLabel} Ünvanı`,
                sortable: true,
                className: LIST_TITLE_COL,
                sortValue: (customer) => getCustomerDisplay(customer).companyTitle,
                cell: (customer) => {
                  const display = getCustomerDisplay(customer)
                  return (
                    <span className={`block truncate ${LIST_TEXT}`}>{display.companyTitle}</span>
                  )
                },
              },
              ...customerProcessRows.map((row) => ({
                id: row.fieldKey,
                header: row.title,
                hideOnMobile: true,
                className: LIST_META_COL,
                cell: (customer) => {
                  const settings = customerSettings[customer.id] || {}
                  const meta = getCustomerMetaSelection(customer, settings)
                  const options =
                    row.fieldKey === 'type' ? typeOptions : optionLists[row.fieldKey] || []
                  return (
                    <span onClick={(event) => event.stopPropagation()}>
                      <EditableDropdownPill
                        value={resolveListColumnLabel(meta[row.fieldKey] || '', options)}
                        options={options}
                        onOptionsChange={(next) => updateOptionList(row.fieldKey, next, options)}
                        buttonClassName={LIST_CELL_PILL}
                        labelClassName={LIST_PILL_LABEL}
                        openKey={`${customer.id}-${row.fieldKey}`}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onChange={(value) =>
                          updateCustomerSetting(customer.id, row.fieldKey, value)
                        }
                      />
                    </span>
                  )
                },
              })),
              {
                id: 'balance',
                header: 'Güncel Bakiye',
                sortable: true,
                className: LIST_BALANCE_COL,
                sortValue: (customer) => currentBalance(customer, movements),
                cell: (customer) => {
                  const balance = currentBalance(customer, movements)
                  return (
                    <span
                      className={`text-xs font-extrabold tracking-wide tabular-nums ${balanceClass(balance)}`}
                    >
                      {formatTreasuryCurrency(balance)}
                    </span>
                  )
                },
              },
            ]}
            renderRowActions={(customer) => (
              <>
                <button
                  type="button"
                  className={ROW_EDIT_BTN}
                  aria-label="Düzenle"
                  title="Düzenle"
                  onClick={() =>
                    navigate(
                      listKind === 'supplier'
                        ? `/musteriler/yeni?edit=${customer.id}&kind=supplier`
                        : `/musteriler/yeni?edit=${customer.id}`,
                    )
                  }
                >
                  <Pencil className={ROW_ICON_SIZE} />
                </button>
                <button
                  type="button"
                  className={ROW_DELETE_BTN}
                  aria-label="Sil"
                  title="Sil"
                  onClick={() => handleDeleteCustomer(customer)}
                >
                  <Trash2 className={ROW_ICON_SIZE} />
                </button>
                <button
                  type="button"
                  className={ROW_B2B_BTN}
                  aria-label="B2B Bağlantı"
                  title="B2B Bağlantı"
                  onClick={() => {
                    if (b2bMap[customer.id]?.enabled) {
                      window.open(
                        getPortalUrl(b2bMap[customer.id].accessToken),
                        '_blank',
                        'noreferrer',
                      )
                      return
                    }
                    grantB2bAccess(null, customer.id)
                  }}
                >
                  <Link2 className={ROW_ICON_SIZE} />
                </button>
              </>
            )}
            renderRowActionOverlay={(customer) =>
              pendingDelete?.source === 'row' &&
              String(pendingDelete.anchorId) === String(customer.id) ? (
                <DeleteConfirmPopover
                  title={pendingDelete.title}
                  description={pendingDelete.description}
                  confirmLabel="Evet"
                  cancelLabel="Hayır"
                  onConfirm={confirmPendingDelete}
                  onCancel={() => setPendingDelete(null)}
                  className="absolute right-0 top-10 z-50 min-w-[18rem]"
                />
              ) : null
            }
          />
        </div>
      </AppPagePanel>

      <CustomerDeletedArchivedPanel
        title="Silinenler ve Arşivlenenler"
        listKind={listKind}
        onRestored={handleRestoreDeletedOrArchived}
        emptyMessage={
          listKind === 'supplier'
            ? 'Silinen veya arşivlenen tedarikçi yok.'
            : 'Silinen veya arşivlenen müşteri yok.'
        }
      />
    </AppPageShell>
  )
}
