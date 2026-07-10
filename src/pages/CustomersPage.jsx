import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Link2, Plus, Users, WalletCards } from 'lucide-react'
import SearchInput from '../components/Common/SearchInput'
import { Link, useNavigate } from 'react-router-dom'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { LIST_PILL_CLASS } from '../components/Common/ListDeleteConfirmPanel'
import {
  APP_FILTER_LABEL_CLASS,
  APP_LABEL_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_VALUE_CLASS,
} from '../utils/dashboardDesign'
import { getCustomerProfiles, restoreCustomer, restoreDeletedCustomer } from '../data/customerProfiles'
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
import {
  enableB2bAccess,
  getB2bAccess,
  getPortalUrl,
} from '../utils/b2bPortalStore'

const listGrid = 'minmax(220px,1fr) 140px 140px 160px 150px 120px'
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
  archiveModule = 'customers',
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

  const scopedProfiles = useMemo(() => (
    customerProfiles.filter((customer) => {
      const settings = customerSettings[customer.id] || {}
      const selected = getCustomerMetaSelection(customer, settings)
      return matchesPartyListFilter(selected.type, listKind)
    })
  ), [customerProfiles, customerSettings, listKind])

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
      const matchesRepresentative = filters.representative === 'Tümü' || selected.representative === filters.representative
      const matchesScoring = filters.scoring === 'Tümü' || selected.scoring === filters.scoring
      const matchesBalance = filters.balance === 'Tümü'
        || (filters.balance === 'Alacak' && balance > 0)
        || (filters.balance === 'Borç' && balance < 0)
        || (filters.balance === 'Sıfır' && balance === 0)
      return matchesQuery && matchesType && matchesRepresentative && matchesScoring && matchesBalance
    })
  }, [scopedProfiles, customerSettings, filters, movements, searchQuery])

  const totalReceivable = scopedProfiles.reduce((sum, customer) => Math.max(currentBalance(customer, movements), 0) + sum, 0)
  const totalPayable = scopedProfiles.reduce((sum, customer) => Math.abs(Math.min(currentBalance(customer, movements), 0)) + sum, 0)

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

  function handleRestoreArchiveEntry(entry) {
    const snapshot = entry.snapshot
    if (!snapshot?.id) return false
    if (entry.action === 'archive') {
      restoreCustomer(snapshot.id)
    } else if (entry.action === 'delete') {
      restoreDeletedCustomer(snapshot)
    } else {
      return false
    }
    appendActivity(snapshot.id, 'Geri Alındı', `${entry.entityLabel || 'Kayıt'} ${entry.action === 'archive' ? 'arşivden' : 'silinmeden'} geri alındı`)
    setCustomerProfiles(getCustomerProfiles())
    return true
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={pageTitle}
        actions={(
          <Link to={createPath} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm">
            <Plus className="h-4 w-4" /> {createLabel}
          </Link>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: totalLabel, value: scopedProfiles.length, icon: Users },
          { title: 'Aktif Cari', value: filteredCustomers.length, icon: CheckCircle2, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Toplam Ödenecek', value: formatTreasuryCurrency(totalPayable), icon: WalletCards, tone: 'purple', valueTone: 'red' },
          { title: 'Toplam Tahsil Edilecek', value: formatTreasuryCurrency(totalReceivable), icon: WalletCards, tone: 'orange', valueTone: 'emerald' },
        ]}
      />

      <AppPagePanel
        title={listTitle}
        dotColor="blue"
        action={<span className="badge badge-blue shrink-0 !px-2 !py-0.5 !text-[12px]">{filteredCustomers.length} kayıt</span>}
      >
        <div className="mb-4 space-y-3">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Marka veya ünvan ara..."
          />
          <div className="glass-inset app-filter-bar grid grid-cols-4 gap-3 p-3">
            <div>
              <p className={APP_FILTER_LABEL_CLASS}>Tipi</p>
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
            <div>
              <p className={APP_FILTER_LABEL_CLASS}>Temsilci</p>
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
            <div>
              <p className={APP_FILTER_LABEL_CLASS}>Puantaj</p>
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
            <div>
              <p className={APP_FILTER_LABEL_CLASS}>Bakiye</p>
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

        <ListHeaderRow
          gridTemplate={listGrid}
          columns={[
            columnLabel,
            'Tipi',
            'Temsilci',
            'Puantaj',
            { label: 'Güncel Bakiye', align: 'right' },
            { label: 'B2B', align: 'right' },
          ]}
        />

        <div className="mt-3 space-y-2 overflow-visible">
          {filteredCustomers.map((customer) => {
            const balance = currentBalance(customer, movements)
            const settings = customerSettings[customer.id] || {}
            const meta = getCustomerMetaSelection(customer, settings)
            const display = getCustomerDisplay(customer)
            return (
              <div
                key={customer.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/musteriler/${customer.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') navigate(`/musteriler/${customer.id}`)
                }}
                className={`${APP_METRIC_ROW_CLASS} app-list-row relative grid items-center gap-3 px-4 py-3`}
                style={{ gridTemplateColumns: listGrid }}
              >
                <div className="min-w-0">
                  <p className={`flex min-w-0 items-center gap-2 ${APP_LABEL_CLASS} text-[var(--ink)]`}>
                    <span className="shrink-0 truncate">{display.brandShortName}</span>
                    <span className="inline-flex min-w-0 items-center rounded-lg border border-white/55 bg-white/35 px-2 py-0.5 text-[12px] font-bold text-[var(--muted)]">
                      <span className="truncate">{display.companyTitle}</span>
                    </span>
                  </p>
                </div>
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
                <EditableDropdownPill
                  value={resolveListColumnLabel(meta.representative, optionLists.representative)}
                  options={optionLists.representative}
                  onOptionsChange={(next) => updateOptionList('representative', next)}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey={`${customer.id}-representative`}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateCustomerSetting(customer.id, 'representative', value)}
                />
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
                <p className={`min-w-0 pr-2 text-right ${APP_VALUE_CLASS} ${balanceClass(balance)}`}>
                  {formatTreasuryCurrency(balance)}
                </p>
                <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                  {b2bMap[customer.id]?.enabled ? (
                    <a
                      href={getPortalUrl(b2bMap[customer.id].accessToken)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[12px] font-black uppercase text-blue-300 hover:bg-blue-500/20"
                    >
                      <Link2 className="h-3 w-3" /> Panel
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => grantB2bAccess(event, customer.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[12px] font-black uppercase text-emerald-300 hover:bg-emerald-500/20"
                    >
                      İzin Ver
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="glass-inset mt-4 p-8 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]" />
            <p className="text-sm font-extrabold text-[var(--ink)]">{emptyTitle}</p>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">Arama veya segment filtresini değiştirin.</p>
          </div>
        )}
      </AppPagePanel>

      <ActivityArchivePanel
        title="Arşiv ve İşlem Geçmişi"
        modules={[archiveModule]}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz arşiv veya silme kaydı yok."
      />
    </AppPageShell>
  )
}
