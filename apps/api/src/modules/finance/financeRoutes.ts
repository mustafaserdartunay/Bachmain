import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  aiCollections,
  aiInsights,
  balanceSheet,
  createAccount,
  createAsset,
  createBudget,
  createCost,
  createReconciliation,
  incomeStatement,
  listAccounts,
  listAssets,
  listBudgets,
  listCosts,
  listJournals,
  listReconciliations,
  overview,
  projectJournal,
} from './financeService.js'

export async function financeRoutes(app: FastifyInstance) {
  app.get(
    '/v1/finance/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await overview(companyId)) }
    },
  )

  app.get(
    '/v1/finance/accounts',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, accounts: await listAccounts(companyId) }
    },
  )

  app.post(
    '/v1/finance/accounts',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          code: z.string().min(1),
          name: z.string().min(1),
          type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
          currency: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, account: await createAccount(companyId, body) }
    },
  )

  app.get(
    '/v1/finance/journals',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, journals: await listJournals(companyId) }
    },
  )

  app.post(
    '/v1/finance/journals/project',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          source: z.string().min(1),
          amount: z.number(),
          memo: z.string().optional(),
          treasuryMovementId: z.string().optional(),
          invoiceId: z.string().optional(),
          orderId: z.string().optional(),
          productionJobId: z.string().optional(),
          customerId: z.string().optional(),
          debitAccount: z.string().optional(),
          creditAccount: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, journal: await projectJournal(companyId, body) }
    },
  )

  app.get(
    '/v1/finance/reports/balance-sheet',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await balanceSheet(companyId)) }
    },
  )

  app.get(
    '/v1/finance/reports/income',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await incomeStatement(companyId)) }
    },
  )

  app.get(
    '/v1/finance/budgets',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, budgets: await listBudgets(companyId) }
    },
  )

  app.post(
    '/v1/finance/budgets',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          year: z.number().int(),
          lines: z.array(z.record(z.unknown())).optional(),
        })
        .parse(req.body || {})
      return { ok: true, budget: await createBudget(companyId, body) }
    },
  )

  app.get(
    '/v1/finance/costs',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, costs: await listCosts(companyId) }
    },
  )

  app.post(
    '/v1/finance/costs',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          dimension: z.string().min(1),
          dimensionId: z.string().min(1),
          amount: z.string().min(1),
          productionJobId: z.string().optional(),
          memo: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, cost: await createCost(companyId, body) }
    },
  )

  app.get(
    '/v1/finance/assets',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, assets: await listAssets(companyId) }
    },
  )

  app.post(
    '/v1/finance/assets',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          code: z.string().min(1),
          name: z.string().min(1),
          acquisitionCost: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, asset: await createAsset(companyId, body) }
    },
  )

  app.get(
    '/v1/finance/reconciliations',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, items: await listReconciliations(companyId) }
    },
  )

  app.post(
    '/v1/finance/reconciliations',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ bankAccountRef: z.string().min(1) }).parse(req.body || {})
      return { ok: true, item: await createReconciliation(companyId, body.bankAccountRef) }
    },
  )

  app.get(
    '/v1/finance/ai/insights',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...aiInsights() }),
  )

  app.get(
    '/v1/finance/ai/collections',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...aiCollections() }),
  )
}
