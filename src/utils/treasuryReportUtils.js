import {
  calculateAccountBalance,
  getTreasuryAccounts,
  getTreasuryMovements,
  isChequeTreasuryAccount,
} from './treasuryStore'
import { SUPPLIER_TYPE_LABEL } from './customerMeta'

function parseMovementDate(value) {
  const raw = String(value || '')
  const trMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (trMatch) return `${trMatch[3]}-${trMatch[2]}-${trMatch[1]}`
  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  return raw.slice(0, 10)
}

function monthLabel(iso) {
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
}

export function getCashBankSummary() {
  const accounts = getTreasuryAccounts()
  const movements = getTreasuryMovements()

  const enriched = accounts.map((account) => ({
    ...account,
    balance: calculateAccountBalance(account, movements),
  }))

  const cashTotal = enriched
    .filter((item) => item.type === 'Nakit Kasa')
    .reduce((sum, item) => sum + item.balance, 0)
  const bankTotal = enriched
    .filter((item) => item.type === 'Banka Hesabı')
    .reduce((sum, item) => sum + item.balance, 0)
  const chequeTotal = enriched
    .filter((item) => item.type === 'Çek Kasası')
    .reduce((sum, item) => sum + item.balance, 0)

  return {
    accounts: enriched,
    cashTotal,
    bankTotal,
    chequeTotal,
    grandTotal: cashTotal + bankTotal + chequeTotal,
  }
}

export function collectAllChequeRows() {
  const accounts = getTreasuryAccounts()
  const rows = []

  accounts
    .filter((account) => account.type === 'Çek Kasası')
    .forEach((account) => {
      const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
      const hasBase = Boolean(account.chequeNo || account.chequeBank || account.chequeDueDate)

      if (hasBase) {
        rows.push({
          id: `${account.id}-base`,
          accountId: account.id,
          accountName: account.name,
          chequeNo: account.chequeNo || '—',
          chequeBank: account.chequeBank || '—',
          chequeBranch: account.chequeBranch || '—',
          chequeDueDate: account.chequeDueDate || '—',
          chequeOwner: account.chequeOwner || '—',
          amount: Number(account.chequeBaseAmount ?? account.openingBalance) || 0,
          collected: Boolean(account.chequeCollected),
          paid: Boolean(account.chequePaid),
        })
      }

      entries.forEach((entry) => {
        rows.push({
          id: entry.id || `${account.id}-${entry.chequeNo}`,
          accountId: account.id,
          accountName: account.name,
          chequeNo: entry.chequeNo || '—',
          chequeBank: entry.chequeBank || '—',
          chequeBranch: entry.chequeBranch || '—',
          chequeDueDate: entry.chequeDueDate || '—',
          chequeOwner: entry.chequeOwner || entry.partyName || '—',
          amount: Number(entry.amount) || 0,
          collected: Boolean(entry.collected),
          paid: Boolean(entry.paid),
        })
      })
    })

  return rows.sort((a, b) => String(b.chequeDueDate).localeCompare(String(a.chequeDueDate)))
}

function isCustomerChequeEntry(entry = {}) {
  const partyType = String(entry.partyType || '').trim()
  if (partyType === 'Tedarikçi' || partyType === SUPPLIER_TYPE_LABEL) return false
  const amount = Number(entry.amount) || 0
  const direction = entry.direction || (amount < 0 ? 'out' : 'in')
  return direction !== 'out'
}

function isChequeInPortfolio(entry = {}) {
  return !entry.collected && !entry.paid
}

function normalizeChequeAmount(entry = {}) {
  return Math.abs(Number(entry.amount) || 0)
}

function isSenetInstrument(entry = {}) {
  const instrument = String(entry.instrumentType || entry.instrument || '').trim()
  return instrument === 'Senet'
}

function isChequeInstrument(entry = {}) {
  return !isSenetInstrument(entry)
}

export function getCustomerPromissoryNotePortfolioRows(accounts = getTreasuryAccounts()) {
  const rows = []

  accounts
    .filter(isChequeTreasuryAccount)
    .forEach((account) => {
      const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
      const hasBase = Boolean(
        account.chequeNo
        || account.chequeBank
        || account.chequeBranch
        || account.chequeDueDate
        || account.chequeOwner
        || Number(account.openingBalance),
      )

      if (
        hasBase
        && isSenetInstrument(account)
        && isChequeInPortfolio({ collected: account.chequeCollected, paid: account.chequePaid })
      ) {
        const amount = normalizeChequeAmount({
          amount: Number(account.chequeBaseAmount ?? account.openingBalance) || 0,
        })
        if (amount > 0) {
          rows.push({
            id: `${account.id}-base`,
            accountId: account.id,
            accountName: account.name,
            partyName: account.chequeOwner || '',
            amount,
          })
        }
      }

      entries.forEach((entry) => {
        if (!isCustomerChequeEntry(entry) || !isSenetInstrument(entry) || !isChequeInPortfolio(entry)) return
        const amount = normalizeChequeAmount(entry)
        if (amount <= 0) return
        rows.push({
          id: entry.id || `${account.id}-${entry.chequeNo}`,
          accountId: account.id,
          accountName: account.name,
          partyName: entry.partyName || entry.chequeOwner || '',
          amount,
        })
      })
    })

  return rows
}

