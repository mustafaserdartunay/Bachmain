import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  financeAccounts,
  financeAssets,
  financeBudgets,
  financeCostEntries,
  financeJournalLines,
  financeJournals,
  financeReconciliations,
} from '../../db/schema/index.js'
import { ingestEvent } from '../workflow/workflowService.js'

const COA_SEED = [
  { code: '100', name: 'Kasa', type: 'asset' },
  { code: '102', name: 'Bankalar', type: 'asset' },
  { code: '120', name: 'Alıcılar', type: 'asset' },
  { code: '150', name: 'Stoklar', type: 'asset' },
  { code: '253', name: 'Tesis Makine', type: 'asset' },
  { code: '320', name: 'Satıcılar', type: 'liability' },
  { code: '360', name: 'Ödenecek Vergiler', type: 'liability' },
  { code: '500', name: 'Sermaye', type: 'equity' },
  { code: '600', name: 'Yurt İçi Satışlar', type: 'revenue' },
  { code: '622', name: 'Satılan Mamul Maliyeti', type: 'expense' },
  { code: '740', name: 'Hizmet Üretim Maliyeti', type: 'expense' },
  { code: '770', name: 'Genel Yönetim Giderleri', type: 'expense' },
]

async function ensureCoa(companyId: string) {
  const [existing] = await db
    .select()
    .from(financeAccounts)
    .where(and(eq(financeAccounts.companyId, companyId), isNull(financeAccounts.deletedAt)))
    .limit(1)
  if (existing) return
  for (const row of COA_SEED) {
    await db.insert(financeAccounts).values({
      companyId,
      code: row.code,
      name: row.name,
      type: row.type,
      currency: 'TRY',
      active: true,
    })
  }
}

export async function overview(companyId: string) {
  await ensureCoa(companyId)
  const [acct] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(financeAccounts)
    .where(and(eq(financeAccounts.companyId, companyId), isNull(financeAccounts.deletedAt)))
  const [journals] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(financeJournals)
    .where(and(eq(financeJournals.companyId, companyId), isNull(financeJournals.deletedAt)))
  const [budgets] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(financeBudgets)
    .where(and(eq(financeBudgets.companyId, companyId), isNull(financeBudgets.deletedAt)))

  return {
    cashOnHand: 428500,
    bankBalance: 1250000,
    receivables: 486200,
    payables: 312400,
    monthlyInflow: 620000,
    monthlyOutflow: 410000,
    vatPayable: 84500,
    budgetVariancePct: -4.2,
    coaCount: acct?.count ?? 0,
    journalCount: journals?.count ?? 0,
    budgetCount: budgets?.count ?? 0,
    currency: 'TRY',
    phase: 'FS-0',
    source: 'fs-0-demo+projection',
    links: {
      cash: '/nakit/kasa-bankalar',
      invoices: '/musteriler/faturalar',
      expenses: '/giderler/liste',
      cashFlow: '/nakit/nakit-akisi-raporu',
      vat: '/giderler/kdv-raporu',
    },
  }
}

export async function listAccounts(companyId: string) {
  await ensureCoa(companyId)
  return db
    .select()
    .from(financeAccounts)
    .where(and(eq(financeAccounts.companyId, companyId), isNull(financeAccounts.deletedAt)))
    .orderBy(asc(financeAccounts.code))
}

export async function createAccount(
  companyId: string,
  input: { code: string; name: string; type: string; currency?: string },
) {
  const [row] = await db
    .insert(financeAccounts)
    .values({
      companyId,
      code: input.code,
      name: input.name,
      type: input.type,
      currency: input.currency || 'TRY',
      active: true,
    })
    .returning()
  await ingestEvent(companyId, 'trigger.finance.account.created', {
    accountId: row.id,
    code: row.code,
  })
  return row
}

export async function listJournals(companyId: string) {
  return db
    .select()
    .from(financeJournals)
    .where(and(eq(financeJournals.companyId, companyId), isNull(financeJournals.deletedAt)))
    .orderBy(desc(financeJournals.createdAt))
    .limit(100)
}

export async function projectJournal(
  companyId: string,
  input: {
    source: string
    amount: number
    memo?: string
    treasuryMovementId?: string
    invoiceId?: string
    orderId?: string
    productionJobId?: string
    customerId?: string
    debitAccount?: string
    creditAccount?: string
  },
) {
  await ensureCoa(companyId)
  const journalNo = `JRN-${Date.now().toString().slice(-8)}`
  const amount = String(Math.abs(input.amount))
  const debit = input.debitAccount || (input.source === 'expense' ? '770' : '120')
  const credit = input.creditAccount || (input.source === 'expense' ? '100' : '600')

  const [journal] = await db
    .insert(financeJournals)
    .values({
      companyId,
      journalNo,
      status: 'posted',
      source: input.source,
      memo: input.memo || `Projection ${input.source}`,
      treasuryMovementId: input.treasuryMovementId,
      invoiceId: input.invoiceId,
      orderId: input.orderId,
      productionJobId: input.productionJobId,
      customerId: input.customerId,
      postedAt: new Date(),
      currency: 'TRY',
    })
    .returning()

  await db.insert(financeJournalLines).values([
    {
      journalId: journal.id,
      companyId,
      accountCode: debit,
      debit: amount,
      credit: '0',
      memo: input.memo,
    },
    {
      journalId: journal.id,
      companyId,
      accountCode: credit,
      debit: '0',
      credit: amount,
      memo: input.memo,
    },
  ])

  await ingestEvent(companyId, 'trigger.finance.journal.posted', {
    journalId: journal.id,
    journalNo,
    source: input.source,
  })
  return journal
}

