import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import { SMC_RECURRENCE_OPTIONS, SOCIAL_PLATFORMS } from './catalog.js'
import * as conn from './connectionService.js'
import * as svc from './socialService.js'

const view = 'social.view'
const connect = 'social.connect'
const create = 'social.create'
const approve = 'social.approve'
const publish = 'social.publish'

function clientMeta(req: { ip: string; headers: Record<string, unknown> }) {
  return {
    ip: req.ip,
    userAgent: String(req.headers['user-agent'] || ''),
  }
}

function oauthRedirectResult(
  appUrl: string,
  result: Awaited<ReturnType<typeof conn.completePlatformOAuth>>,
) {
  if (result.autoConnected) {
    return `${appUrl}/sosyal-medya/hesaplar?oauth=ok&platform=${encodeURIComponent(result.autoConnected.platform)}&u=${encodeURIComponent(result.autoConnected.label)}`
  }
  const session = encodeURIComponent(result.sessionId || '')
  return `${appUrl}/sosyal-medya/hesaplar?oauth=select&platform=${encodeURIComponent(result.platform)}&session=${session}`
}

export async function socialRoutes(app: FastifyInstance) {
  app.get('/v1/social/health', { preHandler: [authenticate] }, async () => ({
    ok: true,
    ...svc.socialHealth(),
    platforms: SOCIAL_PLATFORMS,
    webhookConfigured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
  }))

  app.get(
    '/v1/social/meta/setup',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await svc.getMetaAppPublic(companyId)) }
    },
  )

  app.post(
    '/v1/social/meta/setup',
    { preHandler: [authenticate, requirePermission(connect)] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          appId: z.string().min(3),
          appSecret: z.string().min(8),
          redirectUri: z.string().url(),
        })
        .parse(req.body || {})
      return {
        ok: true,
        ...(await svc.saveMetaApp(companyId, body, req.auth?.sub)),
      }
    },
  )

  app.get(
    '/v1/social/overview',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await svc.overview(companyId)) }
    },
  )

  /** Multi-platform OAuth start (PKCE + CSRF state) */
  app.get(
    '/v1/social/oauth/start',
    {
      preHandler: [authenticate, requirePermission(connect)],
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (req) => {
      const companyId = requireTenant(req)
      const q = z
        .object({
          platform: z
            .enum(['instagram', 'facebook', 'messenger', 'whatsapp', 'all'])
            .default('instagram'),
        })
        .parse(req.query || {})
      return {
        ok: true,
        ...(await conn.startPlatformOAuth({
          companyId,
          userId: req.auth!.sub,
          platform: q.platform,
        })),
        setupRequired: false,
      }
    },
  )

  app.get('/v1/social/oauth/callback', async (req, reply) => {
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
      const result = await conn.completePlatformOAuth({
        code: q.code,
        state: q.state,
        ...clientMeta(req),
      })
      return reply.redirect(oauthRedirectResult(appUrl, result))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'oauth_failed'
      return reply.redirect(
        `${appUrl}/sosyal-medya/hesaplar?oauth=error&msg=${encodeURIComponent(msg)}`,
      )
    }
  })

  app.get(
    '/v1/social/instagram/oauth/start',
    {
      preHandler: [authenticate, requirePermission(connect)],
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (req) => {
      const companyId = requireTenant(req)
      return {
        ok: true,
        ...(await conn.startPlatformOAuth({
          companyId,
          userId: req.auth!.sub,
          platform: 'instagram',
        })),
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
      const result = await conn.completePlatformOAuth({
        code: q.code,
        state: q.state,
        ...clientMeta(req),
      })
      return reply.redirect(oauthRedirectResult(appUrl, result))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'oauth_failed'
      return reply.redirect(
        `${appUrl}/sosyal-medya/hesaplar?oauth=error&msg=${encodeURIComponent(msg)}`,
      )
    }
  })

  app.get(
    '/v1/social/connections',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = z.object({ platform: z.string().optional() }).parse(req.query || {})
      return { ok: true, connections: await conn.listConnections(companyId, q.platform) }
    },
  )

  app.get(
    '/v1/social/connections/pending',
    { preHandler: [authenticate, requirePermission(connect)] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = z.object({ sessionId: z.string().min(10) }).parse(req.query || {})
      return {
        ok: true,
        ...(await conn.getPendingCandidates({ companyId, sessionId: q.sessionId })),
      }
    },
  )

  app.post(
    '/v1/social/connections/select',
    {
      preHandler: [authenticate, requirePermission(connect)],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          sessionId: z.string().min(10),
          platform: z.enum(['instagram', 'facebook', 'messenger', 'whatsapp']),
          selection: z.record(z.string()),
        })
        .parse(req.body || {})
      return {
        ok: true,
        connection: await conn.confirmPlatformSelection({
          companyId,
          userId: req.auth!.sub,
          ...body,
          ...clientMeta(req),
        }),
      }
    },
  )

  app.post(
    '/v1/social/connections/whatsapp/manual',
    {
      preHandler: [authenticate, requirePermission(connect)],
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          phoneNumberId: z.string().min(3),
          wabaId: z.string().min(3),
          accessToken: z.string().min(10),
          displayPhone: z.string().optional(),
          verifiedName: z.string().optional(),
        })
        .parse(req.body || {})
      return {
        ok: true,
        connection: await conn.connectWhatsAppManual({
          companyId,
          userId: req.auth!.sub,
          ...body,
          ...clientMeta(req),
        }),
      }
    },
  )

  app.delete(
    '/v1/social/connections/:id',
    { preHandler: [authenticate, requirePermission(connect)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      await conn.disconnectConnection(companyId, id, req.auth?.sub, clientMeta(req))
      return { ok: true }
    },
  )

  app.post(
    '/v1/social/connections/:id/refresh',
    { preHandler: [authenticate, requirePermission(connect)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      return {
        ok: true,
        connection: await conn.refreshConnection(companyId, id, req.auth?.sub),
      }
    },
  )

  app.get(
    '/v1/social/connections/:id/resources/:kind',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id, kind } = z
        .object({
          id: z.string().uuid(),
          kind: z.enum([
            'profile',
            'media',
            'posts',
            'reels',
            'stories',
            'comments',
            'dm',
            'conversations',
          ]),
        })
        .parse(req.params)
      return {
        ok: true,
        data: await conn.getConnectionResources(companyId, id, kind),
      }
    },
  )

  app.get(
    '/v1/social/connection-logs',
    { preHandler: [authenticate, requirePermission(view)] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, logs: await conn.listConnectionLogs(companyId) }
    },
  )

  app.get('/v1/social/webhooks/meta', async (req, reply) => {
    const q = req.query as Record<string, string | undefined>
    const challenge = await conn.handleWebhookVerify(q)
    return reply.type('text/plain').send(challenge)
  })

  app.post('/v1/social/webhooks/meta', async (req) => {
    const raw = (req as { rawBody?: string }).rawBody || JSON.stringify(req.body || {})
    const signature = String(req.headers['x-hub-signature-256'] || '')
    const payload = (req.body || {}) as Record<string, unknown>
    const objectType = String(payload.object || 'page')
    const platform =
      objectType === 'instagram'
        ? 'instagram'
        : objectType === 'whatsapp_business_account'
          ? 'whatsapp'
          : objectType === 'page'
            ? 'facebook'
            : objectType
    return conn.handleWebhookEvent({ platform, rawBody: raw, signature, payload })
  })

  for (const platform of ['instagram', 'facebook', 'messenger', 'whatsapp'] as const) {
    app.get(`/v1/social/webhooks/${platform}`, async (req, reply) => {
      const challenge = await conn.handleWebhookVerify(
        req.query as Record<string, string | undefined>,
      )
      return reply.type('text/plain').send(challenge)
    })
    app.post(`/v1/social/webhooks/${platform}`, async (req) => {
      const raw = (req as { rawBody?: string }).rawBody || JSON.stringify(req.body || {})
      const signature = String(req.headers['x-hub-signature-256'] || '')
      return conn.handleWebhookEvent({
        platform,
        rawBody: raw,
        signature,
        payload: (req.body || {}) as Record<string, unknown>,
      })
    })
  }

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
      const queue = await svc.processQueueTick()
      const tokens = await conn.renewExpiringTokens()
      return { ok: true, ...queue, tokens }
    },
  )
}
