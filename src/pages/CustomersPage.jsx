import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Handshake, Link2, UserPlus, Users, WalletCards } from 'lucide-react'
import { DataTable } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import { useNavigate } from 'react-router-dom'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import CustomerDeletedArchivedPanel from '../components/Common/CustomerDeletedArchivedPanel'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { LIST_PILL_CLASS } from '../components/Common/ListDeleteConfirmPanel'
import { APP_FILTER_LABEL_CLASS } from '../utils/dashboardDesign'
import { getCustomerProfiles } from '../data/customerProfiles'
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

function balanceClass(balance) {
  if (balance > 0) return 'text-emerald-600'
  if (balance < 0) return 'text-red-600'
  return 'text-orange-600'
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
    event.stopPropagation()
    const access = enableB2bAccess(customerId)
    setB2bMap((current) => ({ ...current, [customerId]: access }))
    appendActivity(customerId, 'B2B', 'Müşteri paneli erişimi verildi')
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
        title={
          <span className="inline-flex min-w-0 items-center gap-2 text-[var(--muted)]">
            {listKind === 'supplier' ? (
              <Handshake className="h-5 w-5 shrink-0" />
            ) : (
              <Users className="h-5 w-5 shrink-0" />
            )}
            <span className="truncate">{pageTitle}</span>
          </span>
        }
        titleClassName="!text-[var(--muted)]"
        actions={
          <button
            type="button"
            onClick={() => navigate(createPath)}
            className="inline-flex items-center gap-2 bg-transparent p-0 text-xl font-extrabold tracking-wide text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
          >
            <UserPlus className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">{createLabel}</span>
          </button>
        }
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: totalLabel, value: scopedProfiles.length, icon: Users },
          {
            title: 'Aktif Cari',
            value: filteredCustomers.length,
            icon: CheckCircle2,
            tone: 'emerald',
            valueTone: 'emerald',
          },
          {
            title: 'Toplam Ödenecek',
            value: formatTreasuryCurrency(totalPayable),
            icon: WalletCards,
            tone: 'purple',
            valueTone: 'red',
          },
          {
            title: 'Toplam Tahsil Edilecek',
            value: formatTreasuryCurrency(totalReceivable),
            icon: WalletCards,
            tone: 'orange',
            valueTone: 'emerald',
          },
        ]}
      />

      <AppPagePanel>
        <div className="space-y-3">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Marka veya ünvan ara..."
          />
          <div className="app-filter-bar grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-inset grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl p-2.5">
              <p className={`${APP_FILTER_LABEL_CLASS} !mb-0 shrink-0`}>Tipi</p>
              <EditableDropdownPill
                value={filters.type}
                options={[filterAllOption, ...typeOptions]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL_CLASS}
                openKey="filter-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('type', value)}
              />
            </div>
            <div className="glass-inset grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl p-2.5">
              <p className={`${APP_FILTER_LABEL_CLASS} !mb-0 shrink-0`}>Temsilci</p>
              <EditableDropdownPill
                value={filters.representative}
                options={[filterAllOption, ...optionLists.representative]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL_CLASS}
                openKey="filter-representative"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('representative', value)}
              />
            </div>
            <div className="glass-inset grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl p-2.5">
              <p className={`${APP_FILTER_LABEL_CLASS} !mb-0 shrink-0`}>Puantaj</p>
              <EditableDropdownPill
                value={filters.scoring}
                options={[filterAllOption, ...optionLists.scoring]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL_CLASS}
                openKey="filter-scoring"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('scoring', value)}
              />
            </div>
            <div className="glass-inset grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl p-2.5">
              <p className={`${APP_FILTER_LABEL_CLASS} !mb-0 shrink-0`}>Bakiye</p>
              <EditableDropdownPill
                value={filters.balance}
                options={balanceFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL_CLASS}
                openKey="filter-balance"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('balance', value)}
              />
            </div>
          </div>
        </div>
      </AppPagePanel>

      <AppPagePanel
        title={listTitle}
        dotColor="blue"
        action={
          <span className="badge badge-blue shrink-0 !px-2 !py-0.5 !text-[12px]">
            {filteredCustomers.length} kayıt
          </span>
        }
      >
        <DataTable
          emptyTitle={emptyTitle}
          emptyDescription="Arama veya segment filtresini değiştirin."
          data={filteredCustomers}
          getRowId={(customer) => customer.id}
          onRowClick={(customer) => navigate(`/musteriler/${customer.id}`)}
          columns={[
            {
              id: 'name',
              header: columnLabel,
              sortable: true,
              accessorKey: 'name',
              cell: (customer) => {
                const display = getCustomerDisplay(customer)
                return (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 truncate font-semibold">
                      {display.brandShortName}
                    </span>
                    <span className="truncate text-ds-caption text-ds-muted">
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
                      buttonClassName={LIST_PILL_CLASS}
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
                      buttonClassName={LIST_PILL_CLASS}
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
                      buttonClassName={LIST_PILL_CLASS}
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
              cell: (customer) => {
                const balance = currentBalance(customer, movements)
                return (
                  <span className={`font-semibold tabular-nums ${balanceClass(balance)}`}>
                    {formatTreasuryCurrency(balance)}
                  </span>
                )
              },
            },
          ]}
          getRowActions={(customer) => [
            b2bMap[customer.id]?.enabled
              ? {
                  id: 'portal',
                  label: 'B2B Panel',
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
                  label: 'B2B İzin Ver',
                  icon: Link2,
                  onClick: () => grantB2bAccess({ stopPropagation() {} }, customer.id),
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
