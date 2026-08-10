import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Archive,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
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
  Package,
  Pencil,
  Phone,
  Trash2,
  Truck,
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
  readOptionLists,
  saveOptionList,
} from '../utils/customerMeta'
import { DeleteConfirmOverlay } from '../components/Common/ListDeleteConfirmPanel'
import CustomerMovementForm from '../components/CustomerMovementForm'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
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
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
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
const DETAIL_TABLE_HEADER_CLASS =
  'customer-ledger-row-header min-w-0 !text-[14px] !font-normal !leading-tight !tracking-normal uppercase !text-[var(--muted)]'
const DETAIL_CELL_CLASS = YF_TEXT_CLASS
const DETAIL_ACTIONS_MENU_CLASS = PAGE_FILTER_MENU_CLASS
const STATEMENT_GRID_CLASS =
  'customer-ledger-row grid grid-cols-[9rem_7.75rem_7.75rem_minmax(0,1.4fr)_6.75rem_6.75rem] items-center gap-2 px-1'
const STATEMENT_ROW_CLASS = `${STATEMENT_GRID_CLASS}`
const STATEMENT_PAGE_SIZE = 10
const LEDGER_PAGE_BTN_CLASS =
  'glass-sidebar-toggle flex h-8 w-8 shrink-0 items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-40'

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
  {
    label: 'Yük ve Sevkiyat Oluştur',
    icon: Truck,
    tone: 'primary',
    action: 'load-shipment',
  },
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
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activity, setActivity] = useState(() => readActivity(customer.id))
  const [activeMenu, setActiveMenu] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const deleteAnchorRef = useRef(null)
  const [voiceNotice, setVoiceNotice] = useState('')
  const [ledgerPage, setLedgerPage] = useState(0)

  useEffect(() => {
    setCustomer(findCustomerProfile(customerId))
    setMovements(getTreasuryMovements())
  }, [customerId, location.key])

  const voiceAppliedKeyRef = useRef('')

  useEffect(() => {
    const notice = location.state?.voiceNotice
    if (!notice) return undefined
    const key = `${customerId}|${notice}`
    if (voiceAppliedKeyRef.current === key) return undefined
    voiceAppliedKeyRef.current = key
    setVoiceNotice(notice)
    setMovements(getTreasuryMovements())
    setActivity(readActivity(customerId))
    navigate(location.pathname, { replace: true, state: {} })
    return undefined
  }, [customerId, location.pathname, location.state, navigate])

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
    ...[...movementStatementRows].reverse(),
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

  const ledgerPageCount = Math.max(1, Math.ceil(statementRows.length / STATEMENT_PAGE_SIZE) || 1)
  const safeLedgerPage = Math.min(ledgerPage, ledgerPageCount - 1)
  const ledgerPageStart = statementRows.length === 0 ? 0 : safeLedgerPage * STATEMENT_PAGE_SIZE
  const ledgerPageRows = statementRows.slice(ledgerPageStart, ledgerPageStart + STATEMENT_PAGE_SIZE)
  const ledgerPageEnd = ledgerPageStart + ledgerPageRows.length

  useEffect(() => {
    setLedgerPage(0)
  }, [customer.id, statementRows.length])

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
    <AppPageShell className="customers-page-type customer-detail-page w-full space-y-5">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink to="/musteriler" label="Müşteriler" />}
        centerTitle={String('Müşteri Detayı').toLocaleUpperCase('tr-TR')}
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <div
            ref={deleteAnchorRef}
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
                        if (item.path) {
                          navigate(
                            item.path.includes('?')
                              ? `${item.path}&customer=${customer.id}`
                              : `${item.path}?customer=${customer.id}`,
                          )
                          return
                        }
                        if (item.docType) {
                          navigate(`/musteriler/${customer.id}/belge/${item.docType}`)
                          return
                        }
                        if (item.action === 'load-shipment') {
                          navigate(`/musteriler/${customer.id}/yuk-sevkiyat`)
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

      {voiceNotice ? (
        <div className="flex items-center justify-between gap-3 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className={`${YF_TEXT_CLASS} !text-emerald-700`}>{voiceNotice}</p>
          <button
            type="button"
            className={`${YF_TEXT_CLASS} rounded-lg px-2 py-1 hover:bg-emerald-500/10`}
            onClick={() => setVoiceNotice('')}
          >
            Kapat
          </button>
        </div>
      ) : null}

      <div className="customer-detail-main-grid grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <AppPagePanel className="customer-detail-ledger-panel flex h-full w-full flex-col overflow-visible">
          <div
            className={`${STATEMENT_ROW_CLASS} shrink-0 border-b border-[var(--glass-border)] ${DETAIL_TABLE_HEADER_CLASS}`}
          >
            <span className="min-w-0 truncate">{'İşlem Tarihi'.toLocaleUpperCase('tr-TR')}</span>
            <span className="min-w-0 truncate">{'İşlem Yeri'.toLocaleUpperCase('tr-TR')}</span>
            <span className="min-w-0 truncate">{'İşlem Türü'.toLocaleUpperCase('tr-TR')}</span>
            <span className="min-w-0 truncate">{'Açıklama'.toLocaleUpperCase('tr-TR')}</span>
            <span className="min-w-0 truncate text-right">{'Meblağ'.toLocaleUpperCase('tr-TR')}</span>
            <span className="min-w-0 truncate text-right">{'Bakiye'.toLocaleUpperCase('tr-TR')}</span>
          </div>

          <div className="customer-ledger-body min-h-0 flex-1 divide-y divide-[var(--glass-border)]">
            {ledgerPageRows.length === 0 ? (
              <p className="px-1 py-8 text-center text-[12px] font-normal text-[var(--muted)]">
                Hareket kaydı yok.
              </p>
            ) : (
              ledgerPageRows.map((row) => (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/musteriler/${customer.id}/hareket/${row.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter')
                      navigate(`/musteriler/${customer.id}/hareket/${row.id}`)
                  }}
                  className={`${STATEMENT_ROW_CLASS} cursor-pointer`}
                >
                  <span className={DETAIL_CELL_CLASS}>{row.date}</span>
                  <span className={`${DETAIL_CELL_CLASS} truncate`}>{row.accountName}</span>
                  <span className={`${DETAIL_CELL_CLASS} !font-bold text-[var(--ink)]`}>
                    {row.type}
                  </span>
                  <span className={`${DETAIL_CELL_CLASS} truncate`}>{row.description}</span>
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

          <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-border)] pt-3">
            <p className={DETAIL_CELL_CLASS}>
              {statementRows.length > 0
                ? `${statementRows.length} kayıttan ${ledgerPageStart + 1}-${ledgerPageEnd} arası gösteriliyor.`
                : 'Kayıt yok.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={LEDGER_PAGE_BTN_CLASS}
                disabled={statementRows.length === 0 || safeLedgerPage <= 0}
                onClick={() => setLedgerPage((page) => Math.max(0, page - 1))}
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className={`${DETAIL_CELL_CLASS} min-w-[3.5rem] text-center tabular-nums`}>
                {statementRows.length === 0 ? '0/0' : `${safeLedgerPage + 1}/${ledgerPageCount}`}
              </span>
              <button
                type="button"
                className={LEDGER_PAGE_BTN_CLASS}
                disabled={statementRows.length === 0 || safeLedgerPage >= ledgerPageCount - 1}
                onClick={() =>
                  setLedgerPage((page) => Math.min(ledgerPageCount - 1, page + 1))
                }
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleDownloadStatementPdf}
                className={`${HEADER_ACTION_CTA_CLASS} !h-10 ${HEADER_ACTION_GRADIENTS.violet}`}
              >
                <span className={YF_TEXT_ON_COLOR_CLASS}>Dışarı Aktar</span>
              </button>
            </div>
          </div>
        </AppPagePanel>

        <aside className="customer-detail-actions-panel flex h-full flex-col gap-4">
          <section className="card shrink-0 space-y-3">
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

            <div className="divide-y divide-[var(--glass-border)] border-t border-[var(--glass-border)] pt-1">
              <div className="flex items-center justify-between gap-2 py-2.5">
                <p className={`${DETAIL_CELL_CLASS} uppercase`}>Gecikmiş Tahsilat</p>
                <p className="customer-balance-amount customer-balance-negative shrink-0 tabular-nums text-[14px] font-bold leading-tight tracking-normal">
                  {formatTreasuryCurrency(overdueCollection)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <p className={`${DETAIL_CELL_CLASS} uppercase`}>Kalan Bakiye</p>
                <p
                  className={`customer-balance-amount shrink-0 tabular-nums text-[14px] font-bold leading-tight tracking-normal ${balanceTone(currentBalance)}`}
                >
                  {formatTreasuryCurrency(currentBalance)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 py-2.5">
                <p className={`${DETAIL_CELL_CLASS} !font-bold uppercase !text-[var(--ink)]`}>
                  Toplam Tahsilat
                </p>
                <p className="customer-balance-amount customer-balance-blue shrink-0 tabular-nums text-[14px] font-bold leading-tight tracking-normal">
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

          <section className="card customer-screen-settings-card flex min-h-0 min-w-0 flex-1 flex-col space-y-5 overflow-hidden p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--muted)]">
                <Monitor className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="customer-screen-settings-title text-[14px] font-bold uppercase leading-tight tracking-normal text-[var(--ink)]">
                Müşteri Ekranı Ayarları
              </h2>
            </div>

            <div className="flex min-w-0 gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
              <p className={`${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal !text-[12px] leading-5`}>
                Müşteri ekranı ayarlarınızı buradan yapabilirsiniz. Değişiklikler anında kaydedilir.
              </p>
            </div>

            <div className="min-w-0 flex-1 space-y-4 overflow-y-auto">
              <label className="flex min-w-0 gap-3">
                <input
                  type="checkbox"
                  checked={portalSettings.paymentReminder}
                  onChange={(e) => updatePortalSettings({ paymentReminder: e.target.checked })}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-ds-border accent-blue-500"
                />
                <span className="min-w-0 flex-1">
                  <span className={`block ${DETAIL_CELL_CLASS} !font-bold uppercase`}>Ödeme Hatırlat</span>
                  <span className={`mt-1 block ${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal !text-[12px] leading-5`}>
                    Müşterinize ait faturalarınızın ödemeleri, ödeme tarihinde e-posta ile
                    hatırlatılacaktır.
                  </span>
                </span>
              </label>

              <label className="flex min-w-0 gap-3">
                <input
                  type="checkbox"
                  checked={portalSettings.onlineCollection}
                  onChange={(e) => updatePortalSettings({ onlineCollection: e.target.checked })}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-ds-border accent-blue-500"
                />
                <span className="min-w-0 flex-1">
                  <span className={`block ${DETAIL_CELL_CLASS} !font-bold uppercase`}>Online Tahsilat</span>
                  <span className={`mt-1 block ${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal !text-[12px] leading-5`}>
                    Kredi kartı ile tahsilat özelliği hazırla.
                  </span>
                </span>
              </label>

              <div className="min-w-0 space-y-3">
                <div className="flex min-w-0 items-center gap-3">
                  <List className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
                  <p className={`${DETAIL_CELL_CLASS} !font-bold uppercase`}>IBAN Numaralarınız</p>
                </div>
                <p className={`pl-7 ${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal !text-[12px] leading-5`}>
                  Paylaşabileceğiniz IBAN numarası olan hesaplarınız
                </p>
                <div className="space-y-2 pl-7">
                  {(companySettings.bankAccounts || []).length === 0 ? (
                    <p className={`${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal`}>
                      Henüz banka hesabı eklenmemiş.
                    </p>
                  ) : (
                    (companySettings.bankAccounts || []).map((account) => (
                      <label
                        key={account.id}
                        className={`flex min-w-0 items-start gap-2 ${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal`}
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
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ds-border accent-blue-500"
                        />
                        <span className="min-w-0 flex-1">
                          {account.bankName} · {account.label}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Users className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
                  <p className={`${DETAIL_CELL_CLASS} !font-bold uppercase`}>Erişimi Olan Kişiler</p>
                </div>
                {(portalSettings.accessEmails || []).map((email) => (
                  <div
                    key={email}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2"
                  >
                    <span className={`${DETAIL_CELL_CLASS} min-w-0 flex-1 !font-bold !overflow-visible !whitespace-normal break-all`}>
                      {email}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePortalSettings({
                          accessEmails: portalSettings.accessEmails.filter((item) => item !== email),
                        })
                      }
                      className="shrink-0 text-[var(--muted)] hover:text-red-500"
                      aria-label={`${email} kaldır`}
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

              <div className="min-w-0 space-y-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                  <p className={`${DETAIL_CELL_CLASS} !font-bold uppercase !text-blue-600`}>
                    B2B Müşteri Paneli
                  </p>
                </div>
                <p className={`${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal !text-[12px] leading-5`}>
                  Müşterinize özel panel linki ile cari hareketler, ürünler, sipariş ve üretim
                  takibini paylaşın.
                </p>
                <button
                  type="button"
                  onClick={toggleB2bAccess}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                    b2bAccess?.enabled
                      ? 'border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20'
                      : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                  }`}
                >
                  {b2bAccess?.enabled ? 'B2B Erişimini Kapat' : 'B2B Erişimi Ver'}
                </button>
                {b2bAccess?.enabled && b2bAccess.accessToken ? (
                  <div className="min-w-0 space-y-2">
                    <div className="flex min-w-0 items-start gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                      <p className={`min-w-0 flex-1 break-all ${DETAIL_CELL_CLASS} !overflow-visible !whitespace-normal`}>
                        {getPortalUrl(b2bAccess.accessToken)}
                      </p>
                      <button
                        type="button"
                        onClick={copyPortalLink}
                        className="shrink-0 text-[var(--muted)] hover:text-[var(--ink)]"
                        aria-label="Linki kopyala"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={getPortalUrl(b2bAccess.accessToken)}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-[var(--muted)] hover:text-[var(--ink)]"
                        aria-label="Paneli aç"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    {linkCopied ? (
                      <p className={`${DETAIL_CELL_CLASS} !font-bold !text-emerald-600`}>Link kopyalandı</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </aside>
      </div>

      <ActivityHistoryPanel activity={activity} customer={customer} />

      <DeleteConfirmOverlay
        open={pendingDelete}
        anchorRef={deleteAnchorRef}
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
  nested = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Wrapper = nested ? 'div' : 'section'
  return (
    <Wrapper
      className={
        nested
          ? 'overflow-hidden rounded-2xl border border-dark-500/40 bg-dark-700/25'
          : 'card overflow-hidden p-0'
      }
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 text-left transition-colors hover:bg-dark-700/30 ${
          nested ? 'px-4 py-3' : 'px-5 py-4'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex shrink-0 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 ${accent} ${
              nested ? 'h-8 w-8' : 'h-9 w-9'
            }`}
          >
            <Icon className={nested ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </span>
          <span
            className={`font-black uppercase tracking-wide text-gray-200 ${
              nested ? 'text-xs' : 'text-sm'
            }`}
          >
            {title}
          </span>
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
      {open && (
        <div className={`border-t border-dark-500/40 ${nested ? 'p-3' : 'p-5'}`}>{children}</div>
      )}
    </Wrapper>
  )
}

function EmptyPanelState({ message }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-dark-500/50 bg-dark-700/25 px-4 py-8 text-center text-xs font-semibold text-gray-500">
      {message}
    </div>
  )
}

function ActivityHistoryPanel({ activity, customer }) {
  return (
    <CollapsiblePanel
      icon={History}
      title="Aktivite Geçmişi"
      count={activity.length}
      accent="text-blue-300"
      defaultOpen={false}
    >
      <div className="space-y-4">
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

        <div className="space-y-3 border-t border-dark-500/40 pt-4">
          <CollapsiblePanel
            nested
            icon={Package}
            title="Müşteri Stoğu"
            accent="text-cyan-300"
            defaultOpen={false}
          >
            <CustomerStockPanel customer={customer} embedded />
          </CollapsiblePanel>

          <EngagementPanels customer={customer} nested />
        </div>
      </div>
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

function EngagementPanels({ customer, nested = false }) {
  const data = useMemo(() => buildEngagementData(customer), [customer])

  const panels = [
    {
      icon: ListChecks,
      title: 'Görevler',
      count: data.tasks.length,
      accent: 'text-amber-300',
      empty: 'Bu müşteri için görev bulunmuyor.',
      items: data.tasks,
      rowIcon: ListChecks,
      withBadge: true,
    },
    {
      icon: CalendarDays,
      title: 'Ajanda',
      count: data.agenda.length,
      accent: 'text-purple-300',
      empty: 'Bu müşteri için ajanda kaydı bulunmuyor.',
      items: data.agenda,
      rowIcon: CalendarDays,
    },
    {
      icon: Phone,
      title: 'İletişim Durumları',
      count: data.contacts.length,
      accent: 'text-emerald-300',
      empty: 'Bu müşteri için iletişim kaydı bulunmuyor.',
      items: data.contacts,
      rowIcon: Phone,
      withBadge: true,
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Görüşmeleri',
      count: data.whatsapp.length,
      accent: 'text-green-300',
      empty: 'WhatsApp görüşmesi bulunmuyor.',
      items: data.whatsapp,
      rowIcon: MessageCircle,
    },
    {
      icon: Instagram,
      title: 'Instagram Görüşmeleri',
      count: data.instagram.length,
      accent: 'text-pink-300',
      empty: 'Instagram görüşmesi bulunmuyor.',
      items: data.instagram,
      rowIcon: Instagram,
    },
    {
      icon: Facebook,
      title: 'Facebook Görüşmeleri',
      count: data.facebook.length,
      accent: 'text-sky-300',
      empty: 'Facebook görüşmesi bulunmuyor.',
      items: data.facebook,
      rowIcon: Facebook,
    },
  ]

  return (
    <div className="space-y-3">
      {panels.map((panel) => (
        <CollapsiblePanel
          key={panel.title}
          nested={nested}
          icon={panel.icon}
          title={panel.title}
          count={panel.count}
          accent={panel.accent}
          defaultOpen={false}
        >
          {panel.items.length === 0 ? (
            <EmptyPanelState message={panel.empty} />
          ) : (
            <div className="space-y-2">
              {panel.items.map((item) => (
                <EngagementRow
                  key={item.id}
                  icon={panel.rowIcon}
                  title={item.title}
                  detail={item.detail}
                  stamp={item.stamp}
                  badge={panel.withBadge ? item.badge : undefined}
                  badgeClass={panel.withBadge ? item.badgeClass : undefined}
                />
              ))}
            </div>
          )}
        </CollapsiblePanel>
      ))}
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