export function getCustomerChequePortfolioRows(accounts = getTreasuryAccounts()) {
  const rows = []

  accounts
    .filter(isChequeTreasuryAccount)
    .forEach((account) => {
      const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
      const hasBase = Boolean(
        account.chequeNo
        || account.chequeBank
        || account.chequeBranch
        || account.chequeDueDate
        || account.chequeOwner
        || Number(account.openingBalance),
      )

      if (
        hasBase
        && isChequeInstrument(account)
        && isChequeInPortfolio({ collected: account.chequeCollected, paid: account.chequePaid })
      ) {
        const amount = normalizeChequeAmount({
          amount: Number(account.chequeBaseAmount ?? account.openingBalance) || 0,
        })
        if (amount > 0) {
          rows.push({
            id: `${account.id}-base`,
            accountId: account.id,
            accountName: account.name,
            partyName: account.chequeOwner || '',
            amount,
          })
        }
      }

      entries.forEach((entry) => {
        if (!isCustomerChequeEntry(entry) || !isChequeInstrument(entry) || !isChequeInPortfolio(entry)) return
        const amount = normalizeChequeAmount(entry)
        if (amount <= 0) return
        rows.push({
          id: entry.id || `${account.id}-${entry.chequeNo}`,
          accountId: account.id,
          accountName: account.name,
          partyName: entry.partyName || entry.chequeOwner || '',
          amount,
        })
      })
    })

  return rows
}

export function getCustomerChequePortfolioTotal(accounts = getTreasuryAccounts()) {
  return getCustomerChequePortfolioRows(accounts).reduce((sum, row) => sum + row.amount, 0)
}

export function getCustomerPromissoryNotePortfolioTotal(accounts = getTreasuryAccounts()) {
  return getCustomerPromissoryNotePortfolioRows(accounts).reduce((sum, row) => sum + row.amount, 0)
}

function isIncomingChequeEntry(entry = {}) {
  const amount = Number(entry.amount) || 0
  const direction = entry.direction || (amount < 0 ? 'out' : 'in')
  return direction !== 'out'
}

export function getAllChequePortfolioRows(accounts = getTreasuryAccounts()) {
  const rows = []

  accounts
    .filter(isChequeTreasuryAccount)
    .forEach((account) => {
      const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
      const hasBase = Boolean(
        account.chequeNo
        || account.chequeBank
        || account.chequeBranch
        || account.chequeDueDate
        || account.chequeOwner
        || Number(account.openingBalance),
      )

      if (
        hasBase
        && isChequeInstrument(account)
        && isChequeInPortfolio({ collected: account.chequeCollected, paid: account.chequePaid })
      ) {
        const amount = normalizeChequeAmount({
          amount: Number(account.chequeBaseAmount ?? account.openingBalance) || 0,
        })
        if (amount > 0) {
          rows.push({
            id: `${account.id}-base`,
            accountId: account.id,
            amount,
          })
        }
      }

      entries.forEach((entry) => {
        if (!isIncomingChequeEntry(entry) || !isChequeInstrument(entry) || !isChequeInPortfolio(entry)) return
        const amount = normalizeChequeAmount(entry)
        if (amount <= 0) return
        rows.push({
          id: entry.id || `${account.id}-${entry.chequeNo}`,
          accountId: account.id,
          amount,
        })
      })
    })

  return rows
}

export function getAllChequePortfolioTotal(accounts = getTreasuryAccounts()) {
  return getAllChequePortfolioRows(accounts).reduce((sum, row) => sum + row.amount, 0)
}

export function getCashFlowTimeline() {
  const movements = getTreasuryMovements()
  const buckets = new Map()

  movements.forEach((movement) => {
    const key = monthLabel(parseMovementDate(movement.date))
    const current = buckets.get(key) || { label: key, inflow: 0, outflow: 0 }
    const amount = Number(movement.amount) || 0

    if (movement.direction === 'in') current.inflow += amount
    else if (movement.direction === 'out') current.outflow += amount

    buckets.set(key, current)
  })

  return Array.from(buckets.values()).map((item) => ({
    ...item,
    net: item.inflow - item.outflow,
  }))
}

export function formatChequeDate(value) {
  if (!value || value === '—') return '—'
  const iso = parseMovementDate(value)
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
