import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Copy,
  Eye,
  FileText,
  Handshake,
  Inbox,
  Link2,
  Mail,
  NotebookPen,
  Pencil,
  ScrollText,
  Trash2,
  Truck,
  Users,
  WalletCards,
} from 'lucide-react'
import { Button, DataTable, Modal } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import { DeleteConfirmOverlay } from '../components/Common/ListDeleteConfirmPanel'
import {
  CustomerColumnVoiceMic,
  CustomerVoiceStatusBar,
  useCustomerListVoice,
} from '../components/Customers/CustomerListVoiceMic'
import { useNavigate } from 'react-router-dom'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import CustomerDeletedArchivedPanel from '../components/Common/CustomerDeletedArchivedPanel'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import {
  HEADER_QUICK_ACTIONS,
  HeaderQuickActionCard,
} from '../components/Layout/HeaderCashActionsPanel'
import {
  APP_PANEL_TITLE_CLASS,
  APP_SURFACE_PANEL_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_MENU_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  PAGE_TABLE_HEADER_CLASS,
  YF_TEXT_CLASS,
} from '../utils/dashboardDesign'
import { deleteCustomer, getCustomerProfiles } from '../data/customerProfiles'
import { appendActivity } from '../utils/customerActivity'
import {
  formatTreasuryCurrency,
  getCustomerLedgerBalance,
  getTreasuryMovements,
  createCustomerCollection,
  createCustomerPayment,
} from '../utils/treasuryStore'
import { emptyCollectionForm, formatCollectionDate } from '../utils/customerMovementForm'
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
  buildB2bPortalSnapshot,
  enableB2bAccess,
  getB2bAccess,
  getPortalUrl,
} from '../utils/b2bPortalStore'
import { publishB2bPortal } from '../utils/platformAuth'
import { customerSubMenus } from '../data/customerMenu'
import { expensesSubMenus } from '../data/expensesMenu'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
const balanceFilterOptions = [
  filterAllOption,
  { label: 'Alacak', color: 'bg-emerald-500' },
  { label: 'Borç', color: 'bg-red-500' },
  { label: 'Sıfır', color: 'bg-orange-500' },
]
const CUSTOMER_FILTER_FIELD_CLASS = PAGE_FILTER_FIELD_CLASS
const CUSTOMER_TYPE_CLASS = YF_TEXT_CLASS
const CUSTOMER_TABLE_HEADER_CLASS = PAGE_TABLE_HEADER_CLASS
const CUSTOMER_FILTER_LABEL_CLASS = PAGE_FILTER_LABEL_CLASS
const CUSTOMER_CHIP_TEXT_CLASS = YF_TEXT_CLASS
const CUSTOMER_FILTER_PILL_CLASS = PAGE_FILTER_PILL_CLASS
const CUSTOMER_FILTER_MENU_CLASS = PAGE_FILTER_MENU_CLASS
const CUSTOMER_LIST_PILL_CLASS = PAGE_LIST_PILL_CLASS
const CUSTOMER_LIST_PILL_WRAPPER_CLASS = PAGE_LIST_PILL_WRAPPER_CLASS
const CUSTOMER_LIST_MENU_CLASS = PAGE_LIST_MENU_CLASS

/** yfb + balance tone: alacak (>) green, borç (<) red, sıfır muted */
function balanceClass(balance) {
  if (balance > 0) return 'customer-balance-positive'
  if (balance < 0) return 'customer-balance-negative'
  return 'customer-balance-zero'
}

