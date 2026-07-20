export const FINANCE_BASE = '/finans'

export const financeSubMenus = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'gl', label: 'General Ledger' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'banks', label: 'Banks' },
  { id: 'budget', label: 'Budget' },
  { id: 'receivables', label: 'Receivables' },
  { id: 'payables', label: 'Payables' },
  { id: 'cost', label: 'Cost Accounting' },
  { id: 'assets', label: 'Assets' },
  { id: 'tax', label: 'Tax Center' },
  { id: 'einvoice', label: 'E-Invoice' },
  { id: 'eledger', label: 'E-Ledger' },
  { id: 'reports', label: 'Reports' },
  { id: 'ai', label: 'AI Finance' },
]

export function isFinanceRoute(pathname) {
  return pathname === FINANCE_BASE || pathname.startsWith(`${FINANCE_BASE}/`)
}
