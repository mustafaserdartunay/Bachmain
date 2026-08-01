import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  Copy,
  Eye,
  Handshake,
  Link2,
  Mail,
  Pencil,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react'
import { Button, DataTable, Modal } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import ConfirmModal from '../components/Common/ConfirmModal'
import { Link, useNavigate } from 'react-router-dom'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import CustomerDeletedArchivedPanel from '../components/Common/CustomerDeletedArchivedPanel'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import {
  HEADER_QUICK_ACTIONS,
  HeaderQuickActionCard,
} from '../components/Layout/HeaderCashActionsPanel'
import { LIST_PILL_CLASS } from '../components/Common/ListDeleteConfirmPanel'
import { APP_FILTER_LABEL_CLASS, APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
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
import {
  buildB2bPortalSnapshot,
  enableB2bAccess,
  getB2bAccess,
  getPortalUrl,
} from '../utils/b2bPortalStore'
import { publishB2bPortal } from '../utils/platformAuth'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
const balanceFilterOptions = [
  filterAllOption,
  { label: 'Alacak', color: 'bg-emerald-500' },
  { label: 'Borç', color: 'bg-red-500' },
  { label: 'Sıfır', color: 'bg-orange-500' },
]
const CUSTOMER_FILTER_FIELD_CLASS =
  'customer-filter-field grid h-9 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-full px-3'
const CUSTOMER_FILTER_LABEL_CLASS = `${APP_FILTER_LABEL_CLASS} !mb-0 shrink-0 !font-normal !tracking-normal !text-[var(--muted)]`
const CUSTOMER_FILTER_PILL_CLASS = `${LIST_PILL_CLASS} customer-filter-pill`
const CUSTOMER_FILTER_MENU_CLASS = 'customer-filter-dropdown-menu'
const CUSTOMER_LIST_PILL_CLASS = `${LIST_PILL_CLASS} customer-list-dropdown-pill`
const CUSTOMER_LIST_PILL_WRAPPER_CLASS = 'relative inline-flex min-w-0 w-max max-w-full'
const CUSTOMER_LIST_MENU_CLASS = '!min-w-[18rem] w-[18rem]'

function balanceClass(balance) {
  if (balance > 0) return 'text-[#10b981]'
  if (balance < 0) return 'text-[#e11d48]'
  return 'text-[var(--muted)]'
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
  createLabel = 'Yeni Müşteri',
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
  const [pendingDeleteCustomerId, setPendingDeleteCustomerId] = useState(null)
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

  function handleRestoreDeletedOrArchived(record, item) {
    const label = getCustomerDisplay(record).brandShortName || record.company || 'Kayıt'
    const from = item?.kind === 'archived' ? 'arşivden' : 'silinenlerden'
    appendActivity(record.id, 'Geri Alındı', `${label} ${from} geri alındı`)
    setCustomerProfiles(getCustomerProfiles())
  }

  return (
    <AppPageShell className="w-full">
      <AppPageHeader
        showBack={false}
        title={
          <Link
            to="/"
            aria-label="Başa dön"
            title="Başa dön"
            className={`group flex h-[52px] min-w-[8.5rem] max-w-full items-center gap-2.5 rounded-xl bg-gradient-to-br px-3 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 sm:min-w-0 ${
              listKind === 'supplier'
                ? 'from-[#93c5fd] via-[#3b82f6] to-[#2563eb]'
                : 'from-[#ffd27f] via-[#f59e0b] to-[#ea580c]'
            }`}
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/40 text-[#ffffff]">
              <ChevronLeft className="h-4 w-4 text-[#ffffff]" aria-hidden />
            </span>
            <span className="truncate text-xs font-extrabold leading-none text-[#ffffff]">
              {pageTitle}
            </span>
          </Link>
        }
        titleClassName="!flex !min-w-0 !items-center !overflow-visible"
        actions={
          <HeaderQuickActionCard
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
            valueTone: 'text-[#8b5cf6]',
          },
          {
            title: 'Aktif Cari',
            value: filteredCustomers.length,
            icon: CheckCircle2,
            tone: 'emerald',
            valueTone: 'text-[#2563eb]',
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

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-2 px-1">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ea580c]" />
            </span>
            <span className="text-xs font-normal text-[var(--muted)]">Filtre :</span>
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

      <AppPagePanel
        title={listTitle}
        dotColor="blue"
        className="customer-list-panel w-full"
        action={
          <span className="app-titlecase-words shrink-0 text-[12px] font-semibold leading-tight text-[var(--muted)]">
            {filteredCustomers.length} kayıt
          </span>
        }
      >
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Marka veya ünvan ara..."
            className="customer-filter-search"
          />
        </div>

        <DataTable
          emptyTitle={emptyTitle}
          emptyDescription="Arama veya segment filtresini değiştirin."
          data={filteredCustomers}
          getRowId={(customer) => customer.id}
          onRowClick={(customer) => navigate(`/musteriler/${customer.id}`)}
          columns={[
            {
              id: 'name',
              header: columnLabel.toLocaleUpperCase('tr-TR'),
              sortable: true,
              accessorKey: 'name',
              className: 'min-w-[18rem] w-[44%]',
              cell: (customer) => {
                const display = getCustomerDisplay(customer)
                return (
                  <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                    <span className="truncate text-[12px] font-semibold leading-tight text-[var(--muted)]">
                      {display.brandShortName}
                    </span>
                    <span className="truncate text-[12px] font-semibold leading-tight text-[var(--muted)]">
                      {display.companyTitle}
                    </span>
                  </span>
                )
              },
            },
            {
              id: 'type',
              header: 'TİPİ',
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
              sortable: true,
              className: 'w-[1%] whitespace-nowrap text-right',
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
          getRowActions={(customer) => {
            const portalAccess = b2bMap[customer.id]
            return [
              {
                id: 'edit',
                label: 'Düzenle',
                icon: Pencil,
                tone: 'primary',
                onClick: () => navigate(`/musteriler/${customer.id}`),
              },
              {
                id: 'delete',
                label: 'Sil',
                icon: Trash2,
                tone: 'danger',
                onClick: () => setPendingDeleteCustomerId(customer.id),
              },
              {
                id: portalAccess?.enabled ? 'invite' : 'grant',
                label: portalAccess?.enabled ? 'B2B Daveti / Link' : 'B2B İzin Ver',
                icon: portalAccess?.enabled ? Mail : Link2,
                tone: 'success',
                onClick: () => openB2bDialog(customer),
              },
              ...(portalAccess?.enabled
                ? [
                    {
                      id: 'portal-view',
                      label: 'B2B Panelini Gör',
                      icon: Eye,
                      tone: 'success',
                      onClick: () =>
                        window.open(getPortalUrl(portalAccess.accessToken), '_blank', 'noreferrer'),
                    },
                  ]
                : []),
            ]
          }}
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
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Müşteriniz kendisine özel bağlantıdan cari hareketlerini, teklif ve siparişlerini,
            ürünlerini ve üretim durumunu görüntüleyebilir.
          </p>
          <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Müşteri
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {b2bDialogCustomer
                  ? getCustomerDisplay(b2bDialogCustomer).brandShortName ||
                    getCustomerDisplay(b2bDialogCustomer).companyTitle
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Davet E-postası
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {b2bDialogCustomer?.email || 'Kayıtlı e-posta bulunamadı'}
              </p>
            </div>
          </div>
          {b2bNotice ? (
            <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600">
              {b2bNotice}
            </p>
          ) : null}
          {b2bError ? (
            <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-600">
              {b2bError}
            </p>
          ) : null}
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(pendingDeleteCustomerId)}
        title="Müşteri silinsin mi?"
        description="Kayıt silinenler alanına taşınacak."
        confirmLabel="Sil"
        onCancel={() => setPendingDeleteCustomerId(null)}
        onConfirm={() => {
          const customer = customerProfiles.find(
            (profile) => profile.id === pendingDeleteCustomerId,
          )
          if (customer) handleDeleteCustomer(customer)
          else setPendingDeleteCustomerId(null)
        }}
      />

      <CustomerDeletedArchivedPanel
        title="Silinenler ve Arşivlenenler"
        listKind={listKind}
        className="customer-deleted-archived-panel w-full"
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
