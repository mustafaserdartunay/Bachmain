const ACCOUNTS_KEY = 'erlenbox-treasury-accounts'
const MOVEMENTS_KEY = 'erlenbox-treasury-movements'

export const defaultTreasuryAccounts = [
  {
    id: 'cash-main',
    name: 'Merkez Nakit Kasa',
    type: 'Nakit Kasa',
    currency: 'TRY',
    openingBalance: 185000,
    color: 'text-emerald-300',
  },
  {
    id: 'bank-is',
    name: 'İş Bankası Ticari Hesap',
    type: 'Banka Hesabı',
    currency: 'TRY',
    openingBalance: 420000,
    iban: 'TR00 0000 0000 0000 0000 0000 01',
    color: 'text-blue-300',
  },
  {
    id: 'bank-garanti',
    name: 'Garanti BBVA Tahsilat Hesabı',
    type: 'Banka Hesabı',
    currency: 'TRY',
    openingBalance: 268000,
    iban: 'TR00 0000 0000 0000 0000 0000 02',
    color: 'text-purple-300',
  },
]

export const defaultTreasuryMovements = [
  {
    id: 'TRX-SEED-001',
    accountId: 'cash-main',
    accountName: 'Merkez Nakit Kasa',
    direction: 'in',
    type: 'Müşteri Tahsilatı',
    customerName: 'ABC Ambalaj Ltd.',
    method: 'Nakit',
    amount: 45000,
    date: '03.06.2026 10:15',
    description: 'Sipariş kapora tahsilatı',
    status: 'İşlendi',
  },
  {
    id: 'TRX-SEED-002',
    accountId: 'bank-is',
    accountName: 'İş Bankası Ticari Hesap',
    direction: 'out',
    type: 'Gider Ödemesi',
    vendorName: 'Karton Tedarik A.Ş.',
    method: 'Banka',
    amount: 28500,
    date: '03.06.2026 12:40',
    description: 'Hammadde avans ödemesi',
    status: 'İşlendi',
  },
]

export function formatTreasuryCurrency(value) {
  const amount = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
  return `${amount}₺`
}

export function getCustomerStatementAmountSign(row = {}) {
  if (row.isOpening) return ''
  if (row.isInvoice || row.type === 'Satış Faturası') return '+'
  return '-'
}

export function formatCustomerStatementAmount(row, formatter = formatTreasuryCurrency) {
  return `${getCustomerStatementAmountSign(row)}${formatter(Number(row.amount) || 0)}`
}

export function getCustomerStatementAmountTone(row = {}) {
  if (row.isOpening) return 'text-orange-300'
  if (row.isInvoice || row.type === 'Satış Faturası') return 'text-emerald-300/90'
  return 'text-blue-300'
}

export function todayForTreasury() {
  return new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return Array.isArray(fallback) ? Array.isArray(parsed) ? parsed : fallback : parsed
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('erlenbox:treasury-updated'))
}

export function getTreasuryAccounts() {
  return readJson(ACCOUNTS_KEY, defaultTreasuryAccounts)
}

export function saveTreasuryAccounts(accounts) {
  writeJson(ACCOUNTS_KEY, accounts)
}

export function getTreasuryMovements() {
  return readJson(MOVEMENTS_KEY, defaultTreasuryMovements)
}

export function saveTreasuryMovements(movements) {
  writeJson(MOVEMENTS_KEY, movements)
}

export function createTreasuryId(prefix = 'TRX') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function calculateAccountBalance(account, movements = getTreasuryMovements()) {
  const movementTotal = movements
    .filter((movement) => movement.accountId === account.id)
    .reduce((sum, movement) => {
      const amount = Number(movement.amount) || 0
      return movement.direction === 'out' ? sum - amount : sum + amount
    }, 0)

  return (Number(account.openingBalance) || 0) + movementTotal
}

export function addTreasuryMovement(movement) {
  const accounts = getTreasuryAccounts()
  const account = accounts.find((item) => item.id === movement.accountId) || accounts[0]
  const nextMovement = {
    id: movement.id || createTreasuryId(),
    accountId: account?.id || movement.accountId,
    accountName: account?.name || movement.accountName || 'Kasa',
    date: movement.date || todayForTreasury(),
    status: movement.status || 'İşlendi',
    ...movement,
    amount: Number(movement.amount) || 0,
  }

  const nextMovements = [nextMovement, ...getTreasuryMovements()]
  saveTreasuryMovements(nextMovements)
  return nextMovement
}

export function createCustomerCollection(collection) {
  return addTreasuryMovement({
    direction: 'in',
    type: 'Müşteri Tahsilatı',
    description: collection.description || `${collection.customerName} tahsilatı`,
    ...collection,
  })
}

export function createExpensePayment(payment) {
  return addTreasuryMovement({
    direction: 'out',
    type: 'Gider Ödemesi',
    description: payment.description || `${payment.vendorName || 'Gider'} ödemesi`,
    ...payment,
  })
}