function currentBalance(customer, movements) {
  return getCustomerLedgerBalance(customer, movements)
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export default function CustomersPage({
  pageTitle = 'Müşteriler',
  createLabel = 'Yeni Müşteri Oluştur',
  listTitle = 'Müşteriler Listesi :',
  totalLabel = 'Toplam Müşteri',
  columnLabel = 'Müşteriler',
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
  const [movements, setMovements] = useState(() => getTreasuryMovements())
  const [customerProfiles, setCustomerProfiles] = useState(() => getCustomerProfiles())
  const [customerSettings, setCustomerSettings] = useState(readCustomerMeta)
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)
  const [pendingDeleteCustomerId, setPendingDeleteCustomerId] = useState(null)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [b2bDialogCustomer, setB2bDialogCustomer] = useState(null)
  const [b2bBusy, setB2bBusy] = useState(false)
  const [b2bNotice, setB2bNotice] = useState('')
  const [b2bError, setB2bError] = useState('')
  const hoveredCustomerRef = useRef(null)
  const filteredCustomersRef = useRef([])
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

  filteredCustomersRef.current = filteredCustomers

  const resolveVoiceCustomer = useCallback(() => {
    if (hoveredCustomerRef.current) return hoveredCustomerRef.current
    const rows = filteredCustomersRef.current
    if (rows.length === 1) return rows[0]
    return null
  }, [])

  const handleVoiceCommand = useCallback(
    async ({ customer, parsed }) => {
      const amount = Number(parsed.amount)
      const method = parsed.method || 'Nakit'
      const description =
        parsed.description
        || (parsed.action === 'payment'
          ? `${customer.company} ödemesi`
          : `${customer.company} tahsilatı`)
      const formBase = emptyCollectionForm([], readOptionLists())

      if (parsed.action === 'payment') {
        createCustomerPayment({
          ...formBase,
          customerName: customer.company,
          amount,
          method,
          date: formatCollectionDate(new Date()),
          description,
        })
      } else {
        createCustomerCollection({
          ...formBase,
          customerName: customer.company,
          amount,
          method,
          date: formatCollectionDate(new Date()),
          description,
        })
      }

      appendActivity(
        customer.id,
        parsed.action === 'payment' ? 'Ödeme' : 'Tahsilat',
        `Sesli · ${method} · ${formatTreasuryCurrency(amount)} · ${description}`,
      )

      setMovements(getTreasuryMovements())

      navigate(`/musteriler/${customer.id}`, {
        state: {
          voiceNotice:
            parsed.action === 'payment'
              ? `Sesli ödeme kaydedildi: ${formatTreasuryCurrency(amount)} · ${description}`
              : `Sesli tahsilat kaydedildi: ${formatTreasuryCurrency(amount)} · ${description}`,
        },
      })
    },
    [navigate],
  )

  const voice = useCustomerListVoice({
    resolveCustomer: resolveVoiceCustomer,
    onCommand: handleVoiceCommand,
  })

  const renderColumnVoiceMic = useCallback(
    (columnId, row) => (
      <CustomerColumnVoiceMic
        columnId={columnId}
        active={voice.activeColumnId === columnId}
        listening={voice.listening && voice.activeColumnId === columnId}
        processing={voice.processing}
        onStart={(id) => {
          if (row) {
            hoveredCustomerRef.current = row
            voice.startForCustomer(row, id)
            return
          }
          voice.startFromHeader(id)
        }}
        title="Sesli cari işlem (mikrofon)"
      />
    ),
    [voice.activeColumnId, voice.listening, voice.processing, voice.startForCustomer, voice.startFromHeader],
  )

  const totalReceivable = scopedProfiles.reduce(
    (sum, customer) => Math.max(currentBalance(customer, movements), 0) + sum,
    0,
  )
  const totalPayable = scopedProfiles.reduce(
    (sum, customer) => Math.abs(Math.min(currentBalance(customer, movements), 0)) + sum,
    0,
  )

  function openB2bDialog(customer) {
    setB2bDialogCustomer(customer)
    setB2bNotice('')
    setB2bError('')
  }

  async function publishCustomerB2bPortal({ sendEmail, copyLink = false }) {
    const customer = b2bDialogCustomer
    if (!customer) return
    if (sendEmail && !customer.email) {
      setB2bError('Müşterinin kayıtlı e-posta adresi bulunamadı.')
      return
    }

    setB2bBusy(true)
    setB2bNotice('')
    setB2bError('')
    try {
      const access =
        b2bMap[customer.id]?.enabled && b2bMap[customer.id]?.accessToken?.length >= 40
          ? b2bMap[customer.id]
          : enableB2bAccess(customer.id)
      setB2bMap((current) => ({ ...current, [customer.id]: access }))
      const snapshot = buildB2bPortalSnapshot(customer.id)
      if (!snapshot) throw new Error('B2B panel verileri hazırlanamadı.')

      const display = getCustomerDisplay(customer)
      const result = await publishB2bPortal({
        accessToken: access.accessToken,
        customerId: customer.id,
        customerName: display.brandShortName || display.companyTitle || customer.company,
        email: customer.email || '',
        snapshot,
        sendEmail,
      })
      const portalUrl = result.portalUrl || getPortalUrl(access.accessToken)

      if (copyLink) {
        await copyText(portalUrl)
      }
      appendActivity(
        customer.id,
        'B2B',
        sendEmail
          ? `B2B panel daveti ${customer.email} adresine gönderildi`
          : 'B2B panel bağlantısı oluşturuldu',
      )
      if (sendEmail && result.mailStatus !== 'sent') {
        setB2bError(
          'Panel bağlantısı oluşturuldu; ancak e-posta gönderilemedi. Bağlantıyı kopyalayarak paylaşabilirsiniz.',
        )
      } else {
        setB2bNotice(
          sendEmail
            ? `Davet e-postası ${customer.email} adresine gönderildi.`
            : 'B2B panel bağlantısı oluşturuldu ve panoya kopyalandı.',
        )
      }
    } catch (error) {
      setB2bError(error.message || 'B2B panel erişimi oluşturulamadı.')
    } finally {
      setB2bBusy(false)
    }
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

  function handleDeleteCustomer(customer) {
    deleteCustomer(customer.id)
    setPendingDeleteCustomerId(null)
    setCustomerProfiles(getCustomerProfiles())
  }

  function exitBulkSelectMode() {
    setBulkSelectMode(false)
    setSelectedIds([])
    setPendingBulkDelete(false)
  }

  function toggleBulkSelect(id) {
    const key = String(id)
    setSelectedIds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  function toggleBulkSelectAll(visibleIds = []) {
    const keys = visibleIds.map(String)
    setSelectedIds((current) => {
      const allSelected = keys.length > 0 && keys.every((id) => current.includes(id))
      if (allSelected) return current.filter((id) => !keys.includes(id))
      const merged = new Set(current)
      keys.forEach((id) => merged.add(id))
      return [...merged]
    })
  }

  function handleBulkDeleteCustomers() {
    selectedIds.forEach((id) => deleteCustomer(id))
    exitBulkSelectMode()
    setCustomerProfiles(getCustomerProfiles())
  }

  function handleRestoreDeletedOrArchived(record, item) {
    const label = getCustomerDisplay(record).brandShortName || record.company || 'Kayıt'
    const from = item?.kind === 'archived' ? 'arşivden' : 'silinenlerden'
    appendActivity(record.id, 'Geri Alındı', `${label} ${from} geri alındı`)
    setCustomerProfiles(getCustomerProfiles())
  }

  const sidebarTitle =
    listKind === 'supplier'
      ? expensesSubMenus.find((item) => item.path.includes('tedarikciler'))?.label || pageTitle
      : customerSubMenus.find((item) => item.path === '/musteriler')?.label || pageTitle

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle={String(sidebarTitle || '').toLocaleUpperCase('tr-TR')}
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <HeaderQuickActionCard
            fixed
            action={
              HEADER_QUICK_ACTIONS.find(
                (action) => action.id === (listKind === 'supplier' ? 'supplier' : 'customer'),
              ) || HEADER_QUICK_ACTIONS.find((action) => action.id === 'customer')
            }
          />
        }
      />

      <SummaryMetrics
        columns={4}
        className="customer-summary-metrics w-full"
        items={[
          {
            title: totalLabel,
            value: scopedProfiles.length,
            icon: Users,
            valueTone: 'text-violet-800',
          },
          {
            title: 'Aktif Cari',
            value: filteredCustomers.length,
            icon: CheckCircle2,
            tone: 'emerald',
            valueTone: 'text-blue-800',
          },
          {
            title: 'Toplam Ödenecek',
            value: formatTreasuryCurrency(totalPayable),
            icon: WalletCards,
            tone: 'purple',
            valueTone: 'text-red-700',
          },
          {
            title: 'Toplam Tahsil Edilecek',
            value: formatTreasuryCurrency(totalReceivable),
            icon: WalletCards,
            tone: 'orange',
            valueTone: 'text-emerald-800',
          },
        ]}
      />

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-2 px-1">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ea580c]" />
            </span>
            <span className={CUSTOMER_CHIP_TEXT_CLASS}>Filtre :</span>
          </div>
          <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={CUSTOMER_FILTER_FIELD_CLASS}>
              <p className={CUSTOMER_FILTER_LABEL_CLASS}>Tipi :</p>
              <EditableDropdownPill
                value={filters.type}
                options={[filterAllOption, ...typeOptions]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                openKey="filter-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('type', value)}
              />
            </div>
            <div className={CUSTOMER_FILTER_FIELD_CLASS}>
              <p className={CUSTOMER_FILTER_LABEL_CLASS}>Temsilci :</p>
              <EditableDropdownPill
                value={filters.representative}
                options={[filterAllOption, ...optionLists.representative]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                openKey="filter-representative"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('representative', value)}
              />
            </div>
            <div className={CUSTOMER_FILTER_FIELD_CLASS}>
              <p className={CUSTOMER_FILTER_LABEL_CLASS}>Puantaj :</p>
              <EditableDropdownPill
                value={filters.scoring}
                options={[filterAllOption, ...optionLists.scoring]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                openKey="filter-scoring"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('scoring', value)}
              />
            </div>
            <div className={CUSTOMER_FILTER_FIELD_CLASS}>
              <p className={CUSTOMER_FILTER_LABEL_CLASS}>Bakiye :</p>
              <EditableDropdownPill
                value={filters.balance}
                options={balanceFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                openKey="filter-balance"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('balance', value)}
              />
            </div>
          </div>
        </div>
      </AppPagePanel>

      <AppPagePanel className="customer-list-panel w-full">
        <div className="mb-4 flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <h2 className={APP_PANEL_TITLE_CLASS}>{listTitle}</h2>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Marka veya ünvan ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${CUSTOMER_CHIP_TEXT_CLASS}`}>
            {filteredCustomers.length} Kayıt
          </span>
        </div>

        <CustomerVoiceStatusBar
          customerLabel={voice.activeCustomerLabel}
          listening={voice.listening}
          processing={voice.processing}
          interim={voice.interim}
          transcript={voice.transcript}
          message={voice.message}
          error={voice.error}
          onStop={voice.stop}
        />

        {bulkSelectMode ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
            <p className={YF_TEXT_CLASS}>
              {selectedIds.length > 0
                ? `${selectedIds.length} kayıt seçildi`
                : 'Silmek istediğiniz kayıtları seçin'}
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

        <DataTable
          emptyTitle={emptyTitle}
          emptyDescription="Arama veya segment filtresini değiştirin."
          headerClassName={CUSTOMER_TABLE_HEADER_CLASS}
          mobileHeaderClassName={CUSTOMER_TABLE_HEADER_CLASS}
          data={filteredCustomers}
          defaultSort={{ key: 'balance', dir: 'desc' }}
          getRowId={(customer) => customer.id}
          onRowMouseEnter={(customer) => {
            hoveredCustomerRef.current = customer
          }}
          onRowMouseLeave={() => {
            /* keep last hovered for header mic */
          }}
          onRowClick={
            bulkSelectMode ? undefined : (customer) => navigate(`/musteriler/${customer.id}`)
          }
          selectionEnabled={bulkSelectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleBulkSelect}
          onToggleSelectAll={toggleBulkSelectAll}
          headerActions={
            bulkSelectMode
              ? [
                  {
                    id: 'bulk-delete-confirm',
                    label:
                      selectedIds.length > 0
                        ? `Seçilenleri Sil (${selectedIds.length})`
                        : 'Seçilenleri Sil',
                    icon: Trash2,
                    tone: 'danger',
                    onClick: () => {
                      if (selectedIds.length > 0) setPendingBulkDelete(true)
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
                      setBulkSelectMode(true)
                      setSelectedIds([])
                      setPendingBulkDelete(false)
                    },
                  },
                ]
          }
          columns={[
            {
              id: 'name',
              header: String(columnLabel || '').toLocaleUpperCase('tr-TR'),
              headerAccessory: (ctx) => renderColumnVoiceMic('name', ctx?.row),
              sortable: true,
              accessorKey: 'name',
              getSortValue: (customer) => {
                const display = getCustomerDisplay(customer)
                return display.brandShortName || display.companyTitle || customer.name || ''
              },
              className: 'min-w-[18rem] w-[44%]',
              cell: (customer) => {
                const display = getCustomerDisplay(customer)
                return (
                  <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                    <span className="customer-name-primary truncate text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                      {display.brandShortName}
                    </span>
                    <span className="customer-name-secondary font-sans truncate text-[14px] font-normal leading-tight text-[var(--muted)]">
                      {display.companyTitle}
                    </span>
                  </span>
                )
              },
            },
            {
              id: 'type',
              header: 'TİPİ',
              headerAccessory: (ctx) => renderColumnVoiceMic('type', ctx?.row),
              className: 'w-[7.25rem]',
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
                      buttonClassName={CUSTOMER_LIST_PILL_CLASS}
                      wrapperClassName={CUSTOMER_LIST_PILL_WRAPPER_CLASS}
                      menuClassName={CUSTOMER_LIST_MENU_CLASS}
                      menuMatchWidth={false}
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
              header: 'TEMSİLCİ',
              headerAccessory: (ctx) => renderColumnVoiceMic('representative', ctx?.row),
              className: 'w-[7.25rem]',
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
                      buttonClassName={CUSTOMER_LIST_PILL_CLASS}
                      wrapperClassName={CUSTOMER_LIST_PILL_WRAPPER_CLASS}
                      menuClassName={CUSTOMER_LIST_MENU_CLASS}
                      menuMatchWidth={false}
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
              header: 'PUANTAJ',
              headerAccessory: (ctx) => renderColumnVoiceMic('scoring', ctx?.row),
              className: 'w-[7.25rem]',
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
                      buttonClassName={CUSTOMER_LIST_PILL_CLASS}
                      wrapperClassName={CUSTOMER_LIST_PILL_WRAPPER_CLASS}
                      menuClassName={CUSTOMER_LIST_MENU_CLASS}
                      menuMatchWidth={false}
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
              header: 'GÜNCEL BAKİYE',
              headerAccessory: (ctx) => renderColumnVoiceMic('balance', ctx?.row),
              sortable: true,
              accessorKey: 'balance',
              getSortValue: (customer) => currentBalance(customer, movements),
              className: 'w-[1%] whitespace-nowrap text-right',
              cell: (customer) => {
                const balance = currentBalance(customer, movements)
                return (
                  <span
                    className={`customer-balance-amount tabular-nums text-[14px] font-bold leading-tight tracking-normal ${balanceClass(balance)}`}
                  >
                    {formatTreasuryCurrency(balance)}
                  </span>
                )
              },
            },
          ]}
          getRowActions={
            bulkSelectMode
              ? undefined
              : (customer) => {
                  const portalAccess = b2bMap[customer.id]
                  const id = customer.id
                  return [
                    {
                      id: 'edit',
                      label: 'Düzenle',
                      icon: Pencil,
                      tone: 'primary',
                      onClick: () => navigate(`/musteriler/${id}`),
                    },
                    {
                      id: 'delete',
                      label: 'Sil',
                      icon: Trash2,
                      tone: 'danger',
                      onClick: () => setPendingDeleteCustomerId(id),
                    },
                    {
                      id: 'b2b-grant',
                      label: 'B2B İzin Ver',
                      icon: Link2,
                      tone: 'success',
                      onClick: () => openB2bDialog(customer),
                    },
                    {
                      id: 'b2b-link',
                      label: 'B2B link oluştur',
                      icon: Mail,
                      tone: 'success',
                      onClick: () => openB2bDialog(customer),
                    },
                    { id: 'create-sep', type: 'separator' },
                    {
                      id: 'new-invoice',
                      label: 'Yeni fatura kes',
                      icon: FileText,
                      tone: 'primary',
                      onClick: () => navigate(`/musteriler/${id}/belge/satis-faturasi`),
                    },
                    {
                      id: 'incoming-invoice',
                      label: 'Gelen fatura',
                      icon: Inbox,
                      tone: 'primary',
                      onClick: () => navigate(`/musteriler/${id}/belge/alis-faturasi`),
                    },
                    {
                      id: 'new-quote',
                      label: 'Yeni teklif oluştur',
                      icon: ScrollText,
                      tone: 'primary',
                      onClick: () =>
                        navigate(`/teklifler?yeni=1&customerId=${encodeURIComponent(id)}`),
                    },
                    {
                      id: 'new-order',
                      label: 'Yeni sipariş oluştur',
                      icon: ClipboardList,
                      tone: 'primary',
                      onClick: () =>
                        navigate(`/siparisler?yeni=1&customerId=${encodeURIComponent(id)}`),
                    },
                    {
                      id: 'new-note',
                      label: 'Yeni not oluştur',
                      icon: NotebookPen,
                      tone: 'primary',
                      onClick: () =>
                        navigate(`/crm/not-yeni?customerId=${encodeURIComponent(id)}`),
                    },
                    {
                      id: 'new-task',
                      label: 'Yeni görev oluştur',
                      icon: CheckSquare,
                      tone: 'primary',
                      onClick: () =>
                        navigate(`/crm/gorev-yeni?customerId=${encodeURIComponent(id)}`),
                    },
                    {
                      id: 'new-appointment',
                      label: 'Yeni randevu oluştur',
                      icon: Calendar,
                      tone: 'primary',
                      onClick: () =>
                        navigate(`/crm/randevu-yeni?customerId=${encodeURIComponent(id)}`),
                    },
                    {
                      id: 'new-shipment',
                      label: 'Yeni sevkiyat oluştur',
                      icon: Truck,
                      tone: 'primary',
                      onClick: () =>
                        navigate(
                          `/lojistik/yukleme-plani?customerId=${encodeURIComponent(id)}`,
                        ),
                    },
                  ]
                }
          }
        />
      </AppPagePanel>

      <Modal
        open={Boolean(b2bDialogCustomer)}
        onClose={() => {
          if (!b2bBusy) setB2bDialogCustomer(null)
        }}
        title="B2B Müşteri Paneli Erişimi"
        size="md"
        footer={
          <>
            <Button variant="cancel" disabled={b2bBusy} onClick={() => setB2bDialogCustomer(null)}>
              Vazgeç
            </Button>
            <Button
              variant="outline"
              disabled={b2bBusy}
              onClick={() => publishCustomerB2bPortal({ sendEmail: false, copyLink: true })}
            >
              <Copy className="h-4 w-4" />
              Link Oluştur ve Kopyala
            </Button>
            <Button
              variant="primary"
              disabled={b2bBusy || !b2bDialogCustomer?.email}
              onClick={() => publishCustomerB2bPortal({ sendEmail: true })}
            >
              <Mail className="h-4 w-4" />
              {b2bBusy ? 'Gönderiliyor…' : 'İzin Ver ve Mail Gönder'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[14px] font-normal leading-tight text-[var(--muted)]">
            Müşteriniz kendisine özel bağlantıdan cari hareketlerini, teklif ve siparişlerini,
            ürünlerini ve üretim durumunu görüntüleyebilir.
          </p>
          <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
            <div>
              <p className="text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
                Müşteri
              </p>
              <p className="mt-1 text-[14px] font-normal leading-tight text-[var(--ink)]">
                {b2bDialogCustomer
                  ? getCustomerDisplay(b2bDialogCustomer).brandShortName ||
                    getCustomerDisplay(b2bDialogCustomer).companyTitle
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
                Davet E-postası
              </p>
              <p className="mt-1 text-[14px] font-normal leading-tight text-[var(--ink)]">
                {b2bDialogCustomer?.email || 'Kayıtlı e-posta bulunamadı'}
              </p>
            </div>
          </div>
          {b2bNotice ? (
            <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-[14px] font-normal leading-tight text-emerald-600">
              {b2bNotice}
            </p>
          ) : null}
          {b2bError ? (
            <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-[14px] font-normal leading-tight text-rose-600">
              {b2bError}
            </p>
          ) : null}
        </div>
      </Modal>

      <DeleteConfirmOverlay
        open={Boolean(pendingDeleteCustomerId) && !pendingBulkDelete}
        title="Müşteri silinsin mi?"
        description="Kayıt silinenler alanına taşınacak."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingDeleteCustomerId(null)}
        onConfirm={() => {
          const customer = customerProfiles.find(
            (profile) => profile.id === pendingDeleteCustomerId,
          )
          if (customer) handleDeleteCustomer(customer)
          else setPendingDeleteCustomerId(null)
        }}
      />

      <DeleteConfirmOverlay
        open={pendingBulkDelete && selectedIds.length > 0}
        title={`${selectedIds.length} kayıt silinsin mi?`}
        description="Seçilen kayıtlar silinenler alanına taşınacak."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={handleBulkDeleteCustomers}
      />

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