export async function balanceSheet(companyId: string) {
  await ensureCoa(companyId)
  return {
    asOf: new Date().toISOString().slice(0, 10),
    assets: [
      { code: '100', name: 'Kasa', amount: 428500 },
      { code: '102', name: 'Bankalar', amount: 1250000 },
      { code: '120', name: 'Alıcılar', amount: 486200 },
      { code: '150', name: 'Stoklar', amount: 910000 },
    ],
    liabilities: [
      { code: '320', name: 'Satıcılar', amount: 312400 },
      { code: '360', name: 'Ödenecek Vergiler', amount: 84500 },
    ],
    equity: [{ code: '500', name: 'Sermaye', amount: 2677800 }],
    currency: 'TRY',
    phase: 'FS-0-demo',
    note: 'Operational balances remain in treasury/invoices; this is management projection.',
  }
}

export async function incomeStatement(companyId: string) {
  await ensureCoa(companyId)
  return {
    period: new Date().toISOString().slice(0, 7),
    revenue: [{ code: '600', name: 'Yurt İçi Satışlar', amount: 1864000 }],
    cogs: [{ code: '622', name: 'SMM', amount: 920000 }],
    opex: [{ code: '770', name: 'Genel Yönetim', amount: 310000 }],
    grossProfit: 944000,
    netProfit: 634000,
    currency: 'TRY',
    phase: 'FS-0-demo',
  }
}

export async function listBudgets(companyId: string) {
  return db
    .select()
    .from(financeBudgets)
    .where(and(eq(financeBudgets.companyId, companyId), isNull(financeBudgets.deletedAt)))
}

export async function createBudget(
  companyId: string,
  input: { name: string; year: number; lines?: Record<string, unknown>[] },
) {
  const [row] = await db
    .insert(financeBudgets)
    .values({
      companyId,
      name: input.name,
      year: input.year,
      lines: input.lines || [],
      status: 'draft',
    })
    .returning()
  await ingestEvent(companyId, 'trigger.finance.budget.created', { budgetId: row.id })
  return row
}

export async function listCosts(companyId: string) {
  return db
    .select()
    .from(financeCostEntries)
    .where(and(eq(financeCostEntries.companyId, companyId), isNull(financeCostEntries.deletedAt)))
    .orderBy(desc(financeCostEntries.createdAt))
}

export async function createCost(
  companyId: string,
  input: {
    dimension: string
    dimensionId: string
    amount: string
    productionJobId?: string
    memo?: string
  },
) {
  const [row] = await db
    .insert(financeCostEntries)
    .values({
      companyId,
      dimension: input.dimension,
      dimensionId: input.dimensionId,
      amount: input.amount,
      productionJobId: input.productionJobId,
      memo: input.memo,
    })
    .returning()
  await ingestEvent(companyId, 'trigger.finance.cost.recorded', { costId: row.id })
  return row
}

export async function listAssets(companyId: string) {
  return db
    .select()
    .from(financeAssets)
    .where(and(eq(financeAssets.companyId, companyId), isNull(financeAssets.deletedAt)))
}

export async function createAsset(
  companyId: string,
  input: { code: string; name: string; acquisitionCost?: string },
) {
  const [row] = await db
    .insert(financeAssets)
    .values({
      companyId,
      code: input.code,
      name: input.name,
      acquisitionCost: input.acquisitionCost,
      status: 'active',
      acquiredAt: new Date(),
    })
    .returning()
  return row
}

export async function listReconciliations(companyId: string) {
  return db
    .select()
    .from(financeReconciliations)
    .where(
      and(
        eq(financeReconciliations.companyId, companyId),
        isNull(financeReconciliations.deletedAt),
      ),
    )
}

export async function createReconciliation(companyId: string, bankAccountRef: string) {
  const [row] = await db
    .insert(financeReconciliations)
    .values({
      companyId,
      bankAccountRef,
      status: 'open',
      statementDate: new Date(),
      matchedCount: 0,
    })
    .returning()
  await ingestEvent(companyId, 'trigger.finance.reconciliation.opened', { id: row.id })
  return row
}

export function aiInsights() {
  return {
    cashForecast30d: { inflow: 780000, outflow: 520000, net: 260000, currency: 'TRY' },
    fxRisk: { exposureUsd: 42000, riskPct: 22, note: 'USD alacak / TRY maliyet' },
    collectionForecast: { expectedIn7d: 186000, delayRiskPct: 28 },
    profitability: { marginPct: 34, trend: 'up' },
    costAlert: { dimension: 'machine', ref: 'MC-02', overBudgetPct: 12 },
    budgetVariance: { pct: -4.2, worst: '770 Genel Yönetim' },
    phase: 'FS-0-stub',
  }
}

export function aiCollections() {
  return {
    overdue: [
      {
        customerId: 'demo',
        customerName: 'Örnek A.Ş.',
        amount: 48500,
        daysOverdue: 18,
        bestCallDay: 'Salı 10:00',
        channels: ['whatsapp', 'email', 'sms'],
        script: 'Kısa hatırlatma + ödeme linki önerisi',
      },
    ],
    phase: 'FS-0-stub',
  }
}
