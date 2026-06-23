import { appendActivityEntry } from './activityArchiveStore'

const ACCOUNTS_KEY = 'erlenbox-treasury-accounts'
const MOVEMENTS_KEY = 'erlenbox-treasury-movements'

export const defaultTreasuryAccounts = []
export const defaultTreasuryMovements = []

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

const ACCOUNT_TYPE_BY_METHOD = {
  Nakit: 'Nakit Kasa',
  Banka: 'Banka Hesabı',
  Çek: 'Çek Kasası',
}

export function resolveTreasuryAccountForMovement(method, accountName, accounts = getTreasuryAccounts()) {
  const label = String(accountName || '').trim()
  if (label) {
    const exact = accounts.find((account) => account.name === label)
    if (exact) return exact
  }

  const targetType = ACCOUNT_TYPE_BY_METHOD[method] || ''
  const typedAccounts = targetType
    ? accounts.filter((account) => account.type === targetType)
    : accounts

  if (label) {
    const normalized = label.toLocaleLowerCase('tr-TR')
    const partial = typedAccounts.find((account) => {
      const accountNameNormalized = String(account.name || '').toLocaleLowerCase('tr-TR')
      return accountNameNormalized.includes(normalized) || normalized.includes(accountNameNormalized)
    })
    if (partial) return partial
  }

  return typedAccounts[0] || accounts[0] || null
}

function appendChequeEntryToAccount(accountId, entry) {
  const accounts = getTreasuryAccounts()
  const amount = Number(entry.amount) || 0
  const signedAmount = entry.direction === 'out' ? -amount : amount
  const nextAccounts = accounts.map((account) => {
    if (account.id !== accountId) return account

    const nextDetail = {
      id: entry.id || createTreasuryId('cheque'),
      chequeNo: entry.chequeNo || '',
      chequeBank: entry.chequeBank || '',
      chequeBranch: entry.chequeBranch || '',
      chequeDueDate: entry.chequeDueDate || '',
      chequeOwner: entry.chequeOwner || '',
      partyId: entry.partyId || '',
      partyName: entry.partyName || '',
      partyType: entry.partyType || 'Müşteri',
      amount: signedAmount,
      direction: entry.direction || 'in',
    }

    return {
      ...account,
      chequeBaseAmount: account.chequeBaseAmount ?? (Number(account.openingBalance) || 0),
      openingBalance: (Number(account.openingBalance) || 0) + signedAmount,
      chequeEntries: [nextDetail, ...(Array.isArray(account.chequeEntries) ? account.chequeEntries : [])],
    }
  })

  saveTreasuryAccounts(nextAccounts)
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
  const account = resolveTreasuryAccountForMovement(collection.method, collection.accountName)
  const amount = Number(collection.amount) || 0
  const movement = addTreasuryMovement({
    direction: 'in',
    type: 'Müşteri Tahsilatı',
    description: collection.description || `${collection.customerName} tahsilatı`,
    ...collection,
    accountId: account?.id || collection.accountId || '',
    accountName: account?.name || collection.accountName || 'Kasa',
    amount,
  })

  if (collection.method === 'Çek' && account?.type === 'Çek Kasası') {
    appendChequeEntryToAccount(account.id, {
      amount,
      direction: 'in',
      chequeNo: collection.chequeNo,
      chequeBank: collection.chequeBank,
      chequeBranch: collection.chequeBranch,
      chequeDueDate: collection.chequeDueDate,
      chequeOwner: collection.chequeOwner || collection.customerName,
      partyName: collection.customerName,
      partyType: 'Müşteri',
    })
  }

  return movement
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
  const account = resolveTreasuryAccountForMovement(payment.method, payment.accountName)
  const amount = Number(payment.amount) || 0
  const movement = addTreasuryMovement({
    direction: 'out',
    type: 'Müşteri Ödemesi',
    description: payment.description || `${payment.customerName} ödemesi`,
    ...payment,
    accountId: account?.id || payment.accountId || '',
    accountName: account?.name || payment.accountName || 'Kasa',
    amount,
  })

  if (payment.method === 'Çek' && account?.type === 'Çek Kasası') {
    appendChequeEntryToAccount(account.id, {
      amount,
      direction: 'out',
      chequeNo: payment.chequeNo,
      chequeBank: payment.chequeBank,
      chequeBranch: payment.chequeBranch,
      chequeDueDate: payment.chequeDueDate,
      chequeOwner: payment.chequeOwner || payment.customerName,
      partyName: payment.customerName,
      partyType: 'Müşteri',
    })
  }

  return movement
}

