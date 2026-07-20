const KEY = 'bach_finance_fs0_v1'
const EVT = 'bach:finance-updated'

const COA = [
  { code: '100', name: 'Kasa', type: 'asset' },
  { code: '102', name: 'Bankalar', type: 'asset' },
  { code: '120', name: 'Alıcılar', type: 'asset' },
  { code: '320', name: 'Satıcılar', type: 'liability' },
  { code: '600', name: 'Yurt İçi Satışlar', type: 'revenue' },
  { code: '770', name: 'Genel Yönetim Giderleri', type: 'expense' },
]

function blank() {
  return {
    accounts: COA.map((a, i) => ({ id: `fa${i}`, ...a })),
    journals: [],
    budgets: [],
    costs: [],
    assets: [],
    reconciliations: [],
  }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    return { ...blank(), ...JSON.parse(raw) }
  } catch {
    return blank()
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT))
  return state
}

export function ensureFinanceSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function financeOverviewLocal() {
  const s = read()
  return {
    cashOnHand: 428500,
    bankBalance: 1250000,
    receivables: 486200,
    payables: 312400,
    monthlyInflow: 620000,
    monthlyOutflow: 410000,
    vatPayable: 84500,
    budgetVariancePct: -4.2,
    coaCount: s.accounts.length,
    journalCount: s.journals.length,
  }
}

export function listAccountsLocal() {
  return read().accounts
}

export function listJournalsLocal() {
  return read().journals
}

export function projectJournalLocal(input) {
  const s = read()
  const row = {
    id: `jrn_${Date.now().toString(36)}`,
    journalNo: `JRN-${Date.now().toString().slice(-6)}`,
    source: input.source || 'manual',
    amount: input.amount || 0,
    memo: input.memo || '',
    status: 'posted',
    invoiceId: input.invoiceId,
    treasuryMovementId: input.treasuryMovementId,
    at: new Date().toISOString(),
  }
  s.journals.unshift(row)
  write(s)
  return row
}

export function listBudgetsLocal() {
  return read().budgets
}

export function addBudgetLocal(name, year) {
  const s = read()
  const row = { id: `bdg_${Date.now().toString(36)}`, name, year, status: 'draft' }
  s.budgets.unshift(row)
  write(s)
  return row
}

export function listCostsLocal() {
  return read().costs
}

export function addCostLocal(dimension, dimensionId, amount) {
  const s = read()
  const row = {
    id: `cst_${Date.now().toString(36)}`,
    dimension,
    dimensionId,
    amount,
  }
  s.costs.unshift(row)
  write(s)
  return row
}

export function listAssetsLocal() {
  return read().assets
}

export function addAssetLocal(code, name) {
  const s = read()
  const row = { id: `ast_${Date.now().toString(36)}`, code, name, status: 'active' }
  s.assets.unshift(row)
  write(s)
  return row
}

export function listReconLocal() {
  return read().reconciliations
}

export function addReconLocal(bankAccountRef) {
  const s = read()
  const row = {
    id: `rec_${Date.now().toString(36)}`,
    bankAccountRef,
    status: 'open',
  }
  s.reconciliations.unshift(row)
  write(s)
  return row
}

export function aiInsightsLocal() {
  return {
    cashForecast30d: { inflow: 780000, outflow: 520000, net: 260000 },
    fxRisk: { exposureUsd: 42000, riskPct: 22 },
    collectionForecast: { expectedIn7d: 186000, delayRiskPct: 28 },
    profitability: { marginPct: 34 },
    budgetVariance: { pct: -4.2 },
  }
}

export function aiCollectionsLocal() {
  return {
    overdue: [
      {
        customerName: 'Örnek A.Ş.',
        amount: 48500,
        daysOverdue: 18,
        bestCallDay: 'Salı 10:00',
        channels: ['whatsapp', 'email', 'sms'],
      },
    ],
  }
}

export function balanceSheetLocal() {
  return {
    assets: [
      { code: '100', name: 'Kasa', amount: 428500 },
      { code: '102', name: 'Bankalar', amount: 1250000 },
      { code: '120', name: 'Alıcılar', amount: 486200 },
    ],
    liabilities: [
      { code: '320', name: 'Satıcılar', amount: 312400 },
      { code: '360', name: 'Vergiler', amount: 84500 },
    ],
  }
}

export function incomeLocal() {
  return {
    revenue: 1864000,
    cogs: 920000,
    opex: 310000,
    netProfit: 634000,
  }
}

export { EVT as FINANCE_UPDATED_EVENT }
