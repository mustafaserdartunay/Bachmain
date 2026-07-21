import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import { AppError } from '../../shared/errors.js'
import { randomBytes } from 'node:crypto'
import { SMC_RECURRENCE_OPTIONS } from './catalog.js'
import { buildOAuthUrl, signOAuthState, verifyOAuthState } from './metaGraph.js'
import * as svc from './socialService.js'

const view = 'social.view'
const connect = 'social.connect'
const create = 'social.create'
const approve = 'social.approve'
const publish = 'social.publish'

export async function socialRoutes(app: FastifyInstance) {
  app.get('/v1/social/health', { preHandler: [authenticate] }, async () => ({
    ok: true,
    ...svc.socialHealth(),
  }))

  app.get(
    '/v1/social/overview',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await svc.overview(companyId)) }
    },
  )

  app.get(
    '/v1/social/instagram/oauth/start',
    { preHandler: [authenticate, requirePermission(connect)] },
    async (req) => {
      const companyId = requireTenant(req)
      const creds = await svc.resolveMetaCredentials(companyId)
      const state = signOAuthState({
        cid: companyId,
        uid: req.auth!.sub,
        nonce: randomBytes(8).toString('hex'),
        appId: creds.appId,
      })
      return {
        ok: true,
        url: buildOAuthUrl(state, creds),
        state,
        setupRequired: false,
      }
    },
  )

  app.get('/v1/social/instagram/oauth/callback', async (req, reply) => {
    const q = z
      .object({
        code: z.string().optional(),
        state: z.string().optional(),
        error: z.string().optional(),
        error_description: z.string().optional(),
      })
      .parse(req.query || {})
    const appUrl = env.APP_URL || 'https://uygulama.bachmain.com'
    if (q.error || !q.code || !q.state) {
      return reply.redirect(
        `${appUrl}/sosyal-medya/hesaplar?oauth=error&msg=${encodeURIComponent(q.error_description || q.error || 'missing')}`,
      )
    }
    try {
      const st = verifyOAuthState(q.state)
      await svc.completeOAuth({ companyId: st.cid, userId: st.uid, code: q.code })
      return reply.redirect(`${appUrl}/sosyal-medya/hesaplar?oauth=ok`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'oauth_failed'
      return reply.redirect(
        `${appUrl}/sosyal-medya/hesaplar?oauth=error&msg=${encodeURIComponent(msg)}`,
      )
    }
  })

  app.get(
    '/v1/social/instagram/accounts',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, accounts: await svc.listAccounts(companyId) }
    },
  )

  app.delete(
    '/v1/social/instagram/accounts/:id',
    { preHandler: [authenticate, requirePermission(connect)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      await svc.disconnectAccount(companyId, id, req.auth?.sub)
      return { ok: true }
    },
  )

  app.post(
    '/v1/social/instagram/accounts/:id/refresh',
    { preHandler: [authenticate, requirePermission(connect)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      return { ok: true, account: await svc.refreshAccountToken(companyId, id) }
    },
  )

  app.post(
    '/v1/social/ai/generate',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          feature: z.enum(['post', 'carousel', 'story', 'reel', 'hashtags', 'alt', 'seo', 'full']),
          topic: z.string().min(2),
          tone: z.string().optional(),
          productId: z.string().optional(),
          brandKitId: z.string().uuid().optional(),
          pageCount: z.number().int().min(1).max(20).optional(),
        })
        .parse(req.body || {})
      return {
        ok: true,
        ...(await svc.generateAiPackage({ companyId, userId: req.auth?.sub, ...body })),
      }
    },
  )

  app.get(
    '/v1/social/content',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, items: await svc.listContent(companyId) }
    },
  )

  app.patch(
    '/v1/social/content/:id',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      const body = z
        .object({
          title: z.string().optional(),
          payload: z.record(z.unknown()).optional(),
          status: z.string().optional(),
          accountId: z.string().uuid().optional(),
        })
        .parse(req.body || {})
      return { ok: true, item: await svc.updateContent(companyId, id, body) }
    },
  )

  app.get(
    '/v1/social/templates',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, templates: await svc.listTemplates(companyId) }
    },
  )

  app.get(
    '/v1/social/brand-kits',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, kits: await svc.listBrandKits(companyId) }
    },
  )

  app.post(
    '/v1/social/brand-kits',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          id: z.string().uuid().optional(),
          name: z.string().min(1),
          logoUrl: z.string().optional(),
          colors: z.array(z.unknown()).optional(),
          fonts: z.array(z.unknown()).optional(),
          watermarkUrl: z.string().optional(),
          voice: z.string().optional(),
          rules: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
        .parse(req.body || {})
      return { ok: true, kit: await svc.upsertBrandKit(companyId, body) }
    },
  )

  app.get(
    '/v1/social/media',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, assets: await svc.listMedia(companyId) }
    },
  )

  app.post(
    '/v1/social/media',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          url: z.string().url(),
          folder: z.string().optional(),
          mime: z.string().optional(),
          tags: z.array(z.string()).optional(),
          productId: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, asset: await svc.addMedia(companyId, body) }
    },
  )

  app.get(
    '/v1/social/campaigns',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, campaigns: await svc.listCampaigns(companyId) }
    },
  )

  app.post(
    '/v1/social/campaigns',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ name: z.string().min(1) }).parse(req.body || {})
      return { ok: true, campaign: await svc.createCampaign(companyId, body.name) }
    },
  )

  app.get(
    '/v1/social/schedules',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return {
        ok: true,
        schedules: await svc.listSchedules(companyId),
        recurrenceOptions: SMC_RECURRENCE_OPTIONS,
      }
    },
  )

  app.post(
    '/v1/social/schedules',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          contentId: z.string().uuid(),
          recurrence: z.string(),
          runAt: z.string().optional(),
          recurrenceConfig: z.record(z.unknown()).optional(),
          timezone: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, schedule: await svc.createSchedule(companyId, body) }
    },
  )

  app.patch(
    '/v1/social/schedules/:id',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      const body = z
        .object({
          runAt: z.string().optional(),
          nextRunAt: z.string().optional(),
          recurrence: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, schedule: await svc.patchSchedule(companyId, id, body) }
    },
  )

  app.get(
    '/v1/social/approvals',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, approvals: await svc.listApprovals(companyId) }
    },
  )

  app.post(
    '/v1/social/approvals',
    { preHandler: [authenticate, requirePermission(create)] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ contentId: z.string().uuid() }).parse(req.body || {})
      return { ok: true, approval: await svc.requestApproval(companyId, body.contentId) }
    },
  )

  app.post(
    '/v1/social/approvals/:id/decide',
    { preHandler: [authenticate, requirePermission(approve)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      const body = z
        .object({ decision: z.enum(['approved', 'rejected']), note: z.string().optional() })
        .parse(req.body || {})
      return {
        ok: true,
        approval: await svc.decideApproval(companyId, id, body.decision, req.auth?.sub, body.note),
      }
    },
  )

  app.get(
    '/v1/social/queue',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, queue: await svc.listQueue(companyId) }
    },
  )

  app.post(
    '/v1/social/publish/:contentId',
    { preHandler: [authenticate, requirePermission(publish)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { contentId } = z.object({ contentId: z.string().uuid() }).parse(req.params)
      const body = z.object({ scheduledAt: z.string().optional() }).parse(req.body || {})
      const when = body.scheduledAt ? new Date(body.scheduledAt) : new Date()
      return { ok: true, job: await svc.enqueuePublish(companyId, contentId, when) }
    },
  )

  app.get(
    '/v1/social/notifications',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, notifications: await svc.listNotifications(companyId) }
    },
  )

  app.get(
    '/v1/social/analytics',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, snapshots: await svc.listAnalytics(companyId) }
    },
  )

  app.get(
    '/v1/social/audit',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, entries: await svc.listAudit(companyId) }
    },
  )

  app.post(
    '/v1/social/internal/tick',
    { preHandler: [authenticate, requirePermission(publish)] },
    async () => {
      return { ok: true, ...(await svc.processQueueTick()) }
    },
  )
}
