const STORAGE_KEY = 'bach-loan-payments-v1'
export const LOAN_PAYMENTS_EVENT = 'erlenbox:loan-payments-updated'

export const LOAN_TYPE_OPTIONS = [
  'Konut Kredisi',
  'Taşıt Kredisi',
  'İhtiyaç Kredisi',
  'Ticari Kredi',
  'Rotatif Kredi',
  'Kredi Kartı Borcu',
  'Diğer',
]

function createId(prefix = 'loan') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function addMonths(isoDate, months) {
  const base = new Date(`${isoDate || new Date().toISOString().slice(0, 10)}T12:00:00`)
  if (Number.isNaN(base.getTime())) return new Date().toISOString().slice(0, 10)
  const next = new Date(base.getFullYear(), base.getMonth() + months, base.getDate(), 12)
  return next.toISOString().slice(0, 10)
}

export function buildInstallments({ totalAmount = 0, installmentCount = 1, startDate, existing = [] }) {
  const count = Math.max(1, Math.min(360, Number(installmentCount) || 1))
  const total = Number(totalAmount) || 0
  const perInstallment = count > 0 ? Math.round((total / count) * 100) / 100 : 0
  const start = startDate || new Date().toISOString().slice(0, 10)

  return Array.from({ length: count }, (_, index) => {
    const previous = existing[index]
    const number = index + 1
    return {
      id: previous?.id || createId('inst'),
      number,
      dueDate: previous?.dueDate || addMonths(start, index),
      amount: previous?.amount ?? perInstallment,
      isPaid: Boolean(previous?.isPaid),
      paidDate: previous?.paidDate || '',
      note: previous?.note || '',
    }
  })
}

function normalizeLoan(raw) {
  const installmentCount = Math.max(1, Number(raw.installmentCount) || 1)
  const totalAmount = Number(raw.totalAmount) || 0
  const installments = buildInstallments({
    totalAmount,
    installmentCount,
    startDate: raw.startDate,
    existing: Array.isArray(raw.installments) ? raw.installments : [],
  })

  return {
    id: raw.id || createId(),
    loanType: String(raw.loanType || LOAN_TYPE_OPTIONS[0]),
    bankName: String(raw.bankName || '').trim(),
    totalAmount,
    installmentCount,
    startDate: raw.startDate || new Date().toISOString().slice(0, 10),
    installments,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function loadLoanPayments() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved.map(normalizeLoan) : []
  } catch {
    return []
  }
}

export function saveLoanPayments(items) {
  const next = (Array.isArray(items) ? items : []).map(normalizeLoan)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(LOAN_PAYMENTS_EVENT))
  return next
}

export function upsertLoanPayment(item) {
  const items = loadLoanPayments()
  const normalized = normalizeLoan(item)
  const index = items.findIndex((entry) => entry.id === normalized.id)
  if (index >= 0) items[index] = normalized
  else items.unshift(normalized)
  return saveLoanPayments(items)
}

export function deleteLoanPayment(id) {
  return saveLoanPayments(loadLoanPayments().filter((item) => item.id !== id))
}

export function createEmptyLoan() {
  return normalizeLoan({
    id: createId(),
    loanType: LOAN_TYPE_OPTIONS[0],
    bankName: '',
    totalAmount: 0,
    installmentCount: 12,
    startDate: new Date().toISOString().slice(0, 10),
    installments: [],
  })
}

export function summarizeLoan(loan) {
  const installments = loan.installments || []
  const paidAmount = installments
    .filter((item) => item.isPaid)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const remainingAmount = Math.max(0, (Number(loan.totalAmount) || 0) - paidAmount)
  const paidCount = installments.filter((item) => item.isPaid).length
  const nextDue = installments.find((item) => !item.isPaid)
  return {
    paidAmount,
    remainingAmount,
    paidCount,
    totalCount: installments.length,
    nextDue,
  }
}
