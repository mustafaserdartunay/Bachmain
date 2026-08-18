import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  authenticate,
  requirePermission,
  requireStaff,
  requireTenant,
} from '../../shared/authGuard.js'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import {
  adminListConnections,
  adminOverview,
  checkTaxpayer,
  createOrSendDocument,
  cronSyncAll,
  downloadDocumentFile,
  getDocument,
  getPublicConnection,
  listCredits,
  listDocuments,
  sendDraft,
  syncInbox,
  testConnection,
  upsertConnection,
} from './edocumentService.js'

const invoicePayloadSchema = z.object({
  uuid: z.string().uuid().optional(),
  invoiceNo: z.string().optional(),
  invoiceType: z.string().optional(),
  invoiceProfile: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().optional(),
  exchangeRate: z.number().nullable().optional(),
  notes: z.union([z.string(), z.array(z.string())]).optional(),
  orderNo: z.string().nullable().optional(),
  shipmentNo: z.string().nullable().optional(),
  company: z.object({
    taxNumber: z.string().optional(),
    name: z.string().optional(),
    taxOffice: z.string().optional(),
    address: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
  }),
  customer: z.object({
    taxNumber: z.string().optional(),
    name: z.string().optional(),
    taxOffice: z.string().optional(),
    address: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }),
  lines: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unitType: z.string().optional(),
        price: z.number(),
        allowanceTotal: z.number().optional(),
        kdvPercent: z.number(),
        kdvTotal: z.number().optional(),
        note: z.string().optional(),
      }),
    )
    .min(1),
})

function cronAuthorized(req: { headers: Record<string, unknown> }) {
  const secret = env.EDOCUMENTS_CRON_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const header = String(req.headers.authorization || '')
  const alt = String(req.headers['x-cron-secret'] || '')
  return header === `Bearer ${secret}` || alt === secret
}

export async function edocumentRoutes(app: FastifyInstance) {
  app.get(
    '/v1/edocuments/connection',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, connection: await getPublicConnection(companyId) }
    },
  )

  app.put(
    '/v1/edocuments/connection',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          apiKey: z.string().min(16).optional(),
          environment: z.enum(['TEST', 'PRODUCTION']).optional(),
          branchId: z.string().nullable().optional(),
        })
        .parse(req.body || {})
      const connection = await upsertConnection(companyId, {
        ...body,
        userId: req.auth?.sub,
        ip: req.ip,
      })
      return { ok: true, connection }
    },
  )

  app.post(
    '/v1/edocuments/connection/test',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return testConnection(companyId, req.auth?.sub, req.ip)
    },
  )

  app.get(
    '/v1/edocuments/taxpayer',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const taxNumber = String((req.query as { taxNumber?: string }).taxNumber || '')
      return { ok: true, ...(await checkTaxpayer(companyId, taxNumber)) }
    },
  )

  app.get(
    '/v1/edocuments/credits',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, credits: await listCredits(companyId) }
    },
  )

  app.get(
    '/v1/edocuments',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = req.query as Record<string, string>
      return {
        ok: true,
        rows: await listDocuments(companyId, {
          direction: q.direction,
          documentType: q.documentType,
          status: q.status,
          search: q.search,
        }),
      }
    },
  )

  app.post(
    '/v1/edocuments',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          invoiceId: z.string().optional(),
          branchId: z.string().nullable().optional(),
          asDraft: z.boolean().optional(),
          documentType: z.enum(['e-fatura', 'e-arsiv', 'auto']).optional(),
          payload: invoicePayloadSchema,
          projectCari: z.boolean().optional(),
        })
        .parse(req.body || {})
      return {
        ok: true,
        ...(await createOrSendDocument(companyId, { ...body, userId: req.auth?.sub, ip: req.ip })),
      }
    },
  )

  app.post(
    '/v1/edocuments/sync',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return syncInbox(companyId, req.auth?.sub)
    },
  )

  app.get(
    '/v1/edocuments/:id',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      return { ok: true, ...(await getDocument(companyId, id)) }
    },
  )

  app.post(
    '/v1/edocuments/:id/send',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      return { ok: true, document: await sendDraft(companyId, id, req.auth?.sub, req.ip) }
    },
  )

  app.get(
    '/v1/edocuments/:id/pdf',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req, reply) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      const file = await downloadDocumentFile(companyId, id, 'pdf', req.auth?.sub)
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `inline; filename="${file.filename}"`)
        .send(file.buffer)
    },
  )

  app.get(
    '/v1/edocuments/:id/xml',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req, reply) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      const file = await downloadDocumentFile(companyId, id, 'xml', req.auth?.sub)
      return reply
        .header('Content-Type', 'application/xml')
        .header('Content-Disposition', `attachment; filename="${file.filename}"`)
        .send(file.buffer)
    },
  )

  app.get('/v1/edocuments/cron/sync', async (req) => {
    if (!cronAuthorized(req)) throw new AppError('UNAUTHORIZED', 'Cron yetkisi yok', 401)
    return cronSyncAll()
  })

  app.post('/v1/edocuments/cron/sync', async (req) => {
    if (!cronAuthorized(req)) throw new AppError('UNAUTHORIZED', 'Cron yetkisi yok', 401)
    return cronSyncAll()
  })

  app.post('/v1/edocuments/webhooks/nilvera', async (req) => {
    const secret = env.NILVERA_WEBHOOK_SECRET
    if (secret) {
      const header = String(req.headers.authorization || req.headers['x-nilvera-secret'] || '')
      if (header !== `Bearer ${secret}` && header !== secret) {
        throw new AppError('UNAUTHORIZED', 'Webhook imzası geçersiz', 401)
      }
    }
    return {
      ok: true,
      message:
        'Nilvera resmi dokümantasyonunda genel amaçlı webhook yok. Asıl senkron cron/polling ile yapılır.',
    }
  })

  app.get(
    '/v1/admin/edocuments/overview',
    { preHandler: requireStaff('support', 'billing', 'superadmin') },
    async () => ({ ok: true, ...(await adminOverview()) }),
  )

  app.get(
    '/v1/admin/edocuments/connections',
    { preHandler: requireStaff('support', 'billing', 'superadmin') },
    async () => ({ ok: true, rows: await adminListConnections() }),
  )
}