export function createCustomerPayment(payment) {
  return addTreasuryMovement({
    direction: 'out',
    type: 'Müşteri Ödemesi',
    description: payment.description || `${payment.customerName} ödemesi`,
    ...payment,
  })
}

export function deleteTreasuryMovement(id) {
  const nextMovements = getTreasuryMovements().filter((movement) => movement.id !== id)
  saveTreasuryMovements(nextMovements)
  return nextMovements
}

export function getTreasuryMovementById(id) {
  return getTreasuryMovements().find((movement) => movement.id === id) || null
}

export function updateTreasuryMovement(id, patch) {
  const accounts = getTreasuryAccounts()
  const movements = getTreasuryMovements()
  const index = movements.findIndex((movement) => movement.id === id)
  if (index === -1) return null

  const current = movements[index]
  const account = accounts.find((item) => item.id === patch.accountId)
    || accounts.find((item) => item.name === patch.accountName)
    || accounts.find((item) => item.id === current.accountId)

  const updated = {
    ...current,
    ...patch,
    amount: patch.amount != null ? Number(patch.amount) : current.amount,
    accountId: account?.id || patch.accountId || current.accountId,
    accountName: patch.accountName || account?.name || current.accountName,
  }

  const nextMovements = [...movements]
  nextMovements[index] = updated
  saveTreasuryMovements(nextMovements)
  return updated
}

export function syncCustomerOpeningBalanceMovement(customerId, customerName, amount, date, description) {
  const movementId = `OPENING-${customerId}`
  const currentMovements = getTreasuryMovements().filter((movement) => movement.id !== movementId)
  const normalizedAmount = Number(amount) || 0

  if (normalizedAmount <= 0) {
    saveTreasuryMovements(currentMovements)
    return null
  }

  const account = getTreasuryAccounts()[0]
  const nextMovement = {
    id: movementId,
    accountId: account?.id || 'cash-main',
    accountName: account?.name || 'Merkez Nakit Kasa',
    direction: 'in',
    type: 'Açılış Bakiyesi',
    customerName,
    method: 'Açılış',
    amount: normalizedAmount,
    date: date || todayForTreasury(),
    description: description || `${customerName} açılış bakiyesi`,
    status: 'İşlendi',
  }

  saveTreasuryMovements([nextMovement, ...currentMovements])
  return nextMovement
}

export function getCustomerCollections(customerName, movements = getTreasuryMovements()) {
  return movements.filter((movement) => (
    movement.type === 'Müşteri Tahsilatı'
    && movement.customerName === customerName
  ))
}

export function getCustomerPayments(customerName, movements = getTreasuryMovements()) {
  return movements.filter((movement) => (
    movement.type === 'Müşteri Ödemesi'
    && movement.customerName === customerName
  ))
}

export function getCustomerSalesInvoices(customerName, movements = getTreasuryMovements()) {
  return movements.filter((movement) => (
    movement.type === 'Satış Faturası'
    && movement.customerName === customerName
  ))
}

export function createCustomerSalesInvoice({
  customerName,
  customerId,
  amount,
  docNo,
  date,
  description,
  dueDate,
}) {
  const normalizedDocNo = String(docNo || '').trim()
  if (!normalizedDocNo) return null

  const movementId = `INV-${normalizedDocNo}`
  const existing = getTreasuryMovements().find((movement) => movement.id === movementId)
  if (existing) return existing

  return addTreasuryMovement({
    id: movementId,
    direction: 'ledger',
    type: 'Satış Faturası',
    customerName,
    customerId: customerId || '',
    method: 'Fatura',
    accountId: '',
    accountName: 'Cari',
    amount: Number(amount) || 0,
    date: date || todayForTreasury(),
    description: description || `Satış faturası ${normalizedDocNo}`,
    dueDate: dueDate || '',
    docNo: normalizedDocNo,
    status: 'İşlendi',
  })
}

export function getCustomerLedgerBalance(customer, movements = getTreasuryMovements()) {
  const customerName = customer?.company || customer?.companyTitle || ''
  if (!customerName) return 0

  const openingBalance = Number(customer.balance) || 0
  const invoiceTotal = getCustomerSalesInvoices(customerName, movements)
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0)
  const collectedTotal = getCustomerCollections(customerName, movements)
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0)
  const paidTotal = getCustomerPayments(customerName, movements)
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0)

  return openingBalance + invoiceTotal - collectedTotal - paidTotal
}

export function getCustomerLiveBalance(customer, movements = getTreasuryMovements()) {
  return getCustomerLedgerBalance(customer, movements)
}

export function getCustomerBalanceColor(balance) {
  if (balance > 0) return 'bg-emerald-500'
  if (balance < 0) return 'bg-red-500'
  return 'bg-orange-500'
}
