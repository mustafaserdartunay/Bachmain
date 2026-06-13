import { useEffect, useMemo, useState } from 'react'
import { Archive, CheckCircle2, ChevronDown, Link2, Plus, RotateCcw, Search, Users, WalletCards } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { getArchivedCustomers, getCustomerProfiles, restoreCustomer } from '../data/customerProfiles'
import { appendActivity, formatActivityStamp } from '../utils/customerActivity'
import {
  formatTreasuryCurrency,
  getCustomerLedgerBalance,
  getTreasuryMovements,
} from '../utils/treasuryStore'
import { getCustomerDisplay } from '../utils/customerDisplay'
import {
  CUSTOMER_META_KEY,
  getCustomerMetaSelection,
  notifyCustomerMetaUpdated,
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

function Panel({ title, description, children, action }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function currentBalance(customer, movements) {
  return getCustomerLedgerBalance(customer, movements)
}

function balanceClass(balance) {
  if (balance > 0) return 'text-emerald-300'
  if (balance < 0) return 'text-red-300'
  return 'text-orange-300'
}

const LIST_PILL_CLASS =
  'flex w-full items-center justify-between gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold transition-colors hover:bg-dark-700/80'

export default function CustomersPage() {
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
  const [archivedCustomers, setArchivedCustomers] = useState(() => getArchivedCustomers())
  const [archiveOpen, setArchiveOpen] = useState(false)
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
    if (!activeMenu) return undefined

    function closeActiveMenu() {
      setActiveMenu(null)
    }

    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR')
    return customerProfiles.filter((customer) => {
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
  }, [customerProfiles, customerSettings, filters, movements, searchQuery])

  const totalReceivable = customerProfiles.reduce((sum, customer) => Math.max(currentBalance(customer, movements), 0) + sum, 0)
  const totalPayable = customerProfiles.reduce((sum, customer) => Math.abs(Math.min(currentBalance(customer, movements), 0)) + sum, 0)

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

  function handleRestore(entry) {
    restoreCustomer(entry.customer.id)
    appendActivity(entry.customer.id, 'Arşivden Geri Alındı', 'Müşteri arşivden listeye geri getirildi')
    setCustomerProfiles(getCustomerProfiles())
    setArchivedCustomers(getArchivedCustomers())
  }

  return (
    <div className="space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <Link to="/" className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 transition-colors hover:text-gray-300">
          Dashboard
        </Link>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Müşteri Yönetimi</h1>
        </div>
        <Link to="/musteriler/yeni" className="btn-primary absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Yeni Müşteri Oluştur
        </Link>
      </section>

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Toplam Müşteri', value: customerProfiles.length, icon: Users },
          { title: 'Aktif Cari', value: filteredCustomers.length, icon: CheckCircle2, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Toplam Ödenecek', value: formatTreasuryCurrency(totalPayable), icon: WalletCards, tone: 'purple', valueTone: 'red' },
          { title: 'Toplam Tahsil Edilecek', value: formatTreasuryCurrency(totalReceivable), icon: WalletCards, tone: 'orange', valueTone: 'emerald' },
        ]}
      />

      <Panel
        title="Müşteriler Listesi"
        description="Buton yok; müşteri satırının herhangi bir yerine tıklayınca detay sayfasına girilir."
        action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{filteredCustomers.length} kayıt</span>}
      >
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Marka veya ünvan ara..."
              className="form-input pl-10"
            />
          </div>
          <div className="grid grid-cols-4 gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/70 p-3">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Tipi</p>
              <EditableDropdownPill
                value={filters.type}
                options={[filterAllOption, ...optionLists.type]}
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
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Temsilci</p>
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
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Puantaj</p>
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
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Bakiye</p>
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
            'Müşteri',
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
                className="relative grid cursor-pointer items-center gap-3 rounded-2xl border border-dark-500/45 bg-dark-800/55 px-4 py-3 transition-all hover:border-blue-500/35 hover:bg-dark-700/60"
                style={{ gridTemplateColumns: listGrid }}
              >
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-black text-white">
                    <span className="shrink-0 truncate">{display.brandShortName}</span>
                    <span className="inline-flex min-w-0 items-center rounded-lg border border-dark-500/45 bg-dark-700/60 px-2 py-0.5 text-[10px] font-black text-gray-400">
                      <span className="truncate">{display.companyTitle}</span>
                    </span>
                  </p>
                </div>
                <EditableDropdownPill
                  value={resolveListColumnLabel(meta.type, optionLists.type)}
                  options={optionLists.type}
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
                <p className={`min-w-0 pr-2 text-right text-sm font-black ${balanceClass(balance)}`}>
                  {formatTreasuryCurrency(balance)}
                </p>
                <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                  {b2bMap[customer.id]?.enabled ? (
                    <a
                      href={getPortalUrl(b2bMap[customer.id].accessToken)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase text-blue-300 hover:bg-blue-500/20"
                    >
                      <Link2 className="h-3 w-3" /> Panel
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => grantB2bAccess(event, customer.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-300 hover:bg-emerald-500/20"
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
          <div className="mt-4 rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-8 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-gray-600" />
            <p className="text-sm font-bold text-white">Müşteri bulunamadı.</p>
            <p className="mt-1 text-xs text-gray-500">Arama veya segment filtresini değiştirin.</p>
          </div>
        )}
      </Panel>

      <section className="card overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setArchiveOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-dark-700/30"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-amber-300">
              <Archive className="h-4 w-4" />
            </span>
            <span className="text-sm font-black uppercase tracking-wide text-gray-200">Arşiv</span>
            <span className="rounded-lg bg-dark-700/70 px-2 py-0.5 text-[11px] font-black text-gray-400">{archivedCustomers.length}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${archiveOpen ? 'rotate-180' : ''}`} />
        </button>
        {archiveOpen && (
          <div className="border-t border-dark-500/40 p-5">
            {archivedCustomers.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-dark-500/50 bg-dark-700/25 px-4 py-8 text-center text-xs font-semibold text-gray-500">
                Arşivlenmiş müşteri bulunmuyor. Arşivlenen müşterilerin verileri silinmez, buradan geri alınabilir.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedCustomers.map((entry) => {
                  const display = getCustomerDisplay(entry.customer)
                  return (
                    <div key={entry.customer.id} className="flex items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/35 px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dark-700/70 text-sm font-black text-gray-300">
                        {display.brandShortName.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-200">{display.brandShortName}</p>
                        <p className="truncate text-xs font-semibold text-gray-500">
                          {display.companyTitle} · Arşivlendi: {formatActivityStamp(entry.archivedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestore(entry)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-300 transition-colors hover:bg-emerald-500/20"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Geri Al
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