export function deleteTreasuryMovement(id) {
  const movements = getTreasuryMovements()
  const movement = movements.find((item) => item.id === id)
  if (movement) {
    appendActivityEntry({
      module: 'treasury',
      action: 'delete',
      entityType: 'treasuryMovement',
      entityId: movement.id,
      entityLabel: movement.description || movement.type || 'Kasa hareketi',
      description: `${movement.description || movement.type || 'Kasa hareketi'} silindi.`,
      snapshot: movement,
      undo: { type: 'treasury.restoreMovement' },
    })
  }
  const nextMovements = movements.filter((movement) => movement.id !== id)
  saveTreasuryMovements(nextMovements)
  return nextMovements
}

export function restoreTreasuryMovement(snapshot) {
  if (!snapshot?.id) return false
  const movements = getTreasuryMovements()
  if (!movements.some((movement) => movement.id === snapshot.id)) {
    saveTreasuryMovements([snapshot, ...movements])
  }
  return true
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
    || resolveTreasuryAccountForMovement(patch.method || current.method, patch.accountName || current.accountName, accounts)
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
    accountName: account?.name || 'Kasa',
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

const ARCHIVED_TREASURY_ACCOUNTS_KEY = 'erlenbox-treasury-archived-accounts'

function readArchivedTreasuryAccounts() {
  return readJson(ARCHIVED_TREASURY_ACCOUNTS_KEY, {})
}

function writeArchivedTreasuryAccounts(map) {
  writeJson(ARCHIVED_TREASURY_ACCOUNTS_KEY, map)
}

function buildTreasuryAccountSnapshot(accountId) {
  const accounts = getTreasuryAccounts()
  const account = accounts.find((item) => item.id === accountId)
  if (!account) return null
  const movements = getTreasuryMovements().filter((movement) => movement.accountId === accountId)
  return { account, movements }
}

export function archiveTreasuryAccount(accountId) {
  const snapshot = buildTreasuryAccountSnapshot(accountId)
  if (!snapshot) return false

  appendActivityEntry({
    module: 'treasury',
    action: 'archive',
    entityType: 'treasuryAccount',
    entityId: accountId,
    entityLabel: snapshot.account.name,
    description: `${snapshot.account.name} arşivlendi.`,
    snapshot,
    undo: { type: 'treasury.restoreAccount' },
  })

  const archived = readArchivedTreasuryAccounts()
  archived[accountId] = { ...snapshot, archivedAt: new Date().toISOString() }
  writeArchivedTreasuryAccounts(archived)
  saveTreasuryAccounts(getTreasuryAccounts().filter((item) => item.id !== accountId))
  return true
}

export function deleteTreasuryAccount(accountId) {
  const snapshot = buildTreasuryAccountSnapshot(accountId)
  if (!snapshot) return false

  appendActivityEntry({
    module: 'treasury',
    action: 'delete',
    entityType: 'treasuryAccount',
    entityId: accountId,
    entityLabel: snapshot.account.name,
    description: `${snapshot.account.name} silindi.`,
    snapshot,
    undo: { type: 'treasury.restoreAccount' },
  })

  const archived = readArchivedTreasuryAccounts()
  delete archived[accountId]
  writeArchivedTreasuryAccounts(archived)
  saveTreasuryAccounts(getTreasuryAccounts().filter((item) => item.id !== accountId))
  return true
}

export function restoreTreasuryAccount(snapshot) {
  if (!snapshot?.account?.id) return false

  const accounts = getTreasuryAccounts()
  if (!accounts.some((item) => item.id === snapshot.account.id)) {
    saveTreasuryAccounts([snapshot.account, ...accounts])
  }

  const archived = readArchivedTreasuryAccounts()
  delete archived[snapshot.account.id]
  writeArchivedTreasuryAccounts(archived)
  return true
}

export function fixTreasuryAccountBalance(accountId, targetBalance, extra = {}) {
  const accounts = getTreasuryAccounts()
  const account = accounts.find((item) => item.id === accountId)
  if (!account) return null

  const movements = getTreasuryMovements()
  const current = calculateAccountBalance(account, movements)
  const target = Number(targetBalance) || 0
  const diff = Math.round((target - current) * 100) / 100
  if (Math.abs(diff) < 0.005) return null

  return addTreasuryMovement({
    accountId,
    accountName: account.name,
    direction: diff > 0 ? 'in' : 'out',
    type: 'Bakiye Sabitleme',
    description: extra.description?.trim() || `Bakiye ${formatTreasuryCurrency(target)} olarak sabitlendi`,
    method: account.type === 'Banka Hesabı' ? 'Banka' : account.type === 'Çek Kasası' ? 'Çek' : 'Nakit',
    amount: Math.abs(diff),
    date: extra.date || todayForTreasury(),
  })
}
