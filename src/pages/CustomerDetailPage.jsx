import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Archive,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Facebook,
  FileText,
  History,
  Info,
  Instagram,
  Link2,
  List,
  ListChecks,
  MessageCircle,
  Monitor,
  Pencil,
  Phone,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { archiveCustomer, deleteCustomer, findCustomerProfile } from '../data/customerProfiles'
import {
  createCustomerCollection,
  createCustomerPayment,
  formatCustomerStatementAmount,
  formatTreasuryCurrency,
  getCustomerCollections,
  getCustomerLedgerBalance,
  getCustomerPayments,
  getCustomerStatementAmountTone,
  getTreasuryAccounts,
  getTreasuryMovements,
} from '../utils/treasuryStore'
import { getCustomerDisplay } from '../utils/customerDisplay'
import {
  CUSTOMER_META_KEY,
  notifyCustomerMetaUpdated,
  readCustomerMeta,
  readOptionLists,
  saveOptionList,
} from '../utils/customerMeta'
import EditableDropdownPill from '../components/EditableDropdownPill'
import { DeleteConfirmOverlay } from '../components/Common/ListDeleteConfirmPanel'
import CustomerMovementForm from '../components/CustomerMovementForm'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_DIVIDER_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_CTA_SHELL_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import {
  APP_PANEL_TITLE_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_TABLE_HEADER_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'
import {
  ACTIVITY_USER,
  appendActivity,
  formatActivityStamp,
  readActivity,
  writeActivity,
} from '../utils/customerActivity'
import { downloadStatementPdf } from '../utils/statementPdf'
import {
  disableB2bAccess,
  enableB2bAccess,
  getB2bAccess,
  getPortalUrl,
} from '../utils/b2bPortalStore'
import {
  readCustomerPortalSettings,
  saveCustomerPortalSettings,
} from '../utils/customerPortalSettings'
import { readCompanySettings } from '../utils/companySettings'
import { appendActivityEntry } from '../utils/activityArchiveStore'
import {
  emptyCollectionForm,
  formatCollectionDate,
  movementAccountOptions,
  patchMovementForm,
} from '../utils/customerMovementForm'
import CustomerStockPanel from '../components/Customers/CustomerStockPanel'
import { Dropdown, DropdownItem } from '@bachmain/ui'

const TAHSILAT_BTN = `${HEADER_ACTION_CTA_CLASS} w-full justify-center ${HEADER_ACTION_GRADIENTS.success}`
const ODEME_BTN = `${HEADER_ACTION_CTA_CLASS} w-full justify-center ${HEADER_ACTION_GRADIENTS.expense}`
const DETAIL_FILTER_FIELD_CLASS = PAGE_FILTER_FIELD_CLASS
const DETAIL_FILTER_LABEL_CLASS = PAGE_FILTER_LABEL_CLASS
const DETAIL_FILTER_PILL_CLASS = PAGE_FILTER_PILL_CLASS
const DETAIL_FILTER_MENU_CLASS = PAGE_FILTER_MENU_CLASS
const DETAIL_TABLE_HEADER_CLASS = PAGE_TABLE_HEADER_CLASS
const DETAIL_CELL_CLASS = YF_TEXT_CLASS
const DETAIL_ACTIONS_MENU_CLASS = 'az customer-filter-dropdown-menu customers-page-menu'
const STATEMENT_GRID_CLASS =
  'grid grid-cols-[7.5rem_7.5rem_minmax(0,1fr)_7rem_6.5rem_6.5rem] items-center gap-2'

const editActionItems = [
  {
    label: 'Satış Faturası Oluştur',
    icon: FileText,
    tone: 'primary',
    docType: 'satis-faturasi',
  },
  {
    label: 'Alış Fiş / Faturası Oluştur',
    icon: FileText,
    tone: 'primary',
    docType: 'alis-faturasi',
  },
  {
    label: 'İhracat Faturası Oluştur',
    icon: FileText,
    tone: 'primary',
    docType: 'ihracat-faturasi',
  },
  { label: 'Ödeme Ekle', icon: Upload, tone: 'success', action: 'collection' },
  { label: 'Virman Yap', icon: ArrowRightLeft, tone: 'primary', docType: 'virman' },
  { label: 'Arşivle', icon: Archive, tone: 'orange', action: 'archive' },
  { label: 'Sil', icon: Trash2, tone: 'danger', action: 'delete' },
]
function balanceTone(balance) {
  if (balance > 0) return 'customer-balance-positive'
  if (balance < 0) return 'customer-balance-negative'
  return 'customer-balance-zero'
}

export default function CustomerDetailPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [customer, setCustomer] = useState(() => findCustomerProfile(customerId))
  const customerDisplay = getCustomerDisplay(customer)
  const [accounts] = useState(() => getTreasuryAccounts())
  const [movements, setMovements] = useState(() => getTreasuryMovements())
  const [collectionForm, setCollectionForm] = useState(() =>
    emptyCollectionForm(accounts, readOptionLists()),
  )
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState(() =>
    emptyCollectionForm(accounts, readOptionLists()),
  )
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [portalSettings, setPortalSettings] = useState(() =>
    readCustomerPortalSettings(customer.id, customer),
  )
  const [b2bAccess, setB2bAccess] = useState(() => getB2bAccess(customer.id))
  const [linkCopied, setLinkCopied] = useState(false)
  const companySettings = readCompanySettings()
  const [customerScreenOpen, setCustomerScreenOpen] = useState(true)
  const [customerMeta, setCustomerMeta] = useState(readCustomerMeta)
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activity, setActivity] = useState(() => readActivity(customer.id))
  const [activeMenu, setActiveMenu] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(false)

  useEffect(() => {
    setCustomer(findCustomerProfile(customerId))
    setMovements(getTreasuryMovements())
  }, [customerId, location.key])

  useEffect(() => {
    setActivity(readActivity(customer.id))
  }, [customer.id])

  useEffect(() => {
    if (!activeMenu) return undefined

    function closeActiveMenu() {
      setActiveMenu(null)
      setPendingDelete(false)
    }

    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

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

  function logActivity(action, detail) {
    setActivity((current) => {
      const next = [
        {
          id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          at: new Date().toISOString(),
          user: ACTIVITY_USER,
          action,
          detail,
        },
        ...current,
      ]
      writeActivity(customer.id, next)
      return next
    })
  }

  function handleArchive() {
    appendActivity(customer.id, 'Arşivlendi', 'Müşteri arşive taşındı, verileri korunuyor')
    appendActivityEntry({
      module: 'customers',
      action: 'archive',
      entityType: 'customer',
      entityId: customer.id,
      entityLabel: customerDisplay.brandShortName,
      description: `${customerDisplay.brandShortName} arşive taşındı.`,
      snapshot: customer,
      undo: { type: 'customer.restoreArchive' },
    })
    archiveCustomer(customer.id)
    setActiveMenu(null)
    navigate('/musteriler')
  }

  function handleDelete() {
    appendActivityEntry({
      module: 'customers',
      action: 'delete',
      entityType: 'customer',
      entityId: customer.id,
      entityLabel: customerDisplay.brandShortName,
      description: `${customerDisplay.brandShortName} silindi. Geri alınabilir kayıt olarak saklandı.`,
      snapshot: customer,
      undo: { type: 'customer.restoreDeleted' },
    })
    deleteCustomer(customer.id)
    setActiveMenu(null)
    navigate('/musteriler')
  }

  const selectedMeta = customerMeta[customer.id] || {}
  const selectedCustomerType = selectedMeta.type || ''
  const selectedRepresentative = selectedMeta.representative || ''
  const selectedScoring = selectedMeta.scoring || ''
  const selectedCategory = selectedMeta.category || ''

  const customerCollections = useMemo(
    () => getCustomerCollections(customer.company, movements),
    [customer.company, movements],
  )
  const customerPayments = useMemo(
    () => getCustomerPayments(customer.company, movements),
    [customer.company, movements],
  )
  const collectedTotal = customerCollections.reduce(
    (sum, movement) => sum + Number(movement.amount || 0),
    0,
  )
  const paidTotal = customerPayments.reduce(
    (sum, movement) => sum + Number(movement.amount || 0),
    0,
  )
  const openingBalance = Number(customer.balance) || 0
  const currentBalance = getCustomerLedgerBalance(customer, movements)
  const overdueCollection = currentBalance > 0 ? currentBalance : 0

  const customerMovements = useMemo(
    () =>
      movements.filter(
        (movement) =>
          movement.customerName === customer.company &&
          (movement.type === 'Müşteri Tahsilatı' ||
            movement.type === 'Müşteri Ödemesi' ||
            movement.type === 'Satış Faturası'),
      ),
    [customer.company, movements],
  )

  let runningBalance = openingBalance
  const movementStatementRows = [...customerMovements].reverse().map((movement) => {
    const amount = Number(movement.amount) || 0
    const isInvoice = movement.type === 'Satış Faturası'
    const isPayment = movement.type === 'Müşteri Ödemesi'
    const isCollection = movement.type === 'Müşteri Tahsilatı'

    if (isInvoice) runningBalance += amount
    else if (isCollection || isPayment) runningBalance -= amount

    const baseType = isInvoice ? 'Satış Faturası' : isPayment ? 'Ödeme' : 'Tahsilat'
    return {
      id: movement.id,
      date: movement.date,
      type: isInvoice
        ? 'Satış Faturası'
        : movement.method === 'Çek'
          ? `Çek ${baseType}`
          : `${movement.method} ${baseType}`,
      accountName: movement.accountName || '—',
      description: movement.docNo
        ? `${movement.description || ''}${movement.description ? ' · ' : ''}Fatura No: ${movement.docNo}`
        : movement.chequeNo
          ? `${movement.description} · Çek No: ${movement.chequeNo}`
          : movement.description,
      isPayment,
      isInvoice,
      amount,
      balance: runningBalance,
    }
  })

  const statementRows = [
    ...movementStatementRows.reverse(),
    {
      id: 'opening',
      date: customer.openingBalanceDate || '01.06.2026',
      type: 'Açılış Bakiyesi',
      accountName: '—',
      description: customer.openingBalanceDescription || `${customer.company} cari açılış bakiyesi`,
      isPayment: false,
      amount: openingBalance,
      isOpening: true,
      balance: openingBalance,
    },
  ]

  const movementAccounts = useMemo(
    () => movementAccountOptions(accounts, optionLists),
    [accounts, optionLists],
  )

  function updateCollection(field, value) {
    patchMovementForm(setCollectionForm, field, value, {
      cashAccount: movementAccounts.cash,
      bankAccount: movementAccounts.bank,
      chequeAccount: movementAccounts.cheque,
    })
  }

  function updatePayment(field, value) {
    patchMovementForm(setPaymentForm, field, value, {
      cashAccount: movementAccounts.cash,
      bankAccount: movementAccounts.bank,
      chequeAccount: movementAccounts.cheque,
    })
  }

  function updatePortalSettings(partial) {
    const next = { ...portalSettings, ...partial }
    setPortalSettings(next)
    saveCustomerPortalSettings(customer.id, next)
  }

  function toggleB2bAccess() {
    if (b2bAccess?.enabled) {
      disableB2bAccess(customer.id)
      setB2bAccess(getB2bAccess(customer.id))
      logActivity('B2B', 'Müşteri paneli erişimi kapatıldı')
      return
    }
    const access = enableB2bAccess(customer.id)
    setB2bAccess(access)
    logActivity('B2B', 'Müşteri paneli erişimi açıldı')
  }

  function copyPortalLink() {
    if (!b2bAccess?.accessToken) return
    navigator.clipboard.writeText(getPortalUrl(b2bAccess.accessToken))
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1600)
  }

  function updateMeta(field, value) {
    setCustomerMeta((current) => {
      const next = {
        ...current,
        [customer.id]: {
          ...(current[customer.id] || {}),
          [field]: value,
        },
      }
      localStorage.setItem(CUSTOMER_META_KEY, JSON.stringify(next))
      notifyCustomerMetaUpdated({ customerId: customer.id, field })
      return next
    })
    const labels = {
      type: 'Tipi',
      representative: 'Temsilci',
      scoring: 'Puantaj',
      category: 'Kategori',
    }
    logActivity('Güncelleme', `${labels[field] || field}: ${value || 'Seçiniz'}`)
  }

  function handleDownloadStatementPdf() {
    downloadStatementPdf({
      customerDisplay,
      customer,
      statementRows,
      collectedTotal,
      currentBalance,
      formatCurrency: formatTreasuryCurrency,
    })
  }

  function submitCollection(event) {
    event.preventDefault()
    const amount = Number(collectionForm.amount)
    if (!amount || amount <= 0) {
      window.alert('Tahsilat tutarı girin.')
      return
    }

    createCustomerCollection({
      ...collectionForm,
      customerName: customer.company,
      amount,
      date: formatCollectionDate(collectionForm.transactionDate),
      description: collectionForm.description || `${customer.company} tahsilatı`,
    })
    setMovements(getTreasuryMovements())
    logActivity('Tahsilat', `${collectionForm.method} tahsilat · ${formatTreasuryCurrency(amount)}`)
    setCollectionForm(emptyCollectionForm(accounts, optionLists))
    setCollectionOpen(false)
  }

  function submitPayment(event) {
    event.preventDefault()
    const amount = Number(paymentForm.amount)
    if (!amount || amount <= 0) {
      window.alert('Ödeme tutarı girin.')
      return
    }

    createCustomerPayment({
      ...paymentForm,
      customerName: customer.company,
      amount,
      date: formatCollectionDate(paymentForm.transactionDate),
      description: paymentForm.description || `${customer.company} ödemesi`,
    })
    setMovements(getTreasuryMovements())
    logActivity('Ödeme', `${paymentForm.method} ödeme · ${formatTreasuryCurrency(amount)}`)
    setPaymentForm(emptyCollectionForm(accounts, optionLists))
    setPaymentOpen(false)
  }

  return (
    <AppPageShell className="customers-page-type w-full space-y-5">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink to="/musteriler" label="Müşteriler" />}
        centerTitle={String('Müşteri Detayı').toLocaleUpperCase('tr-TR')}
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <div
            className="relative flex items-center gap-2.5 bg-transparent"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`relative inline-flex overflow-hidden ${HEADER_ACTION_CTA_SHELL_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}
            >
              <Link
                to={`/musteriler/yeni?edit=${customer.id}`}
                className="inline-flex h-full items-center gap-2.5 bg-transparent px-3"
              >
                <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                  <Pencil className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                </span>
                <span className={YF_TEXT_ON_COLOR_CLASS}>Düzenle</span>
              </Link>
              <span className={HEADER_ACTION_CTA_DIVIDER_CLASS} aria-hidden="true" />
              <Dropdown
                align="end"
                className="h-full"
                menuClassName={DETAIL_ACTIONS_MENU_CLASS}
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-full w-12 items-center justify-center bg-transparent"
                    aria-label="Düzenle işlemleri"
                  >
                    <ChevronDown className={HEADER_ACTION_CTA_ICON_CLASS} aria-hidden="true" />
                  </button>
                }
              >
                {({ close }) =>
                  editActionItems.map((item) => (
                    <DropdownItem
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      tone={item.tone}
                      close={close}
                      onClick={() => {
                        if (item.docType) {
                          navigate(`/musteriler/${customer.id}/belge/${item.docType}`)
                          return
                        }
                        if (item.action === 'collection') {
                          setCollectionOpen(true)
                          return
                        }
                        if (item.action === 'archive') {
                          handleArchive()
                          return
                        }
                        if (item.action === 'delete') {
                          setPendingDelete(true)
                        }
                      }}
                    />
                  ))
                }
              </Dropdown>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <AppPagePanel className="customer-detail-ledger-panel w-full overflow-visible">
          <div className="mb-4 flex min-w-0 items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <AppPanelDot color="blue" />
              <div className="min-w-0">
                <h2 className={`${APP_PANEL_TITLE_CLASS} !font-bold`}>
                  {customerDisplay.brandShortName}
                </h2>
                <p className={`mt-0.5 ${DETAIL_CELL_CLASS}`}>
                  {[customerDisplay.companyTitle, customer.city].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <span className={`shrink-0 ${DETAIL_CELL_CLASS}`}>{statementRows.length} Kayıt</span>
          </div>

          <div className="mb-4 flex w-full flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex shrink-0 items-center gap-2 px-1">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ea580c]" />
              </span>
              <span className={DETAIL_CELL_CLASS}>Filtre :</span>
            </div>
            <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className={DETAIL_FILTER_FIELD_CLASS}>
                <p className={DETAIL_FILTER_LABEL_CLASS}>Tipi :</p>
                <EditableDropdownPill
                  value={selectedCustomerType}
                  options={optionLists.type}
                  onOptionsChange={(next) => updateOptionList('type', next)}
                  buttonClassName={DETAIL_FILTER_PILL_CLASS}
                  menuClassName={DETAIL_FILTER_MENU_CLASS}
                  openKey="customer-type"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMeta('type', value)}
                />
              </div>
              <div className={DETAIL_FILTER_FIELD_CLASS}>
                <p className={DETAIL_FILTER_LABEL_CLASS}>Temsilci :</p>
                <EditableDropdownPill
                  value={selectedRepresentative}
                  options={optionLists.representative}
                  onOptionsChange={(next) => updateOptionList('representative', next)}
                  buttonClassName={DETAIL_FILTER_PILL_CLASS}
                  menuClassName={DETAIL_FILTER_MENU_CLASS}
                  openKey="customer-representative"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMeta('representative', value)}
                />
              </div>
              <div className={DETAIL_FILTER_FIELD_CLASS}>
                <p className={DETAIL_FILTER_LABEL_CLASS}>Puantaj :</p>
                <EditableDropdownPill
                  value={selectedScoring}
                  options={optionLists.scoring}
                  onOptionsChange={(next) => updateOptionList('scoring', next)}
                  buttonClassName={DETAIL_FILTER_PILL_CLASS}
                  menuClassName={DETAIL_FILTER_MENU_CLASS}
                  openKey="customer-scoring"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMeta('scoring', value)}
                />
              </div>
              <div className={DETAIL_FILTER_FIELD_CLASS}>
                <p className={DETAIL_FILTER_LABEL_CLASS}>Kategori :</p>
                <EditableDropdownPill
                  value={selectedCategory}
                  options={optionLists.category}
                  onOptionsChange={(next) => updateOptionList('category', next)}
                  buttonClassName={DETAIL_FILTER_PILL_CLASS}
                  menuClassName={DETAIL_FILTER_MENU_CLASS}
                  openKey="customer-category"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMeta('category', value)}
                />
              </div>
            </div>
          </div>

          <div
            className={`${STATEMENT_GRID_CLASS} border-b border-[var(--glass-border)] px-1 py-2 ${DETAIL_TABLE_HEADER_CLASS}`}
          >
            <span>İşlem Türü</span>
            <span>İşlem Yeri</span>
            <span>Açıklama</span>
            <span>İşlem Tarihi</span>
            <span className="text-right">Meblağ</span>
            <span className="text-right">Bakiye</span>
          </div>

          <div className="divide-y divide-[var(--glass-border)]">
            {statementRows.length === 0 ? (
              <p className="px-1 py-8 text-center text-[12px] font-normal text-[var(--muted)]">
                Hareket kaydı yok.
              </p>
            ) : (
              statementRows.map((row) => (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/musteriler/${customer.id}/hareket/${row.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter')
                      navigate(`/musteriler/${customer.id}/hareket/${row.id}`)
                  }}
                  className={`${STATEMENT_GRID_CLASS} cursor-pointer px-1 py-2.5 transition-colors hover:bg-white/25`}
                >
                  <span className={`${DETAIL_CELL_CLASS} !font-bold text-[var(--ink)]`}>
                    {row.type}
                  </span>
                  <span className={`${DETAIL_CELL_CLASS} truncate`}>{row.accountName}</span>
                  <span className={`${DETAIL_CELL_CLASS} truncate`}>{row.description}</span>
                  <span className={DETAIL_CELL_CLASS}>{row.date}</span>
                  <span
                    className={`customer-balance-amount text-right tabular-nums text-[14px] font-bold leading-tight tracking-normal ${getCustomerStatementAmountTone(row)}`}
                  >
                    {formatCustomerStatementAmount(row)}
                  </span>
                  <span
                    className={`customer-balance-amount text-right tabular-nums text-[14px] font-bold leading-tight tracking-normal ${balanceTone(row.balance)}`}
                  >
                    {formatTreasuryCurrency(row.balance)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--glass-border)] pt-3">
            <p className={DETAIL_CELL_CLASS}>
              {statementRows.length
                ? `${statementRows.length} kayıttan 1-${statementRows.length} arası gösteriliyor.`
                : 'Kayıt yok.'}
            </p>
            <button
              type="button"
              onClick={handleDownloadStatementPdf}
              className={`${HEADER_ACTION_CTA_CLASS} !h-10 ${HEADER_ACTION_GRADIENTS.violet}`}
            >
              <span className={YF_TEXT_ON_COLOR_CLASS}>Dışarı Aktar</span>
            </button>
          </div>
        </AppPagePanel>

        <aside className="space-y-4">
          <section className="card space-y-3">
            <button
              type="button"
              onClick={() => {
                setCollectionOpen((open) => !open)
                setPaymentOpen(false)
              }}
              className={TAHSILAT_BTN}
            >
              <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                <CheckCircle2 className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
              </span>
              <span className={YF_TEXT_ON_COLOR_CLASS}>Tahsilat Ekle</span>
            </button>

            {collectionOpen && (
              <CustomerMovementForm
                variant="tahsilat"
                form={collectionForm}
                onUpdate={updateCollection}
                onSubmit={submitCollection}
                onCancel={() => {
                  setCollectionForm(emptyCollectionForm(accounts, optionLists))
                  setCollectionOpen(false)
                }}
                cashAccountOptions={movementAccounts.cash}
                bankAccountOptions={movementAccounts.bank}
                chequeAccountOptions={movementAccounts.cheque}
                onCashOptionsChange={(next) => updateOptionList('cashAccount', next)}
                onBankOptionsChange={(next) => updateOptionList('bankAccount', next)}
                onChequeOptionsChange={(next) => updateOptionList('chequeAccount', next)}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
              />
            )}

            <button
              type="button"
              onClick={() => {
                setPaymentOpen((open) => !open)
                setCollectionOpen(false)
              }}
              className={ODEME_BTN}
            >
              <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                <Upload className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
              </span>
              <span className={YF_TEXT_ON_COLOR_CLASS}>Ödeme Ekle</span>
            </button>

            {paymentOpen && (
              <CustomerMovementForm
                variant="odeme"
                form={paymentForm}
                onUpdate={updatePayment}
                onSubmit={submitPayment}
                onCancel={() => {
                  setPaymentForm(emptyCollectionForm(accounts, optionLists))
                  setPaymentOpen(false)
                }}
                cashAccountOptions={movementAccounts.cash}
                bankAccountOptions={movementAccounts.bank}
                chequeAccountOptions={movementAccounts.cheque}
                onCashOptionsChange={(next) => updateOptionList('cashAccount', next)}
                onBankOptionsChange={(next) => updateOptionList('bankAccount', next)}
                onChequeOptionsChange={(next) => updateOptionList('chequeAccount', next)}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
              />
            )}

            <div className="space-y-2">
              <div className="glass-inset rounded-xl px-3 py-2.5">
                <p className={DETAIL_CELL_CLASS}>Kalan Bakiye</p>
                <p
                  className={`mt-1 tabular-nums text-[14px] font-bold leading-tight tracking-normal ${balanceTone(currentBalance)}`}
                >
                  {formatTreasuryCurrency(currentBalance)}
                </p>
              </div>
              <div className="glass-inset rounded-xl px-3 py-2.5">
                <p className={DETAIL_CELL_CLASS}>Gecikmiş Tahsilat</p>
                <p className="customer-balance-negative mt-1 tabular-nums text-[14px] font-bold leading-tight tracking-normal">
                  {formatTreasuryCurrency(overdueCollection)}
                </p>
              </div>
              <div className="glass-inset rounded-xl px-3 py-2.5">
                <p className={DETAIL_CELL_CLASS}>Toplam Tahsilat</p>
                <p className="customer-balance-positive mt-1 tabular-nums text-[14px] font-bold leading-tight tracking-normal">
                  {formatTreasuryCurrency(collectedTotal)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadStatementPdf}
              className={`${HEADER_ACTION_CTA_CLASS} w-full justify-center ${HEADER_ACTION_GRADIENTS.violet}`}
            >
              <span className={YF_TEXT_ON_COLOR_CLASS}>Ekstre Gönder</span>
            </button>
          </section>

          <section className="card space-y-5 bg-dark-800/80">
            <button
              type="button"
              onClick={() => setCustomerScreenOpen((open) => !open)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/50 bg-dark-700/70 text-gray-400">
                  <Monitor className="h-5 w-5" />
                </span>
                <h2 className="text-base font-black text-white">Müşteri Ekranı Ayarları</h2>
              </div>
              <ChevronRight
                className={`h-4 w-4 text-gray-500 transition-transform ${customerScreenOpen ? '-rotate-90' : 'rotate-90'}`}
              />
            </button>

            {customerScreenOpen && (
              <>
                <div className="flex gap-3 rounded-2xl border border-dark-500/35 bg-dark-700/30 p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <p className="text-xs font-semibold leading-5 text-gray-400">
                    Müşteri ekranı ayarlarınızı buradan yapabilirsiniz. Değişiklikler anında
                    kaydedilir.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={portalSettings.paymentReminder}
                      onChange={(e) => updatePortalSettings({ paymentReminder: e.target.checked })}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-dark-500 bg-dark-700 accent-blue-500"
                    />
                    <span>
                      <span className="block text-xs font-black uppercase tracking-wide text-gray-300">
                        Ödeme Hatırlat
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-gray-500">
                        Müşterinize ait faturalarınızın ödemeleri, ödeme tarihinde e-posta ile
                        hatırlatılacaktır.
                      </span>
                    </span>
                  </label>

                  <label className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={portalSettings.onlineCollection}
                      onChange={(e) => updatePortalSettings({ onlineCollection: e.target.checked })}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-dark-500 bg-dark-700 accent-blue-500"
                    />
                    <span>
                      <span className="block text-xs font-black uppercase tracking-wide text-gray-300">
                        Online Tahsilat
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-gray-500">
                        Kredi kartı ile tahsilat özelliği hazırla.
                      </span>
                    </span>
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <List className="h-4 w-4 text-gray-500" />
                      <p className="text-xs font-black uppercase tracking-wide text-gray-300">
                        IBAN Numaralarınız
                      </p>
                    </div>
                    <p className="pl-7 text-xs font-semibold leading-5 text-gray-500">
                      Paylaşabileceğiniz IBAN numarası olan hesaplarınız
                    </p>
                    <div className="space-y-2 pl-7">
                      {companySettings.bankAccounts.map((account) => (
                        <label
                          key={account.id}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-400"
                        >
                          <input
                            type="checkbox"
                            checked={portalSettings.sharedIbanIds?.includes(account.id)}
                            onChange={(e) => {
                              const ids = new Set(portalSettings.sharedIbanIds || [])
                              if (e.target.checked) ids.add(account.id)
                              else ids.delete(account.id)
                              updatePortalSettings({ sharedIbanIds: [...ids] })
                            }}
                            className="h-4 w-4 shrink-0 rounded border-dark-500 bg-dark-700 accent-blue-500"
                          />
                          {account.bankName} · {account.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-500" />
                      <p className="text-xs font-black uppercase tracking-wide text-gray-300">
                        Erişimi Olan Kişiler
                      </p>
                    </div>
                    {(portalSettings.accessEmails || []).map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between rounded-full border border-dark-500/35 bg-dark-700/60 px-3 py-2 text-xs font-bold text-gray-300"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updatePortalSettings({
                              accessEmails: portalSettings.accessEmails.filter(
                                (item) => item !== email,
                              ),
                            })
                          }
                          className="text-gray-500 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="email"
                      placeholder="E-posta ekle..."
                      className="form-input"
                      data-no-autocap
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        event.preventDefault()
                        const value = event.currentTarget.value.trim()
                        if (!value) return
                        const emails = new Set(portalSettings.accessEmails || [])
                        emails.add(value)
                        updatePortalSettings({ accessEmails: [...emails] })
                        event.currentTarget.value = ''
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-blue-300" />
                    <p className="text-xs font-black uppercase tracking-wide text-blue-300">
                      B2B Müşteri Paneli
                    </p>
                  </div>
                  <p className="text-xs font-semibold leading-5 text-gray-400">
                    Müşterinize özel panel linki ile cari hareketler, ürünler, sipariş ve üretim
                    takibini paylaşın.
                  </p>
                  <button
                    type="button"
                    onClick={toggleB2bAccess}
                    className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-colors ${
                      b2bAccess?.enabled
                        ? 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                        : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {b2bAccess?.enabled ? 'B2B Erişimini Kapat' : 'B2B Erişimi Ver'}
                  </button>
                  {b2bAccess?.enabled && b2bAccess.accessToken && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-xl border border-dark-500/45 bg-dark-800/80 px-3 py-2">
                        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-gray-400">
                          {getPortalUrl(b2bAccess.accessToken)}
                        </p>
                        <button
                          type="button"
                          onClick={copyPortalLink}
                          className="shrink-0 text-gray-400 hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={getPortalUrl(b2bAccess.accessToken)}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-gray-400 hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      {linkCopied && (
                        <p className="text-[13px] font-bold text-emerald-300">Link kopyalandı</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </aside>
      </div>

      <CustomerStockPanel customer={customer} />

      <EngagementPanels customer={customer} />

      <ActivityHistoryPanel activity={activity} />

      <DeleteConfirmOverlay
        open={pendingDelete}
        title="Müşteri silinsin mi?"
        description="Kayıt silinenler alanına taşınacak."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingDelete(false)}
        onConfirm={handleDelete}
      />
    </AppPageShell>
  )
}

function CollapsiblePanel({
  icon: Icon,
  title,
  count,
  accent = 'text-blue-300',
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="card overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-dark-700/30"
      >
        <span className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 ${accent}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-black uppercase tracking-wide text-gray-200">{title}</span>
          {count != null && (
            <span className="rounded-lg bg-dark-700/70 px-2 py-0.5 text-[13px] font-black text-gray-400">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-dark-500/40 p-5">{children}</div>}
    </section>
  )
}

function EmptyPanelState({ message }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-dark-500/50 bg-dark-700/25 px-4 py-8 text-center text-xs font-semibold text-gray-500">
      {message}
    </div>
  )
}

function ActivityHistoryPanel({ activity }) {
  return (
    <CollapsiblePanel
      icon={History}
      title="Aktivite Geçmişi"
      count={activity.length}
      accent="text-blue-300"
      defaultOpen
    >
      {activity.length === 0 ? (
        <EmptyPanelState message="Henüz bir işlem yapılmadı. Yaptığınız değişiklikler tarih, saat ve kullanıcı bilgisiyle burada listelenecek." />
      ) : (
        <ol className="relative space-y-3 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-dark-500/50">
          {activity.map((entry) => (
            <li key={entry.id} className="relative flex items-start gap-3 pl-6">
              <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-dark-800" />
              <div className="min-w-0 flex-1 rounded-2xl border border-dark-500/40 bg-dark-700/35 px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wide text-gray-200">
                    {entry.action}
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap text-[13px] font-bold text-gray-500">
                    <Clock className="h-3 w-3" /> {formatActivityStamp(entry.at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-gray-400">
                  {entry.detail}
                </p>
                <p className="mt-1 text-[13px] font-bold text-blue-300/80">{entry.user}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </CollapsiblePanel>
  )
}

function EngagementRow({ icon: Icon, title, detail, stamp, badge, badgeClass }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/35 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dark-700/70 text-gray-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-gray-200">{title}</p>
          {badge && (
            <span
              className={`rounded-md px-2 py-0.5 text-[12px] font-black uppercase ${badgeClass}`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="truncate text-xs font-semibold text-gray-500">{detail}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] font-bold text-gray-500">
        <Clock className="h-3 w-3" /> {stamp}
      </span>
    </div>
  )
}

function EngagementPanels({ customer }) {
  const data = useMemo(() => buildEngagementData(customer), [customer])

  return (
    <div className="space-y-4">
      <CollapsiblePanel
        icon={ListChecks}
        title="Görevler"
        count={data.tasks.length}
        accent="text-amber-300"
      >
        {data.tasks.length === 0 ? (
          <EmptyPanelState message="Bu müşteri için görev bulunmuyor." />
        ) : (
          <div className="space-y-2">
            {data.tasks.map((item) => (
              <EngagementRow
                key={item.id}
                icon={ListChecks}
                title={item.title}
                detail={item.detail}
                stamp={item.stamp}
                badge={item.badge}
                badgeClass={item.badgeClass}
              />
            ))}
          </div>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        icon={CalendarDays}
        title="Ajanda"
        count={data.agenda.length}
        accent="text-purple-300"
      >
        {data.agenda.length === 0 ? (
          <EmptyPanelState message="Bu müşteri için ajanda kaydı bulunmuyor." />
        ) : (
          <div className="space-y-2">
            {data.agenda.map((item) => (
              <EngagementRow
                key={item.id}
                icon={CalendarDays}
                title={item.title}
                detail={item.detail}
                stamp={item.stamp}
              />
            ))}
          </div>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        icon={Phone}
        title="İletişim Durumları"
        count={data.contacts.length}
        accent="text-emerald-300"
      >
        {data.contacts.length === 0 ? (
          <EmptyPanelState message="Bu müşteri için iletişim kaydı bulunmuyor." />
        ) : (
          <div className="space-y-2">
            {data.contacts.map((item) => (
              <EngagementRow
                key={item.id}
                icon={Phone}
                title={item.title}
                detail={item.detail}
                stamp={item.stamp}
                badge={item.badge}
                badgeClass={item.badgeClass}
              />
            ))}
          </div>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        icon={MessageCircle}
        title="WhatsApp Görüşmeleri"
        count={data.whatsapp.length}
        accent="text-green-300"
      >
        {data.whatsapp.length === 0 ? (
          <EmptyPanelState message="WhatsApp görüşmesi bulunmuyor." />
        ) : (
          <div className="space-y-2">
            {data.whatsapp.map((item) => (
              <EngagementRow
                key={item.id}
                icon={MessageCircle}
                title={item.title}
                detail={item.detail}
                stamp={item.stamp}
              />
            ))}
          </div>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        icon={Instagram}
        title="Instagram Görüşmeleri"
        count={data.instagram.length}
        accent="text-pink-300"
      >
        {data.instagram.length === 0 ? (
          <EmptyPanelState message="Instagram görüşmesi bulunmuyor." />
        ) : (
          <div className="space-y-2">
            {data.instagram.map((item) => (
              <EngagementRow
                key={item.id}
                icon={Instagram}
                title={item.title}
                detail={item.detail}
                stamp={item.stamp}
              />
            ))}
          </div>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        icon={Facebook}
        title="Facebook Görüşmeleri"
        count={data.facebook.length}
        accent="text-sky-300"
      >
        {data.facebook.length === 0 ? (
          <EmptyPanelState message="Facebook görüşmesi bulunmuyor." />
        ) : (
          <div className="space-y-2">
            {data.facebook.map((item) => (
              <EngagementRow
                key={item.id}
                icon={Facebook}
                title={item.title}
                detail={item.detail}
                stamp={item.stamp}
              />
            ))}
          </div>
        )}
      </CollapsiblePanel>
    </div>
  )
}

function buildEngagementData(customer) {
  if (!customer) {
    return { tasks: [], agenda: [], contacts: [], whatsapp: [], instagram: [], facebook: [] }
  }
  const name = getCustomerDisplay(customer).brandShortName || customer.company
  return {
    tasks: [
      {
        id: 't1',
        title: 'Teklif revizyonu gönder',
        detail: `${name} için güncel fiyat teklifi hazırlanacak`,
        stamp: '05.06.2026 09:30',
        badge: 'Açık',
        badgeClass: 'bg-amber-500/15 text-amber-300',
      },
      {
        id: 't2',
        title: 'Numune takibi',
        detail: 'Kargo durumu kontrol edilecek',
        stamp: '03.06.2026 14:10',
        badge: 'Bekliyor',
        badgeClass: 'bg-blue-500/15 text-blue-300',
      },
    ],
    agenda: [
      {
        id: 'a1',
        title: 'Yüz yüze görüşme',
        detail: 'Merkez ofiste ürün sunumu',
        stamp: '08.06.2026 11:00',
      },
      {
        id: 'a2',
        title: 'Tahsilat hatırlatma araması',
        detail: 'Vadesi gelen fatura görüşmesi',
        stamp: '10.06.2026 16:30',
      },
    ],
    contacts: [
      {
        id: 'c1',
        title: 'Telefon görüşmesi',
        detail: 'Sipariş onayı alındı',
        stamp: '04.06.2026 10:05',
        badge: 'Olumlu',
        badgeClass: 'bg-emerald-500/15 text-emerald-300',
      },
      {
        id: 'c2',
        title: 'E-posta',
        detail: 'Proforma fatura iletildi',
        stamp: '02.06.2026 17:40',
        badge: 'Yanıtlandı',
        badgeClass: 'bg-blue-500/15 text-blue-300',
      },
    ],
    whatsapp: [
      {
        id: 'w1',
        title: 'Sipariş durumu',
        detail: '"Ürünler ne zaman hazır olur?"',
        stamp: '05.06.2026 08:50',
      },
    ],
    instagram: [
      {
        id: 'i1',
        title: 'DM',
        detail: 'Yeni koleksiyon hakkında bilgi talebi',
        stamp: '01.06.2026 21:15',
      },
    ],
    facebook: [],
  }
}
