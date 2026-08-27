import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Copy,
  FileText,
  Handshake,
  Inbox,
  Link2,
  Mail,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  ScrollText,
  Trash2,
  Truck,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react'
import { Button, Dropdown, DropdownItem, DropdownSeparator, EmptyState, Modal } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import QuoteOrderInlineConfirm from '../components/Common/QuoteOrderInlineConfirm'
import {
  QuoteStyleListCell,
  QuoteStyleListColumnHeader,
  QuoteStyleListRowPanel,
  QuoteStyleListSelectionCheckbox,
} from '../components/Common/QuoteStyleListPrimitives'
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
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import {
  APP_SURFACE_PANEL_CLASS,
  PAGE_BALANCE_AMOUNT_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_MENU_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'
import { COP_KUTUSU_ICON_CLASS } from '../utils/buttonStyles'
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

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500', locked: true }
const balanceFilterOptions = [
  filterAllOption,
  { label: 'Alacak', color: 'bg-emerald-500' },
  { label: 'Borç', color: 'bg-red-500' },
  { label: 'Sıfır', color: 'bg-orange-500' },
]

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

function CustomerListRowMoreMenu({ customer, onEdit, onDelete, onB2b, navigate }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const id = customer.id

  return (
    <Dropdown
      align="end"
      menuClassName="az customer-filter-dropdown-menu customers-page-menu quote-record-meta-dropdown min-w-[15rem]"
      trigger={
        <Button
          variant="ghost"
          size="iconOnly"
          className="hover:!bg-transparent"
          aria-label="Diğer işlemler"
          onClick={() => setConfirmDelete(false)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      }
    >
      {({ close }) => (
        <>
          <DropdownItem
            icon={Pencil}
            label="Düzenle"
            tone="primary"
            close={close}
            onClick={onEdit}
          />
          {confirmDelete ? (
            <div
              className="quote-menu-delete-confirm flex w-full items-center justify-center px-1 py-1"
              onClick={(event) => event.stopPropagation()}
              role="menuitem"
              aria-label="Silmeyi onayla"
            >
              <QuoteOrderInlineConfirm
                label="Sil"
                labelClass="quote-order-undo-sil"
                ariaLabel="Müşteri sil"
                onConfirm={() => {
                  onDelete()
                  setConfirmDelete(false)
                  close()
                }}
                onCancel={() => setConfirmDelete(false)}
              />
            </div>
          ) : (
            <DropdownItem
              icon={Trash2}
              label="Sil"
              tone="danger"
              close={close}
              closeOnClick={false}
              onClick={() => setConfirmDelete(true)}
            />
          )}
          <DropdownSeparator />
          <DropdownItem
            icon={Link2}
            label="B2B İzin Ver"
            tone="success"
            close={close}
            onClick={onB2b}
          />
          <DropdownItem
            icon={Mail}
            label="B2B link oluştur"
            tone="success"
            close={close}
            onClick={onB2b}
          />
          <DropdownSeparator />
          <DropdownItem
            icon={FileText}
            label="Yeni fatura kes"
            tone="primary"
            close={close}
            onClick={() => navigate(`/musteriler/${id}/belge/satis-faturasi`)}
          />
          <DropdownItem
            icon={Inbox}
            label="Gelen fatura"
            tone="primary"
            close={close}
            onClick={() => navigate(`/musteriler/${id}/belge/alis-faturasi`)}
          />
          <DropdownItem
            icon={ScrollText}
            label="Yeni teklif oluştur"
            tone="primary"
            close={close}
            onClick={() => navigate(`/teklifler?yeni=1&customerId=${encodeURIComponent(id)}`)}
          />
          <DropdownItem
            icon={ClipboardList}
            label="Yeni sipariş oluştur"
            tone="primary"
            close={close}
            onClick={() => navigate(`/siparisler?yeni=1&customerId=${encodeURIComponent(id)}`)}
          />
          <DropdownItem
            icon={NotebookPen}
            label="Yeni not oluştur"
            tone="primary"
            close={close}
            onClick={() => navigate(`/crm/not-yeni?customerId=${encodeURIComponent(id)}`)}
          />
          <DropdownItem
            icon={CheckSquare}
            label="Yeni görev oluştur"
            tone="primary"
            close={close}
            onClick={() => navigate(`/crm/gorev-yeni?customerId=${encodeURIComponent(id)}`)}
          />
          <DropdownItem
            icon={Calendar}
            label="Yeni randevu oluştur"
            tone="primary"
            close={close}
            onClick={() => navigate(`/crm/randevu-yeni?customerId=${encodeURIComponent(id)}`)}
          />
          <DropdownItem
            icon={Truck}
            label="Yeni sevkiyat oluştur"
            tone="primary"
            close={close}
            onClick={() => navigate(`/lojistik/yukleme-plani?customerId=${encodeURIComponent(id)}`)}
          />
        </>
      )}
    </Dropdown>
  )
}

function sortCustomersByColumn(rows, sort, movements, customerSettings = {}) {
  if (!sort?.key) return rows
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const displayA = getCustomerDisplay(a)
    const displayB = getCustomerDisplay(b)
    const settingsA = customerSettings[a.id] || {}
    const settingsB = customerSettings[b.id] || {}
    const metaA = getCustomerMetaSelection(a, settingsA)
    const metaB = getCustomerMetaSelection(b, settingsB)

    let av
    let bv
    switch (sort.key) {
      case 'name':
        av = displayA.brandShortName || displayA.companyTitle || a.name || ''
        bv = displayB.brandShortName || displayB.companyTitle || b.name || ''
        return String(av).localeCompare(String(bv), 'tr') * dir
      case 'type':
        av = metaA.type || ''
        bv = metaB.type || ''
        return String(av).localeCompare(String(bv), 'tr') * dir
      case 'representative':
        av = metaA.representative || ''
        bv = metaB.representative || ''
        return String(av).localeCompare(String(bv), 'tr') * dir
      case 'scoring':
        av = metaA.scoring || ''
        bv = metaB.scoring || ''
        return String(av).localeCompare(String(bv), 'tr') * dir
      case 'balance':
        av = currentBalance(a, movements)
        bv = currentBalance(b, movements)
        return (av - bv) * dir
      default:
        return 0
    }
  })
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
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [animatingDeleteIds, setAnimatingDeleteIds] = useState([])
  const [listColumnSort, setListColumnSort] = useState({ key: 'balance', dir: 'desc' })
  const [b2bDialogCustomer, setB2bDialogCustomer] = useState(null)
  const [b2bBusy, setB2bBusy] = useState(false)
  const [b2bNotice, setB2bNotice] = useState('')
  const [b2bError, setB2bError] = useState('')
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

  const listCustomers = useMemo(
    () => sortCustomersByColumn(filteredCustomers, listColumnSort, movements, customerSettings),
    [filteredCustomers, listColumnSort, movements, customerSettings],
  )

  const handleVoiceCommand = useCallback(
    async ({ customer, parsed }) => {
      const amount = Number(parsed.amount)
      const method = parsed.method || 'Nakit'
      const description =
        parsed.description ||
        (parsed.action === 'payment'
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
    onCommand: handleVoiceCommand,
    onSettled: () => {
      setMovements(getTreasuryMovements())
    },
  })

  const renderRowVoiceMic = useCallback(
    (customer) => {
      const isActive = voice.activeCustomerId === customer.id
      return (
        <CustomerColumnVoiceMic
          customerId={customer.id}
          active={isActive}
          listening={voice.recording && isActive}
          processing={voice.processing && isActive}
          onStart={() => {
            voice.startForCustomer(customer)
          }}
          title="Sesli cari işlem — bas, konuş, bitir (OpenAI + Luna)"
        />
      )
    },
    [voice.activeCustomerId, voice.recording, voice.processing, voice.startForCustomer],
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

  function toggleListColumnSort(sortKey) {
    setListColumnSort((current) => {
      if (current.key === sortKey) {
        return { key: sortKey, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key: sortKey, dir: sortKey === 'balance' ? 'desc' : 'asc' }
    })
  }

  function softDeleteCustomerWithAnimation(customer) {
    const key = String(customer.id)
    if (animatingDeleteIds.includes(key)) return
    setAnimatingDeleteIds((current) => [...current, key])
    window.setTimeout(() => {
      deleteCustomer(customer.id)
      setAnimatingDeleteIds((current) => current.filter((id) => id !== key))
      setCustomerProfiles(getCustomerProfiles())
    }, 420)
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

  const CreateIcon = listKind === 'supplier' ? Handshake : UserPlus
  const createGradient =
    listKind === 'supplier' ? HEADER_ACTION_GRADIENTS.amber : HEADER_ACTION_GRADIENTS.primary

  const listCustomerIds = listCustomers.map((customer) => String(customer.id))
  const allVisibleSelected =
    listCustomerIds.length > 0 && listCustomerIds.every((id) => selectedIds.includes(id))
  const someVisibleSelected =
    listCustomerIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected

  const customerListBaseColumnGrid = [
    'minmax(16rem, 2.4fr)',
    'minmax(9.25rem, 0.7fr)',
    'minmax(9.25rem, 0.7fr)',
    'minmax(9.25rem, 0.7fr)',
    '6.75rem',
    '3rem',
  ]

  const customerListColumnGrid = [
    ...(bulkSelectMode ? ['2.75rem'] : []),
    ...customerListBaseColumnGrid.slice(0, -1),
    bulkSelectMode && selectedIds.length > 0 ? '6.5rem' : '3rem',
  ].join(' ')

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle={String(sidebarTitle || '').toLocaleUpperCase('tr-TR')}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <button
            type="button"
            data-tour="customer-create"
            onClick={() => navigate(createPath)}
            className={`${HEADER_ACTION_CTA_CLASS} ${createGradient}`}
          >
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <CreateIcon className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>{createLabel}</span>
          </button>
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
            valueTone: 'text-[#e11d48]',
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
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Filtre :</span>
          </div>
          <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Tipi :</p>
              <EditableDropdownPill
                value={filters.type}
                options={[filterAllOption, ...typeOptions]}
                includePlaceholderOption={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="filter-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('type', value)}
                onOptionsChange={(next) => updateOptionList('type', next)}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Temsilci :</p>
              <EditableDropdownPill
                value={filters.representative}
                options={[filterAllOption, ...optionLists.representative]}
                includePlaceholderOption={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="filter-representative"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('representative', value)}
                onOptionsChange={(next) => updateOptionList('representative', next)}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Puantaj :</p>
              <EditableDropdownPill
                value={filters.scoring}
                options={[filterAllOption, ...optionLists.scoring]}
                includePlaceholderOption={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="filter-scoring"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('scoring', value)}
                onOptionsChange={(next) => updateOptionList('scoring', next)}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Bakiye :</p>
              <EditableDropdownPill
                value={filters.balance}
                options={balanceFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="filter-balance"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('balance', value)}
              />
            </div>
          </div>
        </div>
      </AppPagePanel>

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full min-w-0 items-center gap-3 px-1">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>{listTitle}</span>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Marka veya ünvan ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>{filteredCustomers.length} Kayıt</span>
        </div>
      </AppPagePanel>

      <CustomerVoiceStatusBar
        customerLabel={voice.activeCustomerLabel}
        listening={voice.listening}
        recording={voice.recording}
        processing={voice.processing}
        interim={voice.interim}
        transcript={voice.transcript}
        message={voice.message}
        error={voice.error}
        onStop={voice.stop}
      />

      {listCustomers.length === 0 ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <EmptyState title={emptyTitle} description="Arama veya segment filtresini değiştirin." />
        </AppPagePanel>
      ) : null}

      <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
        <div className="quote-teklifler-list-stack flex min-w-[56rem] w-full flex-col gap-5">
          {listCustomers.length > 0 ? (
            <div className="quote-list-board">
              <QuoteStyleListRowPanel header gridTemplate={customerListColumnGrid}>
                {bulkSelectMode ? (
                  <QuoteStyleListCell>
                    <QuoteStyleListSelectionCheckbox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      aria-label="Tümünü seç"
                      onChange={() => toggleBulkSelectAll(listCustomerIds)}
                    />
                  </QuoteStyleListCell>
                ) : null}
                <QuoteStyleListCell>
                  <QuoteStyleListColumnHeader
                    label={columnLabel}
                    sortable
                    sortKey="name"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteStyleListCell>
                <QuoteStyleListCell>
                  <QuoteStyleListColumnHeader
                    label="Tipi"
                    sortable
                    sortKey="type"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteStyleListCell>
                <QuoteStyleListCell>
                  <QuoteStyleListColumnHeader
                    label="Temsilci"
                    sortable
                    sortKey="representative"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteStyleListCell>
                <QuoteStyleListCell>
                  <QuoteStyleListColumnHeader
                    label="Puantaj"
                    sortable
                    sortKey="scoring"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteStyleListCell>
                <QuoteStyleListCell>
                  <QuoteStyleListColumnHeader
                    label="Güncel Bakiye"
                    sortable
                    sortKey="balance"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteStyleListCell>
                <QuoteStyleListCell>
                  {bulkSelectMode && selectedIds.length > 0 ? (
                    <QuoteOrderInlineConfirm
                      label="Sil"
                      labelClass="quote-order-undo-sil"
                      ariaLabel={`${selectedIds.length} kayıt silinsin mi?`}
                      onConfirm={handleBulkDeleteCustomers}
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
                </QuoteStyleListCell>
              </QuoteStyleListRowPanel>

              {listCustomers.map((customer, rowIndex) => {
                const display = getCustomerDisplay(customer)
                const settings = customerSettings[customer.id] || {}
                const meta = getCustomerMetaSelection(customer, settings)
                const balance = currentBalance(customer, movements)
                const customerKey = String(customer.id)
                const isBulkSelected = selectedIds.includes(customerKey)
                const isAnimatingOut = animatingDeleteIds.includes(customerKey)

                return (
                  <div
                    key={customer.id}
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
                      if (bulkSelectMode) toggleBulkSelect(customer.id)
                      else navigate(`/musteriler/${customer.id}`)
                    }}
                    onKeyDown={(event) => {
                      if (bulkSelectMode || isAnimatingOut) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/musteriler/${customer.id}`)
                      }
                    }}
                  >
                    <QuoteStyleListRowPanel
                      gridTemplate={customerListColumnGrid}
                      className={isBulkSelected ? 'ring-1 ring-blue-400/35' : ''}
                    >
                      {bulkSelectMode ? (
                        <QuoteStyleListCell>
                          <QuoteStyleListSelectionCheckbox
                            checked={isBulkSelected}
                            aria-label={`${display.brandShortName || customer.name} seç`}
                            onChange={() => toggleBulkSelect(customer.id)}
                          />
                        </QuoteStyleListCell>
                      ) : null}
                      <QuoteStyleListCell>
                        <span className="flex min-w-0 w-full items-center justify-center gap-1.5 py-0.5 text-center">
                          <span
                            className="inline-flex shrink-0"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {renderRowVoiceMic(customer)}
                          </span>
                          <span className="flex min-w-0 flex-col items-center gap-0.5">
                            <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                              {display.brandShortName}
                            </span>
                            {display.companyTitle ? (
                              <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                                {display.companyTitle}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </QuoteStyleListCell>
                      <QuoteStyleListCell>
                        <span
                          className="flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EditableDropdownPill
                            value={resolveListColumnLabel(meta.type, optionLists.type)}
                            options={typeOptions}
                            onOptionsChange={(next) => updateOptionList('type', next)}
                            buttonClassName={PAGE_LIST_PILL_CLASS}
                            wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                            menuClassName={PAGE_LIST_MENU_CLASS}
                            menuMatchWidth={false}
                            openKey={`${customer.id}-type`}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onChange={(value) => updateCustomerSetting(customer.id, 'type', value)}
                          />
                        </span>
                      </QuoteStyleListCell>
                      <QuoteStyleListCell>
                        <span
                          className="flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EditableDropdownPill
                            value={resolveListColumnLabel(
                              meta.representative,
                              optionLists.representative,
                            )}
                            options={optionLists.representative}
                            onOptionsChange={(next) => updateOptionList('representative', next)}
                            buttonClassName={PAGE_LIST_PILL_CLASS}
                            wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                            menuClassName={PAGE_LIST_MENU_CLASS}
                            menuMatchWidth={false}
                            openKey={`${customer.id}-representative`}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onChange={(value) =>
                              updateCustomerSetting(customer.id, 'representative', value)
                            }
                          />
                        </span>
                      </QuoteStyleListCell>
                      <QuoteStyleListCell>
                        <span
                          className="flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EditableDropdownPill
                            value={resolveListColumnLabel(meta.scoring, optionLists.scoring)}
                            options={optionLists.scoring}
                            onOptionsChange={(next) => updateOptionList('scoring', next)}
                            buttonClassName={PAGE_LIST_PILL_CLASS}
                            wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                            menuClassName={PAGE_LIST_MENU_CLASS}
                            menuMatchWidth={false}
                            openKey={`${customer.id}-scoring`}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onChange={(value) =>
                              updateCustomerSetting(customer.id, 'scoring', value)
                            }
                          />
                        </span>
                      </QuoteStyleListCell>
                      <QuoteStyleListCell>
                        <span className={`${PAGE_BALANCE_AMOUNT_CLASS} ${balanceClass(balance)}`}>
                          {formatTreasuryCurrency(balance)}
                        </span>
                      </QuoteStyleListCell>
                      <QuoteStyleListCell>
                        <span
                          className="inline-flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {bulkSelectMode ? null : (
                            <CustomerListRowMoreMenu
                              customer={customer}
                              navigate={navigate}
                              onEdit={() => navigate(`/musteriler/${customer.id}`)}
                              onDelete={() => softDeleteCustomerWithAnimation(customer)}
                              onB2b={() => openB2bDialog(customer)}
                            />
                          )}
                        </span>
                      </QuoteStyleListCell>
                    </QuoteStyleListRowPanel>
                  </div>
                )
              })}
            </div>
          ) : null}

          <CustomerDeletedArchivedPanel
            title="Silinenler ve Arşivlenenler"
            listKind={listKind}
            onRestored={handleRestoreDeletedOrArchived}
            emptyMessage={
              listKind === 'supplier'
                ? 'Silinen veya arşivlenen tedarikçi yok.'
                : 'Silinen veya arşivlenen müşteri yok.'
            }
            className="customer-deleted-archived-panel w-full"
          />
        </div>
      </div>

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
    </AppPageShell>
  )
}
