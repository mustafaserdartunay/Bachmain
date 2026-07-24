import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Handshake,
  Link2,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react'
import { DataTable } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import { useNavigate } from 'react-router-dom'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import CustomerDeletedArchivedPanel from '../components/Common/CustomerDeletedArchivedPanel'
import SplitCreateButton from '../components/Common/SplitCreateButton'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { LIST_PILL_CLASS } from '../components/Common/ListDeleteConfirmPanel'
import { APP_FILTER_LABEL_CLASS } from '../utils/dashboardDesign'
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
  SUPPLIER_TYPE_LABEL,
  readCustomerMeta,
  readOptionLists,
  saveOptionList,
} from '../utils/customerMeta'
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
const LIST_PILL = `${LIST_PILL_CLASS} !justify-start !px-2.5 !text-xs !font-extrabold !tracking-wide !text-gray-300`
const LIST_PILL_LABEL = 'text-xs font-extrabold tracking-wide text-gray-300'

function balanceClass(balance) {
  if (balance > 0) return 'text-[#10b981]'
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
  const [filters, setFilters] = useState({
    type: 'Tümü',
    representative: 'Tümü',
    scoring: 'Tümü',
    balance: 'Tümü',
  })
  const [movements] = useState(() => getTreasuryMovements())
  const [customerProfiles, setCustomerProfiles] = useState(() => getCustomerProfiles())
  const [customerSettings, setCustomerSettings] = useState(readCustomerMeta)
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [b2bMap, setB2bMap] = useState(() => {
    const map = {}
    getCustomerProfiles().forEach((customer) => {
      map[customer.id] = getB2bAccess(customer.id)
    })
    return map
  })

  function updateOptionList(field, nextOptions) {
    setOptionLists((current) => ({ ...current, [field]: nextOptions }))
    saveOptionList(field, nextOptions)
  }

  useEffect(() => {
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refreshOptionLists)
    return () => window.removeEventListener('bach:option-lists-updated', refreshOptionLists)
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
      const matchesBalance =
        filters.balance === 'Tümü' ||
        (filters.balance === 'Alacak' && balance > 0) ||
        (filters.balance === 'Borç' && balance < 0) ||
        (filters.balance === 'Sıfır' && balance === 0)
      return (
        matchesQuery && matchesType && matchesRepresentative && matchesScoring && matchesBalance
      )
    })
  }, [scopedProfiles, customerSettings, filters, movements, searchQuery])

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
    const label = getCustomerDisplay(customer).brandShortName || customer.company || 'Kayıt'
    if (!window.confirm(`“${label}” silinsin mi? Kayıt silinenlere taşınır.`)) return
    deleteCustomer(customer.id)
    appendActivity(customer.id, 'Silindi', `${label} silindi`)
    setSelectedIds((ids) => ids.filter((id) => id !== customer.id))
    setCustomerProfiles(getCustomerProfiles())
  }

  function handleBulkDelete() {
    if (!selectedIds.length) return
    if (
      !window.confirm(`${selectedIds.length} kayıt silinsin mi? Seçilenler silinenlere taşınır.`)
    ) {
      return
    }
    selectedIds.forEach((id) => {
      const customer = customerProfiles.find((item) => item.id === id)
      const label = customer
        ? getCustomerDisplay(customer).brandShortName || customer.company || id
        : id
      deleteCustomer(id)
      appendActivity(id, 'Silindi', `${label} toplu silindi`)
    })
    setSelectedIds([])
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
        titleClassName="text-[#f59e0b]"
        backTo="/"
        backLabel="Güncel Durum"
        actions={
          <SplitCreateButton
            label={createLabel}
            onPrimaryClick={() => navigate(createPath)}
            menuAriaLabel={
              listKind === 'supplier' ? 'Tedarikçi seçenekleri' : 'Müşteri seçenekleri'
            }
            menuItems={
              listKind === 'supplier'
                ? [
                    {
                      id: 'supplier',
                      label: 'Hızlı Tedarikçi Oluştur',
                      icon: Handshake,
                      iconClassName: 'text-blue-300',
                      onClick: () => navigate(createPath),
                    },
                    {
                      id: 'customer',
                      label: 'Yeni Müşteri Oluştur',
                      icon: UserPlus,
                      iconClassName: 'text-emerald-300',
                      onClick: () => navigate('/musteriler/yeni'),
                    },
                  ]
                : [
                    {
                      id: 'customer',
                      label: 'Hızlı Müşteri Oluştur',
                      icon: UserPlus,
                      iconClassName: 'text-blue-300',
                      onClick: () => navigate(createPath),
                    },
                    {
                      id: 'supplier',
                      label: 'Yeni Tedarikçi Oluştur',
                      icon: Handshake,
                      iconClassName: 'text-emerald-300',
                      onClick: () => navigate('/musteriler/yeni?kind=supplier'),
                    },
                    {
                      id: 'finder',
                      label: 'Müşteri Bul',
                      icon: Search,
                      iconClassName: 'text-orange-300',
                      onClick: () => navigate('/saha-satis/musteri-bul'),
                    },
                  ]
            }
          />
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
            tone: 'text-[#10b981]',
            valueTone: 'text-[#10b981]',
            valueAlign: 'center',
          },
        ]}
      />

      <AppPagePanel
        title={listTitle}
        dotColor="blue"
        action={
          <div className="flex items-center gap-2">
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
            <span className={`${LIST_TEXT} shrink-0`}>{filteredCustomers.length} kayıt</span>
          </div>
        }
      >
        <div className="mb-4 space-y-3">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Marka veya ünvan ara..."
          />
          <div className="glass-inset app-filter-bar grid grid-cols-4 gap-3 py-3 pl-2.5 pr-3">
            <div className="min-w-0">
              <p className={`${APP_FILTER_LABEL_CLASS} pl-0`}>Tipi</p>
              <EditableDropdownPill
                value={filters.type}
                options={[filterAllOption, ...typeOptions]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL}
                labelClassName={LIST_PILL_LABEL}
                openKey="filter-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('type', value)}
              />
            </div>
            <div className="min-w-0">
              <p className={`${APP_FILTER_LABEL_CLASS} pl-0`}>Temsilci</p>
              <EditableDropdownPill
                value={filters.representative}
                options={[filterAllOption, ...optionLists.representative]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL}
                labelClassName={LIST_PILL_LABEL}
                openKey="filter-representative"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('representative', value)}
              />
            </div>
            <div className="min-w-0">
              <p className={`${APP_FILTER_LABEL_CLASS} pl-0`}>Puantaj</p>
              <EditableDropdownPill
                value={filters.scoring}
                options={[filterAllOption, ...optionLists.scoring]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL}
                labelClassName={LIST_PILL_LABEL}
                openKey="filter-scoring"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('scoring', value)}
              />
            </div>
            <div className="min-w-0">
              <p className={`${APP_FILTER_LABEL_CLASS} pl-0`}>Bakiye</p>
              <EditableDropdownPill
                value={filters.balance}
                options={balanceFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL}
                labelClassName={LIST_PILL_LABEL}
                openKey="filter-balance"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('balance', value)}
              />
            </div>
          </div>
        </div>

        <DataTable
          className="mt-3"
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
              header: columnLabel,
              sortable: true,
              accessorKey: 'name',
              sortValue: (customer) => getCustomerDisplay(customer).brandShortName,
              cell: (customer) => {
                const display = getCustomerDisplay(customer)
                return (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`shrink-0 truncate ${LIST_TEXT}`}>
                      {display.brandShortName}
                    </span>
                    <span className="truncate text-xs font-extrabold tracking-wide text-gray-400/80">
                      {display.companyTitle}
                    </span>
                  </span>
                )
              },
            },
            {
              id: 'type',
              header: 'Tipi',
              hideOnMobile: true,
              cell: (customer) => {
                const settings = customerSettings[customer.id] || {}
                const meta = getCustomerMetaSelection(customer, settings)
                return (
                  <span onClick={(event) => event.stopPropagation()}>
                    <EditableDropdownPill
                      value={resolveListColumnLabel(meta.type, optionLists.type)}
                      options={typeOptions}
                      onOptionsChange={(next) => updateOptionList('type', next)}
                      buttonClassName={LIST_PILL}
                      labelClassName={LIST_PILL_LABEL}
                      openKey={`${customer.id}-type`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => updateCustomerSetting(customer.id, 'type', value)}
                    />
                  </span>
                )
              },
            },
            {
              id: 'representative',
              header: 'Temsilci',
              hideOnMobile: true,
              cell: (customer) => {
                const settings = customerSettings[customer.id] || {}
                const meta = getCustomerMetaSelection(customer, settings)
                return (
                  <span onClick={(event) => event.stopPropagation()}>
                    <EditableDropdownPill
                      value={resolveListColumnLabel(
                        meta.representative,
                        optionLists.representative,
                      )}
                      options={optionLists.representative}
                      onOptionsChange={(next) => updateOptionList('representative', next)}
                      buttonClassName={LIST_PILL}
                      labelClassName={LIST_PILL_LABEL}
                      openKey={`${customer.id}-representative`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) =>
                        updateCustomerSetting(customer.id, 'representative', value)
                      }
                    />
                  </span>
                )
              },
            },
            {
              id: 'scoring',
              header: 'Puantaj',
              hideOnMobile: true,
              cell: (customer) => {
                const settings = customerSettings[customer.id] || {}
                const meta = getCustomerMetaSelection(customer, settings)
                return (
                  <span onClick={(event) => event.stopPropagation()}>
                    <EditableDropdownPill
                      value={resolveListColumnLabel(meta.scoring, optionLists.scoring)}
                      options={optionLists.scoring}
                      onOptionsChange={(next) => updateOptionList('scoring', next)}
                      buttonClassName={LIST_PILL}
                      labelClassName={LIST_PILL_LABEL}
                      openKey={`${customer.id}-scoring`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => updateCustomerSetting(customer.id, 'scoring', value)}
                    />
                  </span>
                )
              },
            },
            {
              id: 'balance',
              header: 'Güncel Bakiye',
              sortable: true,
              className: 'text-right',
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
          getRowActions={(customer) => [
            {
              id: 'edit',
              label: 'Düzenle',
              icon: Pencil,
              onClick: () =>
                navigate(
                  listKind === 'supplier'
                    ? `/musteriler/yeni?edit=${customer.id}&kind=supplier`
                    : `/musteriler/yeni?edit=${customer.id}`,
                ),
            },
            b2bMap[customer.id]?.enabled
              ? {
                  id: 'portal',
                  label: 'B2B Bağlantı',
                  icon: Link2,
                  onClick: () =>
                    window.open(
                      getPortalUrl(b2bMap[customer.id].accessToken),
                      '_blank',
                      'noreferrer',
                    ),
                }
              : {
                  id: 'grant',
                  label: 'B2B Bağlantı',
                  icon: Link2,
                  onClick: () => grantB2bAccess(null, customer.id),
                },
            {
              id: 'delete',
              label: 'Sil',
              icon: Trash2,
              tone: 'danger',
              onClick: () => handleDeleteCustomer(customer),
            },
          ]}
        />
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
