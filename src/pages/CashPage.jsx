import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CASH_BASE_PATH } from '../data/treasuryMenu'
import {
  Banknote,
  Calendar,
  ImagePlus,
  Landmark,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import CashAccountDetailLayout from '../components/Cash/CashAccountDetailLayout'
import {
  CashChequeHistoryTable,
  CashDetailSidebar,
  CashMovementHistoryTable,
} from '../components/Cash/CashAccountDetailSections'
import SearchInput from '../components/Common/SearchInput'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { DeleteTrashButton } from '../components/Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../components/EditableDropdownPill'
import { getCustomerProfiles } from '../data/customerProfiles'
import { customers } from '../data/mockData'
import {
  addTreasuryMovement,
  archiveTreasuryAccount,
  calculateAccountBalance,
  createCustomerCollection,
  createCustomerPayment,
  createExpensePayment,
  deleteTreasuryAccount,
  deleteTreasuryMovement,
  fixTreasuryAccountBalance,
  formatTreasuryCurrency,
  getTreasuryAccounts,
  getTreasuryMovements,
  restoreTreasuryAccount,
  restoreTreasuryMovement,
  saveTreasuryAccounts,
  saveTreasuryMovements,
  updateTreasuryMovement,
} from '../utils/treasuryStore'
import { getCustomerDisplay } from '../utils/customerDisplay'
import {
  BTN_PRIMARY,
  BTN_SUCCESS,
  DUZENLEME_KALEMI_BUTTON_CLASS,
  TEKLIFLER_COP_KUTUSU_BUTTON_CLASS,
} from '../utils/buttonStyles'
import { readOptionLists } from '../utils/customerMeta'

const ACCOUNT_TYPE_OPTIONS = [
  { label: 'Nakit Kasa', color: 'bg-emerald-500' },
  { label: 'Çek Kasası', color: 'bg-purple-500' },
  { label: 'Banka Hesabı', color: 'bg-blue-500' },
]
const EXPENSE_CATEGORY_OPTIONS = [
  { label: 'Genel Gider', color: 'bg-orange-500' },
  { label: 'Malzeme Ödemesi', color: 'bg-blue-500' },
  { label: 'Kira', color: 'bg-purple-500' },
  { label: 'Personel', color: 'bg-emerald-500' },
  { label: 'Nakliye', color: 'bg-cyan-500' },
]
const BANK_OPTIONS_STORAGE_KEY = 'bach-cash-bank-options'
const BANK_BALANCE_RESET_KEY = 'bach-cash-bank-balance-reset-v1'
const CASH_PAGE_RESTORE_KEY = 'bach-cash-page-restore-v1'
const BANK_OPTION_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-500']
const DEFAULT_TURKISH_BANK_NAMES = [
  'T.C. Ziraat Bankası',
  'Türkiye Halk Bankası',
  'Türkiye Vakıflar Bankası',
  'Adabank',
  'Akbank',
  'Anadolubank',
  'Fibabanka',
  'Şekerbank',
  'Turkish Bank',
  'Turkland Bank',
  'Türk Ekonomi Bankası',
  'Türkiye İş Bankası',
  'Yapı ve Kredi Bankası',
  'Alternatif Bank',
  'Arap Türk Bankası',
  'Bank of China Turkey',
  'Burgan Bank',
  'Citibank',
  'DenizBank',
  'Deutsche Bank',
  'HSBC Bank',
  'ICBC Turkey Bank',
  'ING Bank',
  'Intesa Sanpaolo',
  'JPMorgan Chase Bank',
  'MUFG Bank Turkey',
  'Odea Bank',
  'QNB Bank',
  'Rabobank',
  'Société Générale',
  'Albaraka Türk Katılım Bankası',
  'Kuveyt Türk Katılım Bankası',
  'Türkiye Finans Katılım Bankası',
  'Vakıf Katılım Bankası',
  'Ziraat Katılım Bankası',
  'Emlak Katılım Bankası',
  'Hayat Finans Katılım Bankası',
  'T.O.M. Katılım Bankası',
  'Dünya Katılım Bankası',
  'İller Bankası',
  'Türk Eximbank',
  'Türkiye Kalkınma ve Yatırım Bankası',
  'Aktif Bank',
  'Diler Yatırım Bankası',
  'GSD Yatırım Bankası',
  'Nurol Yatırım Bankası',
  'Pasha Yatırım Bankası',
  'Türkiye Sınai Kalkınma Bankası',
  'Golden Global Yatırım Bankası',
  'Misyon Yatırım Bankası',
]

function buildBankOptions(names = DEFAULT_TURKISH_BANK_NAMES) {
  return names.map((label, index) => ({
    label,
    color: BANK_OPTION_COLORS[index % BANK_OPTION_COLORS.length],
  }))
}

function loadBankOptions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BANK_OPTIONS_STORAGE_KEY) || 'null')
    if (Array.isArray(parsed) && parsed.length) {
      return parsed
        .filter((option) => String(option?.label || '').trim())
        .map((option, index) => ({
          label: String(option.label).trim(),
          color: option.color || BANK_OPTION_COLORS[index % BANK_OPTION_COLORS.length],
        }))
    }
  } catch {
    // localStorage kapalıysa varsayılan banka listesini kullan.
  }
  return buildBankOptions()
}

function saveBankOptions(options) {
  localStorage.setItem(BANK_OPTIONS_STORAGE_KEY, JSON.stringify(options))
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-dark-500/50 bg-dark-800 shadow-card">
        <div className="flex items-center justify-between border-b border-dark-500/45 px-4 py-3">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-dark-700 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function emptyAccount() {
  return {
    name: '',
    type: 'Nakit Kasa',
    openingBalance: '',
    iban: '',
    chequeNo: '',
    chequeBank: '',
    chequeBranch: '',
    chequeDueDate: '',
    chequeOwner: '',
  }
}

function emptyCollection(accounts) {
  return {
    customerName: customers.list[0]?.company || '',
    accountId: accounts[0]?.id || '',
    method: 'Nakit',
    amount: '',
    description: '',
    chequeNo: '',
    chequeBank: '',
    chequeBranch: '',
    chequeDueDate: '',
    chequeOwner: '',
  }
}

function emptyExpense(accounts) {
  return {
    vendorName: '',
    accountId: accounts[0]?.id || '',
    method: 'Banka',
    amount: '',
    category: 'Genel Gider',
    description: '',
  }
}

function emptyChequeDetail() {
  return {
    chequeNo: '',
    chequeBank: '',
    chequeBranch: '',
    chequeDueDate: '',
    chequeOwner: '',
    partyId: '',
    partyName: '',
    partyType: '',
    amount: '',
    photo: '',
  }
}

function formatAccountOptionLabel(account) {
  return `${account.name} · ${account.type === 'Banka Hesabı' ? 'Banka' : 'Nakit Kasa'}`
}

function formatTransferAccountOptionLabel(account) {
  const currency = account.currency === 'TRY' || !account.currency ? '₺' : account.currency
  return `${currency} - ${account.name}`
}

function getTreasuryAccountOptionVisual(account) {
  if (account.type === 'Banka Hesabı') {
    return { icon: Landmark, iconTone: 'text-blue-300' }
  }
  if (account.type === 'Çek Kasası') {
    return { icon: Banknote, iconTone: 'text-purple-300' }
  }
  return { icon: Banknote, iconTone: 'text-emerald-300' }
}

function resolveAccountFromOptionLabel(label, accounts) {
  return accounts.find((account) => formatAccountOptionLabel(account) === label)
    || accounts.find((account) => formatTransferAccountOptionLabel(account) === label)
    || accounts.find((account) => account.name === label)
    || accounts.find((account) => String(label).includes(account.name))
    || null
}

function emptyTransferForm(accounts = [], excludeAccountId = '') {
  const firstTarget = accounts.find((account) => (
    account.id !== excludeAccountId && account.type !== 'Çek Kasası'
  ))
  return {
    targetAccountName: firstTarget ? formatTransferAccountOptionLabel(firstTarget) : '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    description: '',
  }
}

function emptyChequeSettlement(detail, accounts, mode = 'collection') {
  const first = accounts[0]
  return {
    targetAccountName: mode === 'collection' && first ? formatAccountOptionLabel(first) : '',
    amount: detail ? formatAmountForCurrencyInput(Math.abs(Number(detail.amount) || 0)) : '',
    expenseDescription: '',
    expenseCategory: 'Genel Gider',
    expenseAmount: '',
    partyId: mode === 'payment' ? (detail?.partyId || '') : '',
    partyName: mode === 'payment' ? (detail?.partyName || '') : '',
    partyType: mode === 'payment' ? (detail?.partyType || '') : '',
  }
}

function emptyAccountMovement(account = {}) {
  const type = account.type === 'Banka Hesabı' ? 'Banka Girişi' : 'Nakit Girişi'
  return {
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    referenceNo: '',
    method: account.type === 'Banka Hesabı' ? 'Banka' : 'Nakit',
    direction: 'in',
    type,
  }
}

function getChequeDetails(account = {}) {
  const chequeEntries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
  const details = []
  const hasBaseCheque = Boolean(
    account.chequeNo
    || account.chequeBank
    || account.chequeBranch
    || account.chequeDueDate
    || account.chequeOwner
    || Number(account.openingBalance),
  )
  if (hasBaseCheque) {
    details.push({
      id: `${account.id}-base-cheque`,
      chequeNo: account.chequeNo || '',
      chequeBank: account.chequeBank || '',
      chequeBranch: account.chequeBranch || '',
      chequeDueDate: account.chequeDueDate || '',
      chequeOwner: account.chequeOwner || '',
      photo: account.chequePhoto || '',
      amount: Number(account.chequeBaseAmount ?? (chequeEntries.length ? 0 : account.openingBalance)) || 0,
      collected: Boolean(account.chequeCollected),
      paid: Boolean(account.chequePaid),
      collectedAt: account.collectedAt || '',
      paidAt: account.paidAt || '',
      settledAt: account.collectedAt || account.paidAt || '',
      collectedToAccountId: account.collectedToAccountId || '',
      collectedToAccountName: account.collectedToAccountName || '',
      expenseAmount: Number(account.chequeExpenseAmount) || 0,
      expenseDescription: account.chequeExpenseDescription || '',
      expenseCategory: account.chequeExpenseCategory || '',
    })
  }
  return [...details, ...chequeEntries.map((entry) => ({
    ...entry,
    collected: Boolean(entry.collected),
    paid: Boolean(entry.paid),
    collectedAt: entry.collectedAt || '',
    paidAt: entry.paidAt || '',
    settledAt: entry.settledAt || entry.collectedAt || entry.paidAt || '',
    expenseAmount: Number(entry.expenseAmount) || 0,
    expenseDescription: entry.expenseDescription || '',
    expenseCategory: entry.expenseCategory || '',
  }))]
}

function formatDateTr(date) {
  const value = String(date || '')
  if (!value.includes('-')) return value || '-'
  return value.split('-').reverse().join('.')
}

function formatTransactionDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTransactionTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function resolveChequeTransactionAt(detail) {
  return detail?.settledAt || detail?.collectedAt || detail?.paidAt || ''
}

const CHEQUE_TABLE_GRID = 'grid-cols-[minmax(0,1fr)_0.75fr_0.7fr_0.75fr_0.8fr_0.55fr_minmax(0,1fr)_0.85fr_96px]'
const MOVEMENT_TABLE_GRID = 'grid-cols-[1.1fr_0.95fr_1fr_1.35fr_0.85fr_0.85fr]'

function parseMovementSortKey(date) {
  const text = String(date || '').trim()
  if (!text) return 0
  if (text.includes('.')) {
    const [day, month, year] = text.split('.')
    return new Date(`${year}-${month}-${day}T12:00:00`).getTime() || 0
  }
  return new Date(`${text}T12:00:00`).getTime() || 0
}

function formatMovementDateLong(date) {
  const text = String(date || '').trim()
  if (!text) return '—'
  if (text.includes('.')) {
    const [day, month, year] = text.split('.')
    const parsed = new Date(`${year}-${month}-${day}T12:00:00`)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return text
}

function resolveRelatedAccountLabel(movement) {
  return movement.customerName || movement.vendorName || movement.partyName || '—'
}

function buildAccountMovementRows(account, movements) {
  const accountMovements = movements.filter((movement) => movement.accountId === account.id)
  const sorted = [...accountMovements].sort((left, right) => (
    parseMovementSortKey(right.date) - parseMovementSortKey(left.date)
  ))
  let balanceAfter = calculateAccountBalance(account, movements)
  return sorted.map((movement) => {
    const row = { ...movement, runningBalance: balanceAfter }
    const amount = Number(movement.amount) || 0
    balanceAfter -= movement.direction === 'in' ? amount : -amount
    return row
  })
}

function titleCaseText(value) {
  return String(value || '').toLocaleLowerCase('tr-TR').replace(/(^|\s)(\S)/g, (match) => match.toLocaleUpperCase('tr-TR'))
}

function parseDateTextToIso(value) {
  const match = String(value || '').trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!match) return ''
  const [, day, month, year] = match
  const iso = `${year}-${month}-${day}`
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  if (
    date.getFullYear() !== Number(year)
    || date.getMonth() + 1 !== Number(month)
    || date.getDate() !== Number(day)
  ) return ''
  return iso
}

function formatDateInputText(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

function resolveDateCaretPosition(formattedValue, digitCountBeforeCaret) {
  if (digitCountBeforeCaret <= 0) return 0
  let digitCount = 0
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      digitCount += 1
    }
    if (digitCount >= digitCountBeforeCaret) return index + 1
  }
  return formattedValue.length
}

function DateTextPicker({ value, onChange, className = '' }) {
  const inputRef = useRef(null)
  const pickerRef = useRef(null)
  const pendingCaretRef = useRef(null)
  const [textValue, setTextValue] = useState(() => (value ? formatDateTr(value) : ''))

  useEffect(() => {
    setTextValue(value ? formatDateTr(value) : '')
  }, [value])

  useLayoutEffect(() => {
    if (pendingCaretRef.current == null || !inputRef.current) return
    const nextCaret = Math.min(pendingCaretRef.current, textValue.length)
    inputRef.current.setSelectionRange(nextCaret, nextCaret)
    pendingCaretRef.current = null
  }, [textValue])

  function updateFromText(event) {
    const nextValue = event.target.value
    const caretPosition = event.target.selectionStart ?? nextValue.length
    const digitCountBeforeCaret = nextValue.slice(0, caretPosition).replace(/\D/g, '').length
    const formattedValue = formatDateInputText(nextValue)
    pendingCaretRef.current = resolveDateCaretPosition(formattedValue, digitCountBeforeCaret)
    setTextValue(formattedValue)
    const iso = parseDateTextToIso(formattedValue)
    if (iso) onChange?.(iso)
    if (!formattedValue.trim()) onChange?.('')
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        value={textValue}
        onChange={updateFromText}
        className="form-input h-9 pr-10 text-xs"
        placeholder="gg.aa.yyyy"
      />
      <button
        type="button"
        onClick={() => pickerRef.current?.showPicker?.()}
        className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-dark-700 hover:text-white"
        title="Takvimden seç"
      >
        <Calendar className="h-4 w-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        value={value || ''}
        onChange={(event) => onChange?.(event.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  )
}

function parseCurrencyText(value) {
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return Number(normalized) || 0
}

function formatCurrencyInputText(value) {
  const text = String(value || '')
  if (text.includes(',')) {
    const [liraPart = '', kurusPart = ''] = text.split(',')
    const liraDigits = liraPart.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0'
    const cents = kurusPart.replace(/\D/g, '').slice(0, 2).padEnd(2, '0')
    const groupedLira = liraDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${groupedLira},${cents}`
  }

  const digits = text.replace(/\D/g, '')
  if (!digits) return ''
  const hasManualCents = digits.length > 4 && digits.slice(-2) !== '00'
  const cents = hasManualCents ? digits.slice(-2) : '00'
  const liraSource = hasManualCents ? digits.slice(0, -2) : digits
  const liraDigits = liraSource.replace(/^0+(?=\d)/, '') || '0'
  const groupedLira = liraDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${groupedLira},${cents}`
}

function formatAmountForCurrencyInput(value) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function CurrencyTextInput({ value, onChange }) {
  function handleChange(event) {
    const rawValue = event.target.value
    if (!rawValue.trim()) {
      onChange?.('')
      return
    }
    const [liraPart = '', kurusPart] = rawValue.split(',')
    const liraDigits = liraPart.replace(/\D/g, '')
    const groupedLira = liraDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    onChange?.(kurusPart !== undefined ? `${groupedLira},${kurusPart.replace(/\D/g, '').slice(0, 2)}` : groupedLira)
  }

  return (
    <input
      value={value}
      onChange={handleChange}
      inputMode="decimal"
      className="form-input h-9 text-xs"
    />
  )
}

export default function CashPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState(() => getTreasuryAccounts())
  const [movements, setMovements] = useState(() => getTreasuryMovements())
  const [selectedAccountId, setSelectedAccountId] = useState(() => accountId || getTreasuryAccounts()[0]?.id)
  const [modal, setModal] = useState(null)
  const [accountPanelOpen, setAccountPanelOpen] = useState(false)
  const [transferPanelOpen, setTransferPanelOpen] = useState(false)
  const [transferForm, setTransferForm] = useState(() => emptyTransferForm())
  const [cashFlowMenuOpen, setCashFlowMenuOpen] = useState(false)
  const [otherOpsMenuOpen, setOtherOpsMenuOpen] = useState(false)
  const [balanceFixPanelOpen, setBalanceFixPanelOpen] = useState(false)
  const [balanceFixForm, setBalanceFixForm] = useState({ targetAmount: '', description: '' })
  const [accountOpsConfirm, setAccountOpsConfirm] = useState(null)
  const [editAccountPanelOpen, setEditAccountPanelOpen] = useState(false)
  const [editAccountForm, setEditAccountForm] = useState({ name: '', iban: '' })
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)
  const [bankOptions, setBankOptions] = useState(loadBankOptions)
  const [accountForm, setAccountForm] = useState(emptyAccount)
  const [accountMovementPanelOpen, setAccountMovementPanelOpen] = useState(false)
  const [accountMovementForm, setAccountMovementForm] = useState(emptyAccountMovement)
  const [editingMovementId, setEditingMovementId] = useState(null)
  const [accountMovementSearch, setAccountMovementSearch] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [chequePanelOpen, setChequePanelOpen] = useState(false)
  const [editingChequeId, setEditingChequeId] = useState(null)
  const [chequeForm, setChequeForm] = useState(emptyChequeDetail)
  const [chequePartyMenuOpen, setChequePartyMenuOpen] = useState(false)
  const [chequePartySearch, setChequePartySearch] = useState('')
  const [pendingChequeDirection, setPendingChequeDirection] = useState('in')
  const [chequeFilters, setChequeFilters] = useState({
    search: '',
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [chequeSettlementDetailId, setChequeSettlementDetailId] = useState(null)
  const [chequeSettlementMode, setChequeSettlementMode] = useState(null)
  const [chequeSettlementForm, setChequeSettlementForm] = useState(() => emptyChequeSettlement(null, []))
  const [settlementPartyMenuOpen, setSettlementPartyMenuOpen] = useState(false)
  const [collectionForm, setCollectionForm] = useState(() => emptyCollection(accounts))
  const [expenseForm, setExpenseForm] = useState(() => emptyExpense(accounts))

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0]
  const accountTypeOptions = optionLists.account?.length ? optionLists.account : ACCOUNT_TYPE_OPTIONS

  useEffect(() => {
    if (accounts.length || localStorage.getItem(CASH_PAGE_RESTORE_KEY)) return
    const restoredAccounts = [
      {
        id: 'cash-main',
        name: 'Merkez Kasa',
        type: 'Nakit Kasa',
        currency: 'TRY',
        openingBalance: 0,
        color: 'text-emerald-300',
      },
      {
        id: 'bank-ak-ticari',
        name: 'Ak Bank - Ticari',
        type: 'Banka Hesabı',
        currency: 'TRY',
        openingBalance: 0,
        iban: '',
        color: 'text-blue-300',
      },
      {
        id: 'cheque-main',
        name: 'Merkez Çek Kasası',
        type: 'Çek Kasası',
        currency: 'TRY',
        openingBalance: 0,
        chequeBaseAmount: 0,
        chequeEntries: [],
        color: 'text-purple-300',
      },
    ]
    const restoredMovements = [
      {
        id: 'restored-cash-prepayment',
        accountId: 'cash-main',
        accountName: 'Merkez Kasa',
        direction: 'in',
        type: 'Nakit Girişi',
        method: 'Nakit',
        amount: 50400.2,
        date: '16.06.2026',
        description: 'Ön ödeme alındı',
        status: 'İşlendi',
      },
    ]
    saveTreasuryAccounts(restoredAccounts)
    saveTreasuryMovements(restoredMovements)
    localStorage.setItem(CASH_PAGE_RESTORE_KEY, '1')
    setAccounts(restoredAccounts)
    setMovements(restoredMovements)
    setSelectedAccountId(restoredAccounts[0].id)
  }, [])

  useEffect(() => {
    if (!activeMenu) return undefined
    function closeMenu() { setActiveMenu(null) }
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [activeMenu])

  useEffect(() => {
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refreshOptionLists)
    return () => window.removeEventListener('bach:option-lists-updated', refreshOptionLists)
  }, [])

  useEffect(() => {
    const firstAccount = accounts[0]
    if (!firstAccount?.id) return
    selectAccount(firstAccount.id)
  }, [])

  useEffect(() => {
    if (!accounts.length) return
    if (accounts.some((account) => account.id === selectedAccountId)) return
    selectAccount(accounts[0].id)
  }, [accounts, selectedAccountId])

  const enrichedAccounts = useMemo(() => accounts.map((account) => ({
    ...account,
    balance: calculateAccountBalance(account, movements),
  })), [accounts, movements])

  const detailAccount = useMemo(() => (
    accountId ? enrichedAccounts.find((account) => account.id === accountId) || null : null
  ), [accountId, enrichedAccounts])

  const detailMovementRows = useMemo(() => {
    if (!detailAccount || detailAccount.type === 'Çek Kasası') return []
    const normalizeText = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR')
    const searchQuery = normalizeText(accountMovementSearch)
    const rows = buildAccountMovementRows(detailAccount, movements)
    if (!searchQuery) return rows
    return rows.filter((movement) => [
      movement.date,
      movement.type,
      movement.method,
      movement.referenceNo,
      movement.description,
      movement.customerName,
      movement.vendorName,
      formatTreasuryCurrency(movement.amount),
    ].some((value) => normalizeText(value).includes(searchQuery)))
  }, [accountMovementSearch, detailAccount, movements])

  const detailChequeListRows = useMemo(() => {
    if (!detailAccount || detailAccount.type !== 'Çek Kasası') return []
    const normalizeText = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR')
    const searchQuery = normalizeText(chequeFilters.search)
    const details = getChequeDetails(detailAccount).filter((detail) => {
      if (!searchQuery) return true
      return [
        detail.chequeBank,
        detail.chequeBranch,
        detail.chequeNo,
        detail.chequeDueDate,
        detail.partyName,
        detail.chequeOwner,
      ].some((value) => normalizeText(value).includes(searchQuery))
    })
    return details.flatMap((detail) => {
      const rows = [{ ...detail, rowType: 'cheque' }]
      const expenseAmount = Number(detail.expenseAmount) || 0
      if (expenseAmount > 0) {
        rows.push({
          id: `${detail.id}-expense`,
          rowType: 'expense',
          parentId: detail.id,
          chequeNo: detail.chequeNo,
          expenseDescription: detail.expenseDescription,
          expenseCategory: detail.expenseCategory,
          amount: expenseAmount,
          settledAt: resolveChequeTransactionAt(detail),
        })
      }
      return rows
    })
  }, [chequeFilters.search, detailAccount])

  const transferTargetAccountOptions = useMemo(() => (
    enrichedAccounts
      .filter((account) => account.id !== detailAccount?.id && account.type !== 'Çek Kasası')
      .map((account) => ({
        label: formatTransferAccountOptionLabel(account),
        ...getTreasuryAccountOptionVisual(account),
      }))
  ), [detailAccount?.id, enrichedAccounts])

  useEffect(() => {
    if (!accountId || !detailAccount) return
    setSelectedAccountId(accountId)
    setCollectionForm((current) => ({ ...current, accountId }))
    setExpenseForm((current) => ({ ...current, accountId }))
  }, [accountId, detailAccount?.id])

  useEffect(() => {
    if (localStorage.getItem(BANK_BALANCE_RESET_KEY)) return
    const bankAccount = enrichedAccounts.find((account) => (
      (String(account.type || '').includes('Banka') || String(account.name || '').toLocaleLowerCase('tr-TR').includes('bank'))
      && Number(account.balance)
    ))
    if (!bankAccount) return

    const nextAccounts = accounts.map((account) => (
      account.id === bankAccount.id
        ? { ...account, openingBalance: 0 }
        : account
    ))
    const nextMovements = movements.filter((movement) => movement.accountId !== bankAccount.id)

    saveTreasuryAccounts(nextAccounts)
    saveTreasuryMovements(nextMovements)
    localStorage.setItem(BANK_BALANCE_RESET_KEY, '1')
    setAccounts(nextAccounts)
    setMovements(nextMovements)
  }, [accounts, enrichedAccounts, movements])

  const totals = useMemo(() => {
    const cashBalance = enrichedAccounts
      .filter((account) => account.type === 'Nakit Kasa')
      .reduce((sum, account) => sum + account.balance, 0)
    const bankBalance = enrichedAccounts
      .filter((account) => account.type === 'Banka Hesabı')
      .reduce((sum, account) => sum + account.balance, 0)
    const chequeBalance = enrichedAccounts
      .filter((account) => account.type === 'Çek Kasası')
      .reduce((sum, account) => sum + account.balance, 0)
    return { cashBalance, bankBalance, chequeBalance, total: cashBalance + bankBalance + chequeBalance }
  }, [enrichedAccounts])
  const collectionTargetAccounts = useMemo(() => (
    enrichedAccounts.filter((account) => account.type === 'Nakit Kasa' || account.type === 'Banka Hesabı')
  ), [enrichedAccounts])
  const collectionTargetAccountOptions = useMemo(() => (
    collectionTargetAccounts.map((account) => ({
      label: formatAccountOptionLabel(account),
      ...getTreasuryAccountOptionVisual(account),
    }))
  ), [collectionTargetAccounts])
  const activeChequeSettlementDetail = useMemo(() => {
    if (!chequeSettlementDetailId || selectedAccount?.type !== 'Çek Kasası') return null
    return getChequeDetails(selectedAccount).find((item) => item.id === chequeSettlementDetailId) || null
  }, [chequeSettlementDetailId, selectedAccount, accounts])
  const selectedChequeDetails = selectedAccount?.type === 'Çek Kasası'
    ? getChequeDetails(selectedAccount)
    : []

  const chequePartyOptions = useMemo(() => {
    const query = chequePartySearch.trim().toLocaleLowerCase('tr-TR')
    return getCustomerProfiles()
      .flatMap((profile) => {
        const display = getCustomerDisplay(profile)
        const label = display.companyTitle || display.brandShortName || profile.company || 'Cari'
        return [
          { id: `customer-${profile.id}`, profileId: profile.id, label, type: 'Müşteri' },
          { id: `supplier-${profile.id}`, profileId: profile.id, label, type: 'Tedarikçi' },
        ]
      })
      .filter((option) => {
        if (!query) return true
        return `${option.label} ${option.type}`.toLocaleLowerCase('tr-TR').includes(query)
      })
      .slice(0, 30)
  }, [chequePartySearch])

  const filteredChequeDetails = useMemo(() => {
    const normalizeText = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR')
    const searchQuery = normalizeText(chequeFilters.search)
    return [...selectedChequeDetails]
      .filter((detail) => {
        if (!searchQuery) return true
        return [
          detail.chequeBank,
          detail.chequeBranch,
          detail.chequeNo,
          formatDateTr(detail.chequeDueDate),
          detail.chequeDueDate,
          detail.chequeOwner,
          detail.partyName,
          detail.partyType,
          formatTreasuryCurrency(detail.amount),
          detail.amount,
        ].some((value) => normalizeText(value).includes(searchQuery))
      })
  }, [chequeFilters, selectedChequeDetails])

  const chequeListRows = useMemo(() => (
    filteredChequeDetails.flatMap((detail) => {
      const rows = [{ ...detail, rowType: 'cheque' }]
      const expenseAmount = Number(detail.expenseAmount) || 0
      if (expenseAmount > 0) {
        rows.push({
          id: `${detail.id}-expense`,
          rowType: 'expense',
          parentId: detail.id,
          chequeBank: detail.chequeBank,
          chequeNo: detail.chequeNo,
          expenseDescription: detail.expenseDescription,
          expenseCategory: detail.expenseCategory,
          amount: expenseAmount,
          settledAt: resolveChequeTransactionAt(detail),
        })
      }
      return rows
    })
  ), [filteredChequeDetails])

  const selectedAccountMovements = useMemo(() => {
    if (!selectedAccount?.id || selectedAccount.type === 'Çek Kasası') return []
    const normalizeText = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR')
    const searchQuery = normalizeText(accountMovementSearch)
    return movements
      .filter((movement) => movement.accountId === selectedAccount.id)
      .filter((movement) => {
        if (!searchQuery) return true
        return [
          movement.date,
          movement.type,
          movement.method,
          movement.referenceNo,
          movement.description,
          movement.customerName,
          movement.vendorName,
          formatTreasuryCurrency(movement.amount),
          movement.amount,
        ].some((value) => normalizeText(value).includes(searchQuery))
      })
  }, [accountMovementSearch, movements, selectedAccount])

  function refreshMovements() {
    setMovements(getTreasuryMovements())
  }

  function closeModal() {
    setModal(null)
  }

  function selectAccount(accountIdValue) {
    setSelectedAccountId(accountIdValue)
    setCollectionForm((current) => ({ ...current, accountId: accountIdValue }))
    setExpenseForm((current) => ({ ...current, accountId: accountIdValue }))
    navigate(`${CASH_BASE_PATH}/${accountIdValue}`)
  }

  function closeDetailPanels() {
    setTransferPanelOpen(false)
    setCashFlowMenuOpen(false)
    setOtherOpsMenuOpen(false)
    setAccountMovementPanelOpen(false)
    setEditAccountPanelOpen(false)
  }

  function openTransferPanel() {
    setTransferForm(emptyTransferForm(enrichedAccounts, detailAccount?.id))
    setTransferPanelOpen(true)
    setCashFlowMenuOpen(false)
    setOtherOpsMenuOpen(false)
    setAccountMovementPanelOpen(false)
    setBalanceFixPanelOpen(false)
    setAccountOpsConfirm(null)
    setChequePanelOpen(false)
    setEditAccountPanelOpen(false)
  }

  function openMovementPanel(direction = 'in') {
    if (!detailAccount) return
    setTransferPanelOpen(false)
    setCashFlowMenuOpen(false)
    setOtherOpsMenuOpen(false)
    setBalanceFixPanelOpen(false)
    setAccountOpsConfirm(null)
    setEditAccountPanelOpen(false)
    setChequePanelOpen(false)
    setEditingMovementId(null)
    setAccountMovementForm({
      ...emptyAccountMovement(detailAccount),
      direction,
      type: direction === 'out'
        ? detailAccount.type === 'Banka Hesabı' ? 'Banka Çıkışı' : 'Nakit Çıkışı'
        : detailAccount.type === 'Banka Hesabı' ? 'Banka Girişi' : 'Nakit Girişi',
    })
    setAccountMovementPanelOpen(true)
  }

  useEffect(() => {
    if (!accountId || !detailAccount || detailAccount.type === 'Çek Kasası') return
    const hareket = searchParams.get('hareket')
    if (hareket !== 'gelir' && hareket !== 'gider') return
    openMovementPanel(hareket === 'gider' ? 'out' : 'in')
    setSearchParams({}, { replace: true })
  }, [accountId, detailAccount, searchParams, setSearchParams])

  function openChequeEntryPanel() {
    if (!detailAccount) return
    setTransferPanelOpen(false)
    setCashFlowMenuOpen(false)
    setOtherOpsMenuOpen(false)
    setAccountMovementPanelOpen(false)
    setBalanceFixPanelOpen(false)
    setAccountOpsConfirm(null)
    setEditAccountPanelOpen(false)
    setEditingChequeId(null)
    setChequeForm(emptyChequeDetail())
    setChequePanelOpen(true)
  }

  function submitTransfer(event) {
    event.preventDefault()
    if (!detailAccount?.id) return
    const targetAccount = resolveAccountFromOptionLabel(transferForm.targetAccountName, enrichedAccounts)
    const amount = parseCurrencyText(transferForm.amount)
    if (!targetAccount || targetAccount.id === detailAccount.id) {
      window.alert('Transfer yapılacak hesabı seçin.')
      return
    }
    if (!amount || amount <= 0) {
      window.alert('Transfer tutarı girin.')
      return
    }
    const description = transferForm.description.trim() || `${detailAccount.name} → ${targetAccount.name}`
    const transferDate = transferForm.date ? transferForm.date.split('-').reverse().join('.') : undefined
    addTreasuryMovement({
      accountId: detailAccount.id,
      accountName: detailAccount.name,
      direction: 'out',
      type: 'Hesap Transferi',
      method: detailAccount.type === 'Banka Hesabı' ? 'Banka' : 'Nakit',
      amount,
      date: transferDate,
      description,
      referenceNo: targetAccount.name,
    })
    addTreasuryMovement({
      accountId: targetAccount.id,
      accountName: targetAccount.name,
      direction: 'in',
      type: 'Hesap Transferi',
      method: targetAccount.type === 'Banka Hesabı' ? 'Banka' : 'Nakit',
      amount,
      date: transferDate,
      description,
      referenceNo: detailAccount.name,
    })
    refreshMovements()
    setTransferForm(emptyTransferForm(enrichedAccounts, detailAccount.id))
    setTransferPanelOpen(false)
  }

  function openEditAccountPanel() {
    if (!detailAccount) return
    setEditAccountForm({ name: detailAccount.name || '', iban: detailAccount.iban || '' })
    setEditAccountPanelOpen(true)
    setTransferPanelOpen(false)
    setAccountMovementPanelOpen(false)
    setChequePanelOpen(false)
  }

  function saveAccountEdit(event) {
    event.preventDefault()
    if (!detailAccount?.id) return
    const name = editAccountForm.name.trim()
    if (!name) {
      window.alert('Hesap adı girin.')
      return
    }
    updateAccountById(detailAccount.id, (account) => ({
      ...account,
      name,
      iban: editAccountForm.iban.trim(),
    }))
    setEditAccountPanelOpen(false)
  }

  function openAccountPanel(type = 'Nakit Kasa') {
    setAccountForm({ ...emptyAccount(), type })
    setAccountPanelOpen(true)
  }

  function updateBankOptions(nextOptions) {
    setBankOptions(nextOptions)
    saveBankOptions(nextOptions)
  }

  function updateAccountById(accountId, updater) {
    const nextAccounts = accounts.map((account) => (
      account.id === accountId ? updater(account) : account
    ))
    setAccounts(nextAccounts)
    saveTreasuryAccounts(nextAccounts)
  }

  function removeAccount(deletedAccountId) {
    deleteTreasuryAccount(deletedAccountId)
    const nextAccounts = getTreasuryAccounts()
    setAccounts(nextAccounts)
    setPendingDeleteId(null)
    if (selectedAccountId === deletedAccountId) {
      setSelectedAccountId(nextAccounts[0]?.id)
      setAccountMovementPanelOpen(false)
      setChequePanelOpen(false)
      setEditingMovementId(null)
      setEditingChequeId(null)
    }
    if (accountId === deletedAccountId) navigate(CASH_BASE_PATH)
  }

  function openBalanceFixPanel() {
    if (!detailAccount) return
    setOtherOpsMenuOpen(false)
    setTransferPanelOpen(false)
    setAccountMovementPanelOpen(false)
    setEditAccountPanelOpen(false)
    setAccountOpsConfirm(null)
    setBalanceFixForm({
      targetAmount: formatAmountForCurrencyInput(Math.max(0, Number(detailAccount.balance) || 0)),
      description: '',
    })
    setBalanceFixPanelOpen(true)
  }

  function submitBalanceFix(event) {
    event.preventDefault()
    if (!detailAccount?.id) return
    const target = parseCurrencyText(balanceFixForm.targetAmount)
    if (Number.isNaN(target) || target < 0) return
    fixTreasuryAccountBalance(detailAccount.id, target, { description: balanceFixForm.description })
    refreshMovements()
    setBalanceFixPanelOpen(false)
  }

  function requestArchiveAccount() {
    setOtherOpsMenuOpen(false)
    setAccountOpsConfirm('archive')
  }

  function requestDeleteAccount() {
    setOtherOpsMenuOpen(false)
    setAccountOpsConfirm('delete')
  }

  function confirmAccountOps() {
    if (!detailAccount?.id || !accountOpsConfirm) return
    if (accountOpsConfirm === 'archive') {
      archiveTreasuryAccount(detailAccount.id)
    } else {
      deleteTreasuryAccount(detailAccount.id)
    }
    const nextAccounts = getTreasuryAccounts()
    setAccounts(nextAccounts)
    setAccountOpsConfirm(null)
    setBalanceFixPanelOpen(false)
    setTransferPanelOpen(false)
    setAccountMovementPanelOpen(false)
    if (selectedAccountId === detailAccount.id) {
      setSelectedAccountId(nextAccounts[0]?.id)
    }
    navigate(CASH_BASE_PATH)
  }

  function openAccountAction(account, direction) {
    setSelectedAccountId(account.id)
    setCollectionForm((current) => ({ ...current, accountId: account.id }))
    setExpenseForm((current) => ({ ...current, accountId: account.id }))
    setAccountPanelOpen(false)
    setAccountMovementPanelOpen(false)
    setChequePanelOpen(false)
    setEditingMovementId(null)
    if (account.type === 'Çek Kasası' && direction === 'in') {
      setEditingChequeId(null)
      setChequeForm(emptyChequeDetail())
      setChequePanelOpen(true)
      return
    }
    setAccountMovementForm(emptyAccountMovement(account))
    setAccountMovementPanelOpen(true)
  }

  function submitAccountMovement(event) {
    event.preventDefault()
    if (!selectedAccount?.id) return
    const submitterDirection = event.nativeEvent?.submitter?.value
    const nextDirection = submitterDirection || accountMovementForm.direction || 'in'
    const nextType = nextDirection === 'out'
      ? selectedAccount.type === 'Banka Hesabı' ? 'Banka Çıkışı' : 'Nakit Çıkışı'
      : selectedAccount.type === 'Banka Hesabı' ? 'Banka Girişi' : 'Nakit Girişi'
    const amount = parseCurrencyText(accountMovementForm.amount)
    if (!amount || amount <= 0) {
      return
    }
    const payload = {
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      direction: nextDirection,
      type: editingMovementId ? accountMovementForm.type || nextType : nextType,
      method: accountMovementForm.method,
      amount,
      date: accountMovementForm.date ? accountMovementForm.date.split('-').reverse().join('.') : undefined,
      referenceNo: accountMovementForm.referenceNo.trim(),
      description: accountMovementForm.description.trim(),
    }
    if (editingMovementId) {
      updateTreasuryMovement(editingMovementId, payload)
    } else {
      addTreasuryMovement(payload)
    }
    refreshMovements()
    setAccountMovementForm(emptyAccountMovement(selectedAccount))
    setEditingMovementId(null)
    setAccountMovementPanelOpen(false)
  }

  function editAccountMovement(movement) {
    setChequePanelOpen(false)
    setTransferPanelOpen(false)
    setEditAccountPanelOpen(false)
    setEditingMovementId(movement.id)
    setAccountMovementForm({
      amount: movement.amount ? formatAmountForCurrencyInput(Math.abs(Number(movement.amount) || 0)) : '',
      date: String(movement.date || '').includes('.')
        ? String(movement.date).split('.').reverse().join('-')
        : String(movement.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
      description: movement.description || '',
      referenceNo: movement.referenceNo || '',
      method: movement.method || (selectedAccount?.type === 'Banka Hesabı' ? 'Banka' : 'Nakit'),
      direction: movement.direction || 'in',
      type: movement.type || (selectedAccount?.type === 'Banka Hesabı' ? 'Banka Girişi' : 'Nakit Girişi'),
    })
    setCashFlowMenuOpen(false)
    setAccountMovementPanelOpen(true)
  }

  function removeAccountMovement(movementId) {
    deleteTreasuryMovement(movementId)
    setPendingDeleteId(null)
    refreshMovements()
  }

  function handleChequePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setChequeForm((current) => ({ ...current, photo: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
  }

  function addChequeDetail(event) {
    event?.preventDefault()
    saveChequeDetail(pendingChequeDirection || 'in')
  }

  function saveChequeDetail(direction) {
    if (!selectedAccount?.id) return
    setPendingChequeDirection(direction)
    if (!chequeForm.partyName) {
      setChequePartyMenuOpen(true)
      return
    }
    const amount = parseCurrencyText(chequeForm.amount)
    if (!amount || amount <= 0) return
    if (editingChequeId) {
      updateAccountById(selectedAccount.id, (account) => {
        const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
        if (editingChequeId === `${account.id}-base-cheque`) {
          const previousAmount = Number(account.chequeBaseAmount ?? account.openingBalance) || 0
          const nextSignedAmount = direction === 'out' ? -amount : amount
          return {
            ...account,
            chequeNo: chequeForm.chequeNo.trim(),
            chequeBank: chequeForm.chequeBank.trim(),
            chequeBranch: chequeForm.chequeBranch.trim(),
            chequeDueDate: chequeForm.chequeDueDate,
            chequeOwner: chequeForm.chequeOwner.trim(),
            chequePhoto: chequeForm.photo || '',
            chequeBaseAmount: nextSignedAmount,
            openingBalance: (Number(account.openingBalance) || 0) - previousAmount + nextSignedAmount,
          }
        }
        const currentEntry = entries.find((entry) => entry.id === editingChequeId)
        const previousAmount = Number(currentEntry?.amount) || 0
        const nextSignedAmount = direction === 'out' ? -amount : amount
        return {
          ...account,
          openingBalance: (Number(account.openingBalance) || 0) - previousAmount + nextSignedAmount,
          chequeEntries: entries.map((entry) => (
            entry.id === editingChequeId
              ? { ...entry, ...chequeForm, amount: nextSignedAmount, direction }
              : entry
          )),
        }
      })
    } else {
      const signedAmount = direction === 'out' ? -amount : amount
      const nextDetail = {
        id: `cheque-${Date.now()}`,
        ...chequeForm,
        amount: signedAmount,
        direction,
      }
      updateAccountById(selectedAccount.id, (account) => ({
        ...account,
        chequeBaseAmount: account.chequeBaseAmount ?? (Number(account.openingBalance) || 0),
        openingBalance: (Number(account.openingBalance) || 0) + signedAmount,
        chequeEntries: [nextDetail, ...(Array.isArray(account.chequeEntries) ? account.chequeEntries : [])],
      }))
      createChequePartyMovement({
        direction,
        amount,
        chequeNo: chequeForm.chequeNo,
        chequeBank: chequeForm.chequeBank,
        chequeDueDate: chequeForm.chequeDueDate,
        partyName: chequeForm.partyName,
        partyType: chequeForm.partyType,
      })
      refreshMovements()
    }
    setChequeForm(emptyChequeDetail())
    setEditingChequeId(null)
    setChequePanelOpen(true)
    setChequePartyMenuOpen(false)
    setChequePartySearch('')
  }

  function createChequePartyMovement(detail) {
    const payload = {
      accountId: '',
      accountName: selectedAccount?.name || '',
      method: 'Çek',
      amount: detail.amount,
      chequeNo: detail.chequeNo,
      chequeBank: detail.chequeBank,
      chequeDueDate: detail.chequeDueDate,
      description: detail.partyName,
    }

    if (detail.partyType === 'Müşteri') {
      const customerPayload = { ...payload, customerName: detail.partyName }
      if (detail.direction === 'out') {
        createCustomerPayment(customerPayload)
      } else {
        createCustomerCollection(customerPayload)
      }
      return
    }

    if (detail.direction === 'out') {
      createExpensePayment({ ...payload, vendorName: detail.partyName })
      return
    }

    addTreasuryMovement({
      ...payload,
      direction: 'in',
      type: 'Çek Girişi',
      vendorName: detail.partyName,
    })
  }

  function selectChequeParty(option) {
    setChequeForm((current) => ({
      ...current,
      partyId: option.profileId,
      partyName: option.label,
      partyType: option.type,
    }))
    setChequePartyMenuOpen(false)
    setChequePartySearch('')
  }

  function closeChequePanel() {
    setChequePanelOpen(false)
    setEditingChequeId(null)
    setChequeSettlementDetailId(null)
    setChequeSettlementMode(null)
    setChequeSettlementForm(emptyChequeSettlement(null, collectionTargetAccounts))
    setSettlementPartyMenuOpen(false)
    setChequeForm(emptyChequeDetail())
    setChequePartyMenuOpen(false)
    setChequePartySearch('')
  }

  function editChequeDetail(detail) {
    setAccountMovementPanelOpen(false)
    setChequeSettlementDetailId(null)
    setChequeSettlementMode(null)
    setChequeSettlementForm(emptyChequeSettlement(null, collectionTargetAccounts))
    setEditingChequeId(detail.id)
    setChequeForm({
      chequeNo: detail.chequeNo || '',
      chequeBank: detail.chequeBank || '',
      chequeBranch: detail.chequeBranch || '',
      chequeDueDate: detail.chequeDueDate || '',
      chequeOwner: detail.chequeOwner || '',
      partyId: detail.partyId || '',
      partyName: detail.partyName || '',
      partyType: detail.partyType || '',
      amount: detail.amount ? formatAmountForCurrencyInput(Math.abs(Number(detail.amount) || 0)) : '',
      photo: detail.photo || '',
    })
    setPendingChequeDirection(detail.direction || (Number(detail.amount) < 0 ? 'out' : 'in'))
    setChequePanelOpen(true)
  }

  function openChequeSettlementPanel(detail, mode) {
    if (mode === 'collection' && detail.collected) return
    if (mode === 'payment' && detail.paid) return
    setAccountMovementPanelOpen(false)
    setEditingChequeId(null)
    setChequeSettlementDetailId(detail.id)
    setChequeSettlementMode(mode)
    setChequeSettlementForm(emptyChequeSettlement(detail, collectionTargetAccounts, mode))
    setChequePanelOpen(true)
    setChequePartyMenuOpen(false)
    setSettlementPartyMenuOpen(mode === 'payment' && !detail.partyName)
    setChequePartySearch('')
  }

  function selectSettlementParty(option) {
    setChequeSettlementForm((current) => ({
      ...current,
      partyId: option.profileId,
      partyName: option.label,
      partyType: option.type,
    }))
    setSettlementPartyMenuOpen(false)
    setChequePartySearch('')
  }

  function markChequeSettledOnAccount(detail, targetAccount, settlement) {
    const settledAt = new Date().toISOString()
    const expensePatch = {
      expenseAmount: settlement.expenseAmount,
      expenseDescription: settlement.expenseDescription,
      expenseCategory: settlement.expenseCategory,
      settlementGrossAmount: settlement.grossAmount,
      settlementNetAmount: settlement.netAmount,
      settledAt,
      settledToAccountId: targetAccount?.id || settlement.paidToParty?.partyId || '',
      settledToAccountName: targetAccount?.name || settlement.paidToParty?.partyName || '',
      paidToPartyId: settlement.paidToParty?.partyId || '',
      paidToPartyName: settlement.paidToParty?.partyName || '',
      paidToPartyType: settlement.paidToParty?.partyType || '',
    }
    updateAccountById(selectedAccount.id, (account) => {
      const amount = Math.abs(Number(detail.amount) || 0)
      if (detail.id === `${account.id}-base-cheque`) {
        return {
          ...account,
          chequeCollected: settlement.mode === 'collection' ? true : account.chequeCollected,
          chequePaid: settlement.mode === 'payment' ? true : account.chequePaid,
          collectedToAccountId: settlement.mode === 'collection' ? targetAccount?.id : account.collectedToAccountId,
          collectedToAccountName: settlement.mode === 'collection' ? targetAccount?.name : account.collectedToAccountName,
          collectedAt: settlement.mode === 'collection' ? settledAt : account.collectedAt,
          paidAt: settlement.mode === 'payment' ? settledAt : account.paidAt,
          chequeExpenseAmount: settlement.expenseAmount,
          chequeExpenseDescription: settlement.expenseDescription,
          chequeExpenseCategory: settlement.expenseCategory,
          openingBalance: settlement.mode === 'collection' || settlement.mode === 'payment'
            ? Math.max(0, (Number(account.openingBalance) || 0) - amount)
            : account.openingBalance,
        }
      }
      const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
      return {
        ...account,
        openingBalance: settlement.mode === 'collection' || settlement.mode === 'payment'
          ? Math.max(0, (Number(account.openingBalance) || 0) - amount)
          : account.openingBalance,
        chequeEntries: entries.map((entry) => (
          entry.id === detail.id
            ? {
              ...entry,
              ...expensePatch,
              collected: settlement.mode === 'collection' ? true : entry.collected,
              paid: settlement.mode === 'payment' ? true : entry.paid,
              collectedAt: settlement.mode === 'collection' ? settledAt : entry.collectedAt,
              paidAt: settlement.mode === 'payment' ? settledAt : entry.paidAt,
              collectedToAccountId: settlement.mode === 'collection' ? targetAccount?.id : entry.collectedToAccountId,
              collectedToAccountName: settlement.mode === 'collection' ? targetAccount?.name : entry.collectedToAccountName,
            }
            : entry
        )),
      }
    })
  }

  function submitChequeSettlement(event) {
    event?.preventDefault()
    const detail = activeChequeSettlementDetail
    const mode = chequeSettlementMode
    if (!detail || !mode) return
    if (mode === 'collection' && detail.collected) return
    if (mode === 'payment' && detail.paid) return

    const grossAmount = parseCurrencyText(chequeSettlementForm.amount)
    if (!grossAmount || grossAmount <= 0) {
      window.alert('Tutar girin.')
      return
    }

    if (mode === 'payment') {
      const { partyName, partyType, partyId } = chequeSettlementForm
      if (!partyName) {
        window.alert('Ödeme yapılacak müşteri veya tedarikçi seçin.')
        setSettlementPartyMenuOpen(true)
        return
      }

      const description = `${partyName} çek ödemesi · ${detail.chequeNo || '-'}`
      const movementBase = {
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        direction: 'out',
        method: 'Çek',
        amount: grossAmount,
        description,
        chequeNo: detail.chequeNo,
        chequeBank: detail.chequeBank,
        chequeDueDate: detail.chequeDueDate,
        chequeOwner: detail.chequeOwner,
      }

      if (partyType === 'Müşteri') {
        addTreasuryMovement({
          ...movementBase,
          type: 'Müşteri Ödemesi',
          customerName: partyName,
        })
      } else {
        addTreasuryMovement({
          ...movementBase,
          type: 'Gider Ödemesi',
          vendorName: partyName,
        })
      }

      markChequeSettledOnAccount(detail, null, {
        mode: 'payment',
        grossAmount,
        netAmount: grossAmount,
        expenseAmount: 0,
        expenseDescription: '',
        expenseCategory: '',
        paidToParty: { partyId, partyName, partyType },
      })
      refreshMovements()
      closeChequePanel()
      return
    }

    const targetAccount = resolveAccountFromOptionLabel(chequeSettlementForm.targetAccountName, collectionTargetAccounts)
    if (!targetAccount) {
      window.alert('Tahsilatın işleneceği nakit kasa / banka hesabı seçin.')
      return
    }

    const expenseAmount = parseCurrencyText(chequeSettlementForm.expenseAmount)
    if (expenseAmount < 0) {
      window.alert('Masraf tutarı geçersiz.')
      return
    }
    if (expenseAmount > grossAmount) {
      window.alert('Masraf tutarı, çek tutarından büyük olamaz.')
      return
    }

    const netAmount = grossAmount - expenseAmount
    const method = targetAccount.type === 'Banka Hesabı' ? 'Banka' : 'Nakit'
    const partyLabel = detail.partyName || detail.chequeOwner || 'Çek'
    const description = `${partyLabel} tahsilatı · ${detail.chequeNo || '-'}`

    if (detail.partyType === 'Müşteri' && detail.partyName) {
      createCustomerCollection({
        accountId: targetAccount.id,
        accountName: targetAccount.name,
        method,
        amount: netAmount,
        customerName: detail.partyName,
        description,
        chequeNo: detail.chequeNo,
        chequeBank: detail.chequeBank,
        chequeDueDate: detail.chequeDueDate,
        chequeOwner: detail.chequeOwner,
      })
    } else {
      addTreasuryMovement({
        accountId: targetAccount.id,
        accountName: targetAccount.name,
        direction: 'in',
        type: 'Çek Tahsilatı',
        method,
        amount: netAmount,
        description,
        chequeNo: detail.chequeNo,
        chequeBank: detail.chequeBank,
        chequeDueDate: detail.chequeDueDate,
        vendorName: detail.partyType === 'Tedarikçi' ? detail.partyName : '',
        customerName: detail.partyType === 'Müşteri' ? detail.partyName : '',
      })
    }

    if (expenseAmount > 0) {
      createExpensePayment({
        accountId: targetAccount.id,
        accountName: targetAccount.name,
        method,
        amount: expenseAmount,
        category: chequeSettlementForm.expenseCategory || 'Genel Gider',
        description: chequeSettlementForm.expenseDescription.trim()
          || `${partyLabel} · ${detail.chequeNo || '-'} masrafı`,
        vendorName: detail.partyType === 'Tedarikçi' ? detail.partyName : '',
      })
    }

    markChequeSettledOnAccount(detail, targetAccount, {
      mode: 'collection',
      grossAmount,
      netAmount,
      expenseAmount,
      expenseDescription: chequeSettlementForm.expenseDescription.trim(),
      expenseCategory: chequeSettlementForm.expenseCategory || 'Genel Gider',
    })
    refreshMovements()
    closeChequePanel()
  }

  function removeChequeDetail(detail) {
    if (!selectedAccount?.id) return
    updateAccountById(selectedAccount.id, (account) => {
      const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
      if (detail.id === `${account.id}-base-cheque`) {
        const baseAmount = Number(account.chequeBaseAmount ?? account.openingBalance) || 0
        return {
          ...account,
          openingBalance: Math.max(0, (Number(account.openingBalance) || 0) - baseAmount),
          chequeBaseAmount: 0,
          chequeNo: '',
          chequeBank: '',
          chequeBranch: '',
          chequeDueDate: '',
          chequeOwner: '',
          chequePhoto: '',
        }
      }
      return {
        ...account,
        openingBalance: Math.max(0, (Number(account.openingBalance) || 0) - (Number(detail.amount) || 0)),
        chequeEntries: entries.filter((entry) => entry.id !== detail.id),
      }
    })
    setPendingDeleteId(null)
  }

  function createChequeMovement(detail, direction) {
    if (!selectedAccount?.id) return
    addTreasuryMovement({
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      direction,
      type: direction === 'in' ? 'Çek Tahsilatı' : 'Çek Ödemesi',
      method: 'Çek',
      amount: Math.abs(Number(detail.amount) || 0),
      chequeNo: detail.chequeNo,
      chequeBank: detail.chequeBank,
      chequeDueDate: detail.chequeDueDate,
      customerName: detail.partyType === 'Müşteri' ? detail.partyName : '',
      vendorName: detail.partyType === 'Tedarikçi' ? detail.partyName : '',
      description: detail.partyName || `${detail.chequeNo || selectedAccount.name} ${direction === 'in' ? 'tahsilatı' : 'ödemesi'}`,
    })
    refreshMovements()
  }

  function removeLatestChequeDetail() {
    if (!selectedAccount?.id) return
    const details = getChequeDetails(selectedAccount)
    if (!details.length) return
    const latest = details[details.length - 1]
    updateAccountById(selectedAccount.id, (account) => {
      const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
      if (entries.some((entry) => entry.id === latest.id)) {
        return {
          ...account,
          openingBalance: Math.max(0, (Number(account.openingBalance) || 0) - (Number(latest.amount) || 0)),
          chequeEntries: entries.filter((entry) => entry.id !== latest.id),
        }
      }
      return {
        ...account,
        openingBalance: 0,
        chequeBaseAmount: 0,
        chequeNo: '',
        chequeBank: '',
        chequeBranch: '',
        chequeDueDate: '',
        chequeOwner: '',
      }
    })
  }

  function addAccount(event) {
    event.preventDefault()
    const name = accountForm.name.trim()
    if (!name) {
      window.alert('Kasa veya banka adı girin.')
      return
    }

    const nextAccount = {
      id: `account-${Date.now()}`,
      name,
      type: accountForm.type,
      currency: 'TRY',
      openingBalance: Number(accountForm.openingBalance) || 0,
      chequeBaseAmount: accountForm.type === 'Çek Kasası' ? Number(accountForm.openingBalance) || 0 : 0,
      iban: accountForm.iban.trim(),
      chequeNo: accountForm.chequeNo.trim(),
      chequeBank: accountForm.chequeBank.trim(),
      chequeBranch: accountForm.chequeBranch.trim(),
      chequeDueDate: accountForm.chequeDueDate,
      chequeOwner: accountForm.chequeOwner.trim(),
      color: accountForm.type === 'Banka Hesabı'
        ? 'text-blue-300'
        : accountForm.type === 'Çek Kasası'
          ? 'text-purple-300'
          : 'text-emerald-300',
    }

    const nextAccounts = [...accounts, nextAccount]
    setAccounts(nextAccounts)
    saveTreasuryAccounts(nextAccounts)
    selectAccount(nextAccount.id)
    setAccountForm(emptyAccount())
    setAccountPanelOpen(false)
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
      amount,
      accountId: collectionForm.accountId || selectedAccount?.id,
      description: collectionForm.description || `${collectionForm.customerName} tahsilatı`,
    })
    refreshMovements()
    setCollectionForm(emptyCollection(accounts))
    closeModal()
  }

  function submitExpense(event) {
    event.preventDefault()
    const amount = Number(expenseForm.amount)
    if (!amount || amount <= 0) {
      window.alert('Ödeme tutarı girin.')
      return
    }

    createExpensePayment({
      ...expenseForm,
      amount,
      accountId: expenseForm.accountId || selectedAccount?.id,
      description: expenseForm.description || expenseForm.category,
    })
    refreshMovements()
    setExpenseForm(emptyExpense(accounts))
    closeModal()
  }

  function handleRestoreArchiveEntry(entry) {
    if (entry.entityType === 'treasuryAccount' || entry.undo?.type === 'treasury.restoreAccount') {
      const restored = restoreTreasuryAccount(entry.snapshot)
      if (restored) {
        setAccounts(getTreasuryAccounts())
        refreshMovements()
      }
      return restored
    }
    const restored = restoreTreasuryMovement(entry.snapshot)
    if (restored) refreshMovements()
    return restored
  }

  if (accountId) {
    if (!detailAccount) {
      return (
        <div className="glass-inset space-y-4 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-gray-400">Hesap bulunamadı.</p>
          <Link to={CASH_BASE_PATH} className="inline-flex rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-300">
            Kasa listesine dön
          </Link>
        </div>
      )
    }

    const isChequeAccount = detailAccount.type === 'Çek Kasası'
    const formattedMovementRows = detailMovementRows.map((movement) => ({
      ...movement,
      displayDate: formatMovementDateLong(movement.date),
      relatedAccount: resolveRelatedAccountLabel(movement),
      description: movement.description ? titleCaseText(movement.description) : '',
    }))
    const detailChequeRows = detailChequeListRows.map((row) => ({
      ...row,
      transactionAt: resolveChequeTransactionAt(row),
    }))

    return (
      <div className="space-y-5">
        <CashAccountDetailLayout
          account={detailAccount}
          balance={formatTreasuryCurrency(detailAccount.balance)}
          breadcrumbLabel={isChequeAccount ? 'Çek Kasası' : 'Kasa Hesabı'}
          onEdit={openEditAccountPanel}
          balanceFooter={(accountMovementPanelOpen || transferPanelOpen || balanceFixPanelOpen) ? false : undefined}
          table={isChequeAccount ? (
            <>
              <div className="glass-inset mb-3 rounded-2xl p-3">
                <SearchInput
                  className="font-semibold"
                  value={chequeFilters.search}
                  onChange={(event) => setChequeFilters({ search: event.target.value })}
                  placeholder="Çek ara..."
                />
              </div>
              <CashChequeHistoryTable
                rows={detailChequeRows}
                gridClass={CHEQUE_TABLE_GRID}
                onPhotoPreview={setPhotoPreview}
                onSettlement={openChequeSettlementPanel}
                onEdit={editChequeDetail}
                onRemove={removeChequeDetail}
                pendingDeleteId={pendingDeleteId}
                onPendingDelete={setPendingDeleteId}
                onCancelDelete={() => setPendingDeleteId(null)}
                formatTransactionDate={formatTransactionDate}
                formatTransactionTime={formatTransactionTime}
                formatDateTr={formatDateTr}
              />
            </>
          ) : (
            <>
              <div className="glass-inset mb-3 rounded-2xl p-3">
                <SearchInput
                  className="font-semibold"
                  value={accountMovementSearch}
                  onChange={(event) => setAccountMovementSearch(event.target.value)}
                  placeholder="Hareket ara..."
                />
              </div>
              <CashMovementHistoryTable
                rows={formattedMovementRows}
                accountName={detailAccount.name}
                onEdit={editAccountMovement}
                onRemove={removeAccountMovement}
                pendingDeleteId={pendingDeleteId}
                onPendingDelete={setPendingDeleteId}
                onCancelDelete={() => setPendingDeleteId(null)}
              />
            </>
          )}
          sidebar={(
            <CashDetailSidebar
              account={detailAccount}
              isChequeAccount={isChequeAccount}
              transferPanelOpen={transferPanelOpen}
              onOpenTransfer={openTransferPanel}
              cashFlowMenuOpen={cashFlowMenuOpen}
              onToggleCashFlow={() => {
                setOtherOpsMenuOpen(false)
                setCashFlowMenuOpen((current) => !current)
              }}
              onCloseCashFlow={() => setCashFlowMenuOpen(false)}
              otherOpsMenuOpen={otherOpsMenuOpen}
              onToggleOtherOps={() => {
                setCashFlowMenuOpen(false)
                setOtherOpsMenuOpen((current) => !current)
              }}
              onCloseOtherOps={() => setOtherOpsMenuOpen(false)}
              onOpenMovement={openMovementPanel}
              onOpenBalanceFix={openBalanceFixPanel}
              onRequestArchive={requestArchiveAccount}
              onRequestDelete={requestDeleteAccount}
              accountOpsConfirm={accountOpsConfirm}
              onConfirmAccountOps={confirmAccountOps}
              onCancelAccountOps={() => setAccountOpsConfirm(null)}
              balanceFixPanelOpen={balanceFixPanelOpen}
              balanceFixForm={balanceFixForm}
              onBalanceFixFormChange={setBalanceFixForm}
              onSubmitBalanceFix={submitBalanceFix}
              onCloseBalanceFix={() => setBalanceFixPanelOpen(false)}
              onOpenChequeEntry={openChequeEntryPanel}
              transferForm={transferForm}
              onTransferFormChange={setTransferForm}
              onSubmitTransfer={submitTransfer}
              onCloseTransfer={() => setTransferPanelOpen(false)}
              parseCurrencyText={parseCurrencyText}
              transferTargetAccountOptions={transferTargetAccountOptions}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              editAccountPanelOpen={editAccountPanelOpen}
              editAccountForm={editAccountForm}
              onEditAccountFormChange={setEditAccountForm}
              onSaveAccountEdit={saveAccountEdit}
              onCloseEditAccount={() => setEditAccountPanelOpen(false)}
              accountMovementPanelOpen={accountMovementPanelOpen}
              accountMovementForm={accountMovementForm}
              onAccountMovementFormChange={setAccountMovementForm}
              onSubmitAccountMovement={submitAccountMovement}
              onCloseAccountMovement={() => { setAccountMovementPanelOpen(false); setTransferPanelOpen(false) }}
              editingMovementId={editingMovementId}
              DateTextPicker={DateTextPicker}
              CurrencyTextInput={CurrencyTextInput}
              chequePanelOpen={chequePanelOpen}
              chequeSettlementDetailId={chequeSettlementDetailId}
              activeChequeSettlementDetail={activeChequeSettlementDetail}
              chequeSettlementMode={chequeSettlementMode}
              chequeSettlementForm={chequeSettlementForm}
              onChequeSettlementFormChange={setChequeSettlementForm}
              onSubmitChequeSettlement={submitChequeSettlement}
              onCloseChequePanel={closeChequePanel}
              onEditChequeDetail={editChequeDetail}
              settlementPartyMenuOpen={settlementPartyMenuOpen}
              onToggleSettlementPartyMenu={() => setSettlementPartyMenuOpen(true)}
              chequePartySearch={chequePartySearch}
              onChequePartySearchChange={setChequePartySearch}
              chequePartyOptions={chequePartyOptions}
              onSelectSettlementParty={selectSettlementParty}
              collectionTargetAccountOptions={collectionTargetAccountOptions}
              EXPENSE_CATEGORY_OPTIONS={EXPENSE_CATEGORY_OPTIONS}
              chequeForm={chequeForm}
              onChequeFormChange={setChequeForm}
              onChequePhotoChange={handleChequePhotoChange}
              onSaveChequeDetail={saveChequeDetail}
              editingChequeId={editingChequeId}
              chequePartyMenuOpen={chequePartyMenuOpen}
              onToggleChequePartyMenu={() => setChequePartyMenuOpen(true)}
              onSelectChequeParty={selectChequeParty}
              onPhotoPreview={setPhotoPreview}
              bankOptions={bankOptions}
              onBankOptionsChange={updateBankOptions}
              balance={formatTreasuryCurrency(detailAccount.balance)}
            />
          )}
        />

        {modal === 'collection' && (
          <Modal title="Tahsilat" onClose={closeModal}>
            <form onSubmit={submitCollection} className="space-y-3">
              <select value={collectionForm.customerName} onChange={(e) => setCollectionForm((c) => ({ ...c, customerName: e.target.value }))} className="form-input text-sm">
                {customers.list.map((customer) => {
                  const display = getCustomerDisplay(customer)
                  return <option key={customer.company} value={customer.company}>{display.brandShortName}</option>
                })}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={collectionForm.accountId} onChange={(e) => setCollectionForm((c) => ({ ...c, accountId: e.target.value }))} className="form-input text-sm">
                  {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
                <select value={collectionForm.method} onChange={(e) => setCollectionForm((c) => ({ ...c, method: e.target.value }))} className="form-input text-sm">
                  <option>Nakit</option>
                  <option>Banka</option>
                  <option>Çek</option>
                </select>
              </div>
              <input value={collectionForm.amount} onChange={(e) => setCollectionForm((c) => ({ ...c, amount: e.target.value }))} type="number" placeholder="Tutar" className="form-input text-sm" />
              <input value={collectionForm.description} onChange={(e) => setCollectionForm((c) => ({ ...c, description: e.target.value }))} placeholder="Açıklama" className="form-input text-sm" />
              <button type="submit" className={`${BTN_SUCCESS} w-full py-2.5 text-sm`}>Kaydet</button>
            </form>
          </Modal>
        )}

        {modal === 'expense' && (
          <Modal title="Ödeme" onClose={closeModal}>
            <form onSubmit={submitExpense} className="space-y-3">
              <input value={expenseForm.vendorName} onChange={(e) => setExpenseForm((c) => ({ ...c, vendorName: e.target.value }))} placeholder="Tedarikçi / gider adı" className="form-input text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={expenseForm.accountId} onChange={(e) => setExpenseForm((c) => ({ ...c, accountId: e.target.value }))} className="form-input text-sm">
                  {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm((c) => ({ ...c, category: e.target.value }))} className="form-input text-sm">
                  <option>Genel Gider</option>
                  <option>Malzeme Ödemesi</option>
                  <option>Kira</option>
                  <option>Personel</option>
                  <option>Nakliye</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={expenseForm.method} onChange={(e) => setExpenseForm((c) => ({ ...c, method: e.target.value }))} className="form-input text-sm">
                  <option>Banka</option>
                  <option>Nakit</option>
                  <option>Kredi Kartı</option>
                </select>
                <input value={expenseForm.amount} onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))} type="number" placeholder="Tutar" className="form-input text-sm" />
              </div>
              <input value={expenseForm.description} onChange={(e) => setExpenseForm((c) => ({ ...c, description: e.target.value }))} placeholder="Açıklama (isteğe bağlı)" className="form-input text-sm" />
              <button type="submit" className={`${BTN_SUCCESS} w-full py-2.5 text-sm`}>Kaydet</button>
            </form>
          </Modal>
        )}

        <ActivityArchivePanel
          title="Kasa Arşiv ve İşlem Geçmişi"
          modules={['treasury']}
          onRestore={handleRestoreArchiveEntry}
          emptyMessage="Henüz kasa arşiv veya silme kaydı yok."
        />

        {photoPreview && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" onClick={() => setPhotoPreview(null)}>
            <div className="relative max-h-[88vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={() => setPhotoPreview(null)} className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white">
                <X className="h-5 w-5" />
              </button>
              <img src={photoPreview} alt="" className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-card" />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Kasa"
        actions={(
          <button
            type="button"
            onClick={() => openAccountPanel('Nakit Kasa')}
            className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" /> Kasa Oluştur
          </button>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Nakit', value: formatTreasuryCurrency(totals.cashBalance), icon: Banknote, tone: 'text-emerald-300', valueTone: totals.cashBalance < 0 ? 'red' : 'emerald' },
          { title: 'Banka', value: formatTreasuryCurrency(totals.bankBalance), icon: Landmark, tone: 'text-blue-300', valueTone: totals.bankBalance < 0 ? 'red' : 'emerald' },
          { title: 'Çek Kasası', value: formatTreasuryCurrency(totals.chequeBalance), icon: Banknote, tone: 'text-purple-300', valueTone: totals.chequeBalance < 0 ? 'red' : 'emerald' },
          { title: 'Toplam Varlık Bakiyesi', value: formatTreasuryCurrency(totals.total), icon: Banknote, tone: 'text-cyan-300', valueTone: totals.total < 0 ? 'red' : 'emerald' },
        ]}
      />

      {accountPanelOpen ? (
        <div className="glass-inset rounded-2xl p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[var(--ink)]">
                {accountForm.type === 'Çek Kasası' ? 'Çek Kasası Oluştur' : 'Kasa Oluştur'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAccountPanelOpen(false)}
              className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[rgba(248,250,252,1)] hover:text-[var(--ink)]"
              title="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={addAccount} className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_minmax(160px,0.7fr)_auto]">
              <input value={accountForm.name} onChange={(e) => setAccountForm((c) => ({ ...c, name: e.target.value }))} placeholder="Kasa adı" className="form-input text-sm" />
              <EditableDropdownPill
                value={accountForm.type}
                onChange={(value) => setAccountForm((current) => ({ ...current, type: value || 'Nakit Kasa' }))}
                options={accountTypeOptions}
                openKey="cash-account-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                placeholder="Kasa türü seçin"
                includePlaceholderOption={false}
                editable={false}
                buttonClassName="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[rgba(140,145,165,0.22)] bg-white px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[rgba(248,250,252,1)]"
              />
              <input value={accountForm.openingBalance} onChange={(e) => setAccountForm((c) => ({ ...c, openingBalance: e.target.value }))} type="number" placeholder="Açılış bakiyesi" className="form-input text-sm" />
              <button type="submit" className={`${BTN_PRIMARY} justify-center px-4 py-2.5 text-sm`}>
                Oluştur
              </button>
            </div>
            {accountForm.type === 'Banka Hesabı' && (
              <input value={accountForm.iban} onChange={(e) => setAccountForm((c) => ({ ...c, iban: e.target.value }))} placeholder="IBAN" className="form-input text-sm" />
            )}
            {accountForm.type === 'Çek Kasası' && (
              <div className="glass-inset rounded-xl p-3">
                <div className="mb-3">
                  <p className="text-[12px] font-black uppercase tracking-wider text-[var(--muted)]">Aktif Çek Bilgileri</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="form-label">Banka</label>
                    <EditableDropdownPill
                      value={accountForm.chequeBank}
                      onChange={(value) => setAccountForm((current) => ({ ...current, chequeBank: value }))}
                      options={bankOptions}
                      onOptionsChange={updateBankOptions}
                      openKey="cheque-bank"
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      placeholder="Banka seçin"
                      buttonClassName="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[rgba(140,145,165,0.22)] bg-white px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[rgba(248,250,252,1)]"
                      searchable
                      searchPlaceholder="Banka ara..."
                      menuMaxHeight="max-h-72"
                    />
                  </div>
                  <div>
                    <label className="form-label">Çek No</label>
                    <input value={accountForm.chequeNo} onChange={(e) => setAccountForm((c) => ({ ...c, chequeNo: e.target.value }))} className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="form-label">Şube</label>
                    <input value={accountForm.chequeBranch} onChange={(e) => setAccountForm((c) => ({ ...c, chequeBranch: e.target.value }))} className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="form-label">Vade Tarihi</label>
                    <input value={accountForm.chequeDueDate} onChange={(e) => setAccountForm((c) => ({ ...c, chequeDueDate: e.target.value }))} type="date" className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="form-label">Keşideci</label>
                    <input value={accountForm.chequeOwner} onChange={(e) => setAccountForm((c) => ({ ...c, chequeOwner: e.target.value }))} className="form-input text-sm" />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : null}

      <section className="card rounded-2xl p-4">
        <div className="grid gap-2">
          {enrichedAccounts.map((account) => {
            const Icon = account.type === 'Banka Hesabı' ? Landmark : Banknote
            return (
              <div key={account.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate(`${CASH_BASE_PATH}/${account.id}`)}
                  className="glass-inset glass-inset-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                >
                  <span className={`glass-inset rounded-lg p-1.5 ${account.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{account.name}</p>
                    <p className="text-[13px] font-semibold text-gray-500">{account.type}</p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <p className={`mr-2 text-xs font-black ${Number(account.balance) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{formatTreasuryCurrency(account.balance)}</p>
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className={`${DUZENLEME_KALEMI_BUTTON_CLASS} inline-flex h-8 w-8 items-center justify-center rounded-lg p-0`}
                      title="Düzenle"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <DeleteTrashButton
                      pending={pendingDeleteId === `account-${account.id}`}
                      onClick={() => setPendingDeleteId(`account-${account.id}`)}
                      onConfirm={() => removeAccount(account.id)}
                      onCancel={() => setPendingDeleteId(null)}
                      title="Silinsin mi?"
                      description={`${account.name} kaldırılacak.`}
                      buttonClassName={`${TEKLIFLER_COP_KUTUSU_BUTTON_CLASS} inline-flex h-8 w-8 items-center justify-center rounded-lg p-0`}
                      wrapperClassName="relative inline-flex"
                      popoverClassName="absolute right-10 top-1/2 z-[90] w-72 -translate-y-1/2"
                    />
                  </div>
                </button>
              </div>
            )
          })}

        </div>
      </section>

      {modal === 'collection' && (
        <Modal title="Tahsilat" onClose={closeModal}>
          <form onSubmit={submitCollection} className="space-y-3">
            <select value={collectionForm.customerName} onChange={(e) => setCollectionForm((c) => ({ ...c, customerName: e.target.value }))} className="form-input text-sm">
              {customers.list.map((customer) => {
                const display = getCustomerDisplay(customer)
                return <option key={customer.company} value={customer.company}>{display.brandShortName}</option>
              })}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={collectionForm.accountId} onChange={(e) => setCollectionForm((c) => ({ ...c, accountId: e.target.value }))} className="form-input text-sm">
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
              <select value={collectionForm.method} onChange={(e) => setCollectionForm((c) => ({ ...c, method: e.target.value }))} className="form-input text-sm">
                <option>Nakit</option>
                <option>Banka</option>
                <option>Çek</option>
              </select>
            </div>
            <input value={collectionForm.amount} onChange={(e) => setCollectionForm((c) => ({ ...c, amount: e.target.value }))} type="number" placeholder="Tutar" className="form-input text-sm" />
            {collectionForm.method === 'Çek' && (
              <div className="grid grid-cols-2 gap-2">
                <input value={collectionForm.chequeNo} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeNo: e.target.value }))} placeholder="Çek no" className="form-input text-sm" />
                <input value={collectionForm.chequeBank} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeBank: e.target.value }))} placeholder="Banka" className="form-input text-sm" />
                <input value={collectionForm.chequeDueDate} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeDueDate: e.target.value }))} type="date" className="form-input text-sm" />
                <input value={collectionForm.chequeOwner} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeOwner: e.target.value }))} placeholder="Keşideci" className="form-input text-sm" />
              </div>
            )}
            <input value={collectionForm.description} onChange={(e) => setCollectionForm((c) => ({ ...c, description: e.target.value }))} placeholder="Açıklama (isteğe bağlı)" className="form-input text-sm" />
            <button type="submit" className={`${BTN_SUCCESS} w-full py-2.5 text-sm`}>Kaydet</button>
          </form>
        </Modal>
      )}

      {modal === 'expense' && (
        <Modal title="Ödeme" onClose={closeModal}>
          <form onSubmit={submitExpense} className="space-y-3">
            <input value={expenseForm.vendorName} onChange={(e) => setExpenseForm((c) => ({ ...c, vendorName: e.target.value }))} placeholder="Tedarikçi / gider adı" className="form-input text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={expenseForm.accountId} onChange={(e) => setExpenseForm((c) => ({ ...c, accountId: e.target.value }))} className="form-input text-sm">
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
              <select value={expenseForm.category} onChange={(e) => setExpenseForm((c) => ({ ...c, category: e.target.value }))} className="form-input text-sm">
                <option>Genel Gider</option>
                <option>Malzeme Ödemesi</option>
                <option>Kira</option>
                <option>Personel</option>
                <option>Nakliye</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={expenseForm.method} onChange={(e) => setExpenseForm((c) => ({ ...c, method: e.target.value }))} className="form-input text-sm">
                <option>Banka</option>
                <option>Nakit</option>
                <option>Kredi Kartı</option>
              </select>
              <input value={expenseForm.amount} onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))} type="number" placeholder="Tutar" className="form-input text-sm" />
            </div>
            <input value={expenseForm.description} onChange={(e) => setExpenseForm((c) => ({ ...c, description: e.target.value }))} placeholder="Açıklama (isteğe bağlı)" className="form-input text-sm" />
            <button type="submit" className={`${BTN_SUCCESS} w-full py-2.5 text-sm`}>Kaydet</button>
          </form>
        </Modal>
      )}

      <ActivityArchivePanel
        title="Kasa Arşiv ve İşlem Geçmişi"
        modules={['treasury']}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz kasa arşiv veya silme kaydı yok."
      />

      {photoPreview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4" onClick={() => setPhotoPreview(null)}>
          <div className="relative max-h-[88vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPhotoPreview(null)}
              className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
              title="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={photoPreview} alt="" className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-card" />
          </div>
        </div>
      )}
    </AppPageShell>
  )
}
