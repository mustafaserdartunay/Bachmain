import { and, desc, eq, isNull, lte, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  smcAnalyticsSnapshots,
  smcApprovals,
  smcAuditLog,
  smcBrandKits,
  smcCampaigns,
  smcContentItems,
  smcContentVersions,
  smcInstagramAccounts,
  smcMediaAssets,
  smcNotifications,
  smcPublishQueue,
  smcSchedules,
  smcTemplates,
  smcMetaApps,
} from '../../db/schema/index.js'
import { decryptSecret, encryptSecret } from '../../shared/crypto.js'
import { AppError } from '../../shared/errors.js'
import { gatewayChat } from '../aios/gateway.js'
import { SMC_TEMPLATE_SEEDS } from './catalog.js'
import { accountStatusFromExpiry, computeNextRunAt } from './recurrence.js'
import {
  discoverInstagramBusiness,
  exchangeCodeForToken,
  exchangeLongLived,
  metaConfigured,
  platformMetaCredentials,
  publishCarousel,
  publishImagePost,
  publishReel,
  type MetaCredentials,
} from './metaGraph.js'

function publicAccount(row: typeof smcInstagramAccounts.$inferSelect) {
  const status = accountStatusFromExpiry(row.tokenExpiresAt)
  return {
    id: row.id,
    igUserId: row.igUserId,
    pageId: row.pageId,
    username: row.username,
    displayName: row.displayName,
    status:
      status === 'live'
        ? 'live'
        : status === 'expiring'
          ? 'expiring'
          : row.status === 'error'
            ? 'error'
            : status,
    tokenExpiresAt: row.tokenExpiresAt,
    scopes: row.scopes,
    createdAt: row.createdAt,
  }
}

export function socialHealth() {
  const platform = platformMetaCredentials()
  return {
    metaConfigured: metaConfigured(platform),
    platformMetaConfigured: metaConfigured(platform),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    graphVersion: process.env.META_GRAPH_VERSION || 'v21.0',
    redirectUriHint:
      platform.redirectUri ||
      `${process.env.API_PUBLIC_URL || 'https://api.bachmain.com'}/v1/social/instagram/oauth/callback`,
    setupPath: '/sosyal-medya/meta-kurulum',
  }
}

async function audit(
  companyId: string,
  action: string,
  opts: {
    entityType?: string
    entityId?: string
    actorUserId?: string
    payload?: Record<string, unknown>
  } = {},
) {
  await db.insert(smcAuditLog).values({
    companyId,
    action,
    entityType: opts.entityType,
    entityId: opts.entityId,
    actorUserId: opts.actorUserId,
    payload: opts.payload || {},
  })
}

async function notify(
  companyId: string,
  kind: string,
  title: string,
  body?: string,
  meta: Record<string, unknown> = {},
) {
  await db.insert(smcNotifications).values({ companyId, kind, title, body, meta })
}

export async function resolveMetaCredentials(companyId: string): Promise<MetaCredentials> {
  const [row] = await db
    .select()
    .from(smcMetaApps)
    .where(and(eq(smcMetaApps.companyId, companyId), isNull(smcMetaApps.deletedAt)))
    .limit(1)
  if (row) {
    return {
      appId: row.appId,
      appSecret: decryptSecret(row.appSecretCiphertext),
      redirectUri: row.redirectUri,
    }
  }
  const platform = platformMetaCredentials()
  if (!metaConfigured(platform)) {
    throw new AppError(
      'META_NOT_CONFIGURED',
      'Meta App ayarları eksik — /sosyal-medya/meta-kurulum',
      503,
    )
  }
  return platform
}

export async function getMetaAppPublic(companyId: string) {
  const platform = platformMetaCredentials()
  const [row] = await db
    .select()
    .from(smcMetaApps)
    .where(and(eq(smcMetaApps.companyId, companyId), isNull(smcMetaApps.deletedAt)))
    .limit(1)
  return {
    ...socialHealth(),
    tenantConfigured: Boolean(row),
    tenantAppId: row?.appId || null,
    tenantRedirectUri: row?.redirectUri || null,
    ready: Boolean(row) || metaConfigured(platform),
  }
}

export async function saveMetaApp(
  companyId: string,
  data: { appId: string; appSecret: string; redirectUri: string },
  userId?: string,
) {
  const ciphertext = encryptSecret(data.appSecret)
  const existing = await db
    .select()
    .from(smcMetaApps)
    .where(and(eq(smcMetaApps.companyId, companyId), isNull(smcMetaApps.deletedAt)))
    .limit(1)
  let id: string
  if (existing[0]) {
    await db
      .update(smcMetaApps)
      .set({
        appId: data.appId,
        appSecretCiphertext: ciphertext,
        redirectUri: data.redirectUri,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(smcMetaApps.id, existing[0].id))
    id = existing[0].id
  } else {
    const [row] = await db
      .insert(smcMetaApps)
      .values({
        companyId,
        appId: data.appId,
        appSecretCiphertext: ciphertext,
        redirectUri: data.redirectUri,
      })
      .returning()
    id = row.id
  }
  await audit(companyId, 'meta.app.save', {
    entityType: 'meta_app',
    entityId: id,
    actorUserId: userId,
  })
  return getMetaAppPublic(companyId)
}

export async function listAccounts(companyId: string) {
  const rows = await db
    .select()
    .from(smcInstagramAccounts)
    .where(
      and(eq(smcInstagramAccounts.companyId, companyId), isNull(smcInstagramAccounts.deletedAt)),
    )
  return rows.map(publicAccount)
}

export async function completeOAuth(opts: { companyId: string; userId: string; code: string }) {
  const creds = await resolveMetaCredentials(opts.companyId)
  const short = await exchangeCodeForToken(opts.code, creds)
  const longLived = await exchangeLongLived(short.access_token, creds)
  const discovered = await discoverInstagramBusiness(longLived.access_token)
  const expiresAt = longLived.expires_in
    ? new Date(Date.now() + longLived.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  const ciphertext = encryptSecret(discovered.pageToken)
  const existing = await db
    .select()
    .from(smcInstagramAccounts)
    .where(
      and(
        eq(smcInstagramAccounts.companyId, opts.companyId),
        eq(smcInstagramAccounts.igUserId, discovered.igUserId),
        isNull(smcInstagramAccounts.deletedAt),
      ),
    )
    .limit(1)

  let id: string
  if (existing[0]) {
    await db
      .update(smcInstagramAccounts)
      .set({
        pageId: discovered.pageId,
        username: discovered.username,
        displayName: discovered.displayName,
        tokenCiphertext: ciphertext,
        tokenExpiresAt: expiresAt,
        status: 'live',
        updatedAt: new Date(),
      })
      .where(eq(smcInstagramAccounts.id, existing[0].id))
    id = existing[0].id
  } else {
    const [row] = await db
      .insert(smcInstagramAccounts)
      .values({
        companyId: opts.companyId,
        igUserId: discovered.igUserId,
        pageId: discovered.pageId,
        username: discovered.username,
        displayName: discovered.displayName,
        tokenCiphertext: ciphertext,
        tokenExpiresAt: expiresAt,
        status: 'live',
        scopes: META_SCOPES_ARR,
      })
      .returning()
    id = row.id
  }
  await audit(opts.companyId, 'instagram.connect', {
    entityType: 'account',
    entityId: id,
    actorUserId: opts.userId,
    payload: { username: discovered.username },
  })
  await notify(opts.companyId, 'account_connected', 'Instagram bağlandı', `@${discovered.username}`)
  return { id, username: discovered.username }
}

const META_SCOPES_ARR = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
]

export async function disconnectAccount(companyId: string, accountId: string, userId?: string) {
  await db
    .update(smcInstagramAccounts)
    .set({ deletedAt: new Date(), status: 'error', updatedAt: new Date() })
    .where(
      and(eq(smcInstagramAccounts.id, accountId), eq(smcInstagramAccounts.companyId, companyId)),
    )
  await audit(companyId, 'instagram.disconnect', {
    entityType: 'account',
    entityId: accountId,
    actorUserId: userId,
  })
}

export async function refreshAccountToken(companyId: string, accountId: string) {
  const [row] = await db
    .select()
    .from(smcInstagramAccounts)
    .where(
      and(eq(smcInstagramAccounts.id, accountId), eq(smcInstagramAccounts.companyId, companyId)),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Hesap bulunamadı', 404)
  const token = decryptSecret(row.tokenCiphertext)
  const creds = await resolveMetaCredentials(companyId)
  const longLived = await exchangeLongLived(token, creds)
  const expiresAt = longLived.expires_in
    ? new Date(Date.now() + longLived.expires_in * 1000)
    : row.tokenExpiresAt
  await db
    .update(smcInstagramAccounts)
    .set({
      tokenCiphertext: encryptSecret(longLived.access_token),
      tokenExpiresAt: expiresAt,
      status: 'live',
      updatedAt: new Date(),
    })
    .where(eq(smcInstagramAccounts.id, accountId))
  await audit(companyId, 'instagram.refresh', { entityType: 'account', entityId: accountId })
  return publicAccount({ ...row, tokenExpiresAt: expiresAt, status: 'live' })
}

export async function generateAiPackage(opts: {
  companyId: string
  userId?: string
  feature: string
  topic: string
  tone?: string
  productId?: string
  brandKitId?: string
  pageCount?: number
}) {
  let brandHint = ''
  if (opts.brandKitId) {
    const [kit] = await db
      .select()
      .from(smcBrandKits)
      .where(and(eq(smcBrandKits.id, opts.brandKitId), eq(smcBrandKits.companyId, opts.companyId)))
      .limit(1)
    if (kit) brandHint = `Marka: ${kit.name}. Ton: ${kit.voice || ''}. Kurallar: ${kit.rules || ''}`
  }
  const pages = Math.min(20, Math.max(1, opts.pageCount || 5))
  const prompt = `Instagram ${opts.feature} içeriği üret. JSON döndür.
Konu: ${opts.topic}
Ton: ${opts.tone || 'profesyonel samimi'}
${brandHint}
Sayfa sayısı (carousel ise): ${pages}

Şema:
{
  "caption": "...",
  "hashtags": ["#a"],
  "altText": "...",
  "cta": "...",
  "seo": "...",
  "emoji": "...",
  "hook": "...",
  "scenes": [{"t":"0-3","shot":"...","voice":"..."}],
  "slides": [{"title":"...","body":"...","visual":"...","cta":"..."}],
  "storyIdeas": [{"type":"poll|question|countdown|announce","text":"..."}],
  "musicHint": "...",
  "imagePrompt": "..."
}`
  const result = await gatewayChat({
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Sen BachMain Instagram Content Studio asistanısın. Yalnızca geçerli JSON üret.',
      },
      { role: 'user', content: prompt },
    ],
  })
  let parsed: Record<string, unknown> = {}
  try {
    const m = result.content.match(/\{[\s\S]*\}/)
    parsed = m ? JSON.parse(m[0]) : { caption: result.content }
  } catch {
    parsed = { caption: result.content }
  }
  const [content] = await db
    .insert(smcContentItems)
    .values({
      companyId: opts.companyId,
      type: opts.feature,
      title: opts.topic.slice(0, 120),
      payload: { ...parsed, topic: opts.topic, tone: opts.tone, productId: opts.productId },
      status: 'draft',
      brandKitId: opts.brandKitId,
      productId: opts.productId,
      createdBy: opts.userId,
    })
    .returning()
  await db.insert(smcContentVersions).values({
    companyId: opts.companyId,
    contentId: content.id,
    payload: content.payload as Record<string, unknown>,
    source: 'ai',
    actorUserId: opts.userId,
  })
  await audit(opts.companyId, 'content.generate', {
    entityType: 'content',
    entityId: content.id,
    actorUserId: opts.userId,
    payload: { feature: opts.feature },
  })
  return { content, usage: result, stub: result.stub }
}

export async function listContent(companyId: string) {
  return db
    .select()
    .from(smcContentItems)
    .where(and(eq(smcContentItems.companyId, companyId), isNull(smcContentItems.deletedAt)))
    .orderBy(desc(smcContentItems.createdAt))
    .limit(200)
}

export async function updateContent(
  companyId: string,
  id: string,
  patch: Partial<{
    title: string
    payload: Record<string, unknown>
    status: string
    accountId: string
  }>,
) {
  const [row] = await db
    .update(smcContentItems)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(smcContentItems.id, id), eq(smcContentItems.companyId, companyId)))
    .returning()
  return row
}

export async function ensureSystemTemplates() {
  for (const t of SMC_TEMPLATE_SEEDS) {
    const existing = await db
      .select()
      .from(smcTemplates)
      .where(eq(smcTemplates.slug, t.slug))
      .limit(1)
    if (existing[0]) continue
    await db.insert(smcTemplates).values({
      slug: t.slug,
      title: t.title,
      category: t.category,
      isSystem: true,
      payload: { promptHint: t.title },
    })
  }
}

export async function listTemplates(companyId: string) {
  await ensureSystemTemplates()
  return db
    .select()
    .from(smcTemplates)
    .where(sql`${smcTemplates.companyId} IS NULL OR ${smcTemplates.companyId} = ${companyId}`)
}

export async function listBrandKits(companyId: string) {
  return db
    .select()
    .from(smcBrandKits)
    .where(and(eq(smcBrandKits.companyId, companyId), isNull(smcBrandKits.deletedAt)))
}

export async function upsertBrandKit(
  companyId: string,
  data: {
    id?: string
    name: string
    logoUrl?: string
    colors?: unknown[]
    fonts?: unknown[]
    watermarkUrl?: string
    voice?: string
    rules?: string
    isDefault?: boolean
  },
) {
  if (data.id) {
    const [row] = await db
      .update(smcBrandKits)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(smcBrandKits.id, data.id), eq(smcBrandKits.companyId, companyId)))
      .returning()
    return row
  }
  const [row] = await db
    .insert(smcBrandKits)
    .values({
      companyId,
      name: data.name,
      logoUrl: data.logoUrl,
      colors: data.colors || [],
      fonts: data.fonts || [],
      watermarkUrl: data.watermarkUrl,
      voice: data.voice,
      rules: data.rules,
      isDefault: data.isDefault || false,
    })
    .returning()
  return row
}

export async function listMedia(companyId: string) {
  return db
    .select()
    .from(smcMediaAssets)
    .where(and(eq(smcMediaAssets.companyId, companyId), isNull(smcMediaAssets.deletedAt)))
    .orderBy(desc(smcMediaAssets.createdAt))
    .limit(500)
}

export async function addMedia(
  companyId: string,
  data: {
    name: string
    url: string
    folder?: string
    mime?: string
    tags?: string[]
    productId?: string
  },
) {
  const [row] = await db
    .insert(smcMediaAssets)
    .values({
      companyId,
      name: data.name,
      url: data.url,
      folder: data.folder || '/',
      mime: data.mime,
      tags: data.tags || [],
      productId: data.productId,
    })
    .returning()
  return row
}

export async function listCampaigns(companyId: string) {
  return db
    .select()
    .from(smcCampaigns)
    .where(and(eq(smcCampaigns.companyId, companyId), isNull(smcCampaigns.deletedAt)))
}

export async function createCampaign(companyId: string, name: string) {
  const [row] = await db.insert(smcCampaigns).values({ companyId, name }).returning()
  return row
}

export async function createSchedule(
  companyId: string,
  data: {
    contentId: string
    recurrence: string
    runAt?: string
    recurrenceConfig?: Record<string, unknown>
    timezone?: string
  },
) {
  const runAt = data.runAt ? new Date(data.runAt) : new Date()
  const next =
    data.recurrence === 'once'
      ? runAt
      : computeNextRunAt(data.recurrence, runAt, data.recurrenceConfig || {}) || runAt
  const [row] = await db
    .insert(smcSchedules)
    .values({
      companyId,
      contentId: data.contentId,
      recurrence: data.recurrence,
      recurrenceConfig: data.recurrenceConfig || {},
      runAt,
      nextRunAt: next,
      timezone: data.timezone || 'Europe/Istanbul',
    })
    .returning()
  await db
    .update(smcContentItems)
    .set({ status: 'scheduled', updatedAt: new Date() })
    .where(eq(smcContentItems.id, data.contentId))
  return row
}

export async function listSchedules(companyId: string) {
  return db
    .select()
    .from(smcSchedules)
    .where(and(eq(smcSchedules.companyId, companyId), isNull(smcSchedules.deletedAt)))
}

export async function patchSchedule(
  companyId: string,
  id: string,
  patch: { runAt?: string; nextRunAt?: string; recurrence?: string },
) {
  const [row] = await db
    .update(smcSchedules)
    .set({
      runAt: patch.runAt ? new Date(patch.runAt) : undefined,
      nextRunAt: patch.nextRunAt ? new Date(patch.nextRunAt) : undefined,
      recurrence: patch.recurrence,
      updatedAt: new Date(),
    })
    .where(and(eq(smcSchedules.id, id), eq(smcSchedules.companyId, companyId)))
    .returning()
  return row
}

export async function requestApproval(companyId: string, contentId: string) {
  await updateContent(companyId, contentId, { status: 'pending_approval' })
  const [row] = await db
    .insert(smcApprovals)
    .values({ companyId, contentId, decision: 'pending' })
    .returning()
  await notify(companyId, 'approval_pending', 'Onay bekleyen içerik', contentId)
  return row
}

export async function decideApproval(
  companyId: string,
  approvalId: string,
  decision: 'approved' | 'rejected',
  reviewerUserId?: string,
  note?: string,
) {
  const [row] = await db
    .update(smcApprovals)
    .set({ decision, reviewerUserId, note, updatedAt: new Date() })
    .where(and(eq(smcApprovals.id, approvalId), eq(smcApprovals.companyId, companyId)))
    .returning()
  if (row) {
    await updateContent(companyId, row.contentId, {
      status: decision === 'approved' ? 'approved' : 'draft',
    })
    await audit(companyId, `content.${decision}`, {
      entityType: 'content',
      entityId: row.contentId,
      actorUserId: reviewerUserId,
    })
  }
  return row
}

export async function listApprovals(companyId: string) {
  return db
    .select()
    .from(smcApprovals)
    .where(and(eq(smcApprovals.companyId, companyId), isNull(smcApprovals.deletedAt)))
    .orderBy(desc(smcApprovals.createdAt))
}

export async function enqueuePublish(
  companyId: string,
  contentId: string,
  scheduledAt = new Date(),
) {
  const [content] = await db
    .select()
    .from(smcContentItems)
    .where(and(eq(smcContentItems.id, contentId), eq(smcContentItems.companyId, companyId)))
    .limit(1)
  if (!content) throw new AppError('NOT_FOUND', 'İçerik yok', 404)
  const [row] = await db
    .insert(smcPublishQueue)
    .values({
      companyId,
      contentId,
      accountId: content.accountId,
      scheduledAt,
      status: 'pending',
    })
    .returning()
  await notify(companyId, 'publish_queued', 'Paylaşım kuyruğa alındı', contentId)
  return row
}

export async function listQueue(companyId: string) {
  return db
    .select()
    .from(smcPublishQueue)
    .where(and(eq(smcPublishQueue.companyId, companyId), isNull(smcPublishQueue.deletedAt)))
    .orderBy(desc(smcPublishQueue.scheduledAt))
    .limit(200)
}

export async function listNotifications(companyId: string) {
  return db
    .select()
    .from(smcNotifications)
    .where(and(eq(smcNotifications.companyId, companyId), isNull(smcNotifications.deletedAt)))
    .orderBy(desc(smcNotifications.createdAt))
    .limit(100)
}

export async function listAnalytics(companyId: string) {
  return db
    .select()
    .from(smcAnalyticsSnapshots)
    .where(eq(smcAnalyticsSnapshots.companyId, companyId))
    .orderBy(desc(smcAnalyticsSnapshots.capturedAt))
    .limit(100)
}

export async function listAudit(companyId: string) {
  return db
    .select()
    .from(smcAuditLog)
    .where(eq(smcAuditLog.companyId, companyId))
    .orderBy(desc(smcAuditLog.createdAt))
    .limit(200)
}

export async function overview(companyId: string) {
  const [accounts, content, queue, pending] = await Promise.all([
    listAccounts(companyId),
    listContent(companyId),
    listQueue(companyId),
    listApprovals(companyId),
  ])
  return {
    accounts: accounts.length,
    content: content.length,
    published: content.filter((c) => c.status === 'published').length,
    queuePending: queue.filter((q) => q.status === 'pending').length,
    approvalsPending: pending.filter((a) => a.decision === 'pending').length,
    health: socialHealth(),
  }
}

async function getAccountToken(companyId: string, accountId: string | null | undefined) {
  if (!accountId) {
    const accounts = await listAccounts(companyId)
    if (!accounts[0]) throw new AppError('NO_ACCOUNT', 'Instagram hesabı bağlayın', 400)
    accountId = accounts[0].id
  }
  const [row] = await db
    .select()
    .from(smcInstagramAccounts)
    .where(
      and(eq(smcInstagramAccounts.id, accountId), eq(smcInstagramAccounts.companyId, companyId)),
    )
    .limit(1)
  if (!row) throw new AppError('NO_ACCOUNT', 'Hesap bulunamadı', 404)
  return { row, token: decryptSecret(row.tokenCiphertext) }
}

export async function processQueueTick(limit = 10) {
  const now = new Date()
  const due = await db
    .select()
    .from(smcPublishQueue)
    .where(and(eq(smcPublishQueue.status, 'pending'), lte(smcPublishQueue.scheduledAt, now)))
    .limit(limit)

  const results: Array<{ id: string; ok: boolean; error?: string }> = []
  for (const job of due) {
    try {
      await db
        .update(smcPublishQueue)
        .set({ status: 'processing', attempts: (job.attempts || 0) + 1, updatedAt: new Date() })
        .where(eq(smcPublishQueue.id, job.id))

      const [content] = await db
        .select()
        .from(smcContentItems)
        .where(eq(smcContentItems.id, job.contentId))
        .limit(1)
      if (!content) throw new Error('content missing')

      const { row: account, token } = await getAccountToken(
        job.companyId,
        job.accountId || content.accountId,
      )
      const payload = (content.payload || {}) as Record<string, unknown>
      const caption = String(payload.caption || content.title || '')
      const imageUrl = String(payload.imageUrl || payload.coverUrl || '')
      const videoUrl = String(payload.videoUrl || '')
      const slides = (payload.slides as Array<{ imageUrl?: string }> | undefined) || []

      let published: { containerId: string; publishId: string }
      if (content.type === 'carousel' && slides.length) {
        const urls = slides.map((s) => s.imageUrl).filter(Boolean) as string[]
        if (!urls.length) throw new Error('Carousel image URL gerekli (public)')
        published = await publishCarousel({
          igUserId: account.igUserId,
          token,
          imageUrls: urls,
          caption,
        })
      } else if (content.type === 'reel') {
        if (!videoUrl) throw new Error('Reel video_url (public) gerekli')
        published = await publishReel({
          igUserId: account.igUserId,
          token,
          videoUrl,
          caption,
          coverUrl: imageUrl || undefined,
        })
      } else {
        if (!imageUrl) throw new Error('imageUrl (public HTTPS) gerekli')
        published = await publishImagePost({
          igUserId: account.igUserId,
          token,
          imageUrl,
          caption,
        })
      }

      await db
        .update(smcPublishQueue)
        .set({
          status: 'published',
          externalMediaId: published.containerId,
          externalPublishId: published.publishId,
          updatedAt: new Date(),
        })
        .where(eq(smcPublishQueue.id, job.id))
      await updateContent(job.companyId, job.contentId, { status: 'published' })
      await notify(job.companyId, 'publish_success', 'Paylaşım başarılı', published.publishId)
      await audit(job.companyId, 'content.published', {
        entityType: 'content',
        entityId: job.contentId,
        payload: published,
      })
      results.push({ id: job.id, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'publish failed'
      const attempts = (job.attempts || 0) + 1
      await db
        .update(smcPublishQueue)
        .set({
          status: attempts >= 3 ? 'failed' : 'pending',
          lastError: message,
          scheduledAt:
            attempts >= 3 ? job.scheduledAt : new Date(Date.now() + attempts * 5 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(smcPublishQueue.id, job.id))
      await notify(job.companyId, 'publish_failed', 'Paylaşım başarısız', message)
      results.push({ id: job.id, ok: false, error: message })
    }
  }
  return { processed: results.length, results }
}

export async function generateReelMedia(opts: {
  companyId: string
  userId?: string
  prompt: string
  contentId?: string
}) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new AppError('AI_NOT_CONFIGURED', 'OPENAI_API_KEY gerekli', 503)

  const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Instagram Reels kapak görseli, dikey 9:16 kompozisyon, marka kalitesi: ${opts.prompt}`,
      size: '1024x1792',
      quality: 'standard',
      n: 1,
    }),
  })
  const imageData = (await imageRes.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>
    error?: { message?: string }
  }
  if (!imageRes.ok) {
    throw new AppError('IMAGE_GEN_FAILED', imageData.error?.message || 'Görsel üretilemedi', 502)
  }
  const coverUrl = imageData.data?.[0]?.url
  if (!coverUrl) throw new AppError('IMAGE_GEN_FAILED', 'Görsel URL yok', 502)

  // Scene stills (2 extra)
  const scenes: Array<{ label: string; url: string }> = [{ label: 'Kapak', url: coverUrl }]
  for (const label of ['Sahne 2', 'Sahne 3']) {
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${label} — Instagram Reels sahnesi, dikey: ${opts.prompt}`,
          size: '1024x1792',
          n: 1,
        }),
      })
      const d = (await r.json()) as { data?: Array<{ url?: string }> }
      if (r.ok && d.data?.[0]?.url) scenes.push({ label, url: d.data[0].url })
    } catch {
      /* optional scenes */
    }
  }

  const asset = await addMedia(opts.companyId, {
    name: `Reel kapak · ${opts.prompt.slice(0, 40)}`,
    url: coverUrl,
    folder: '/reels',
    mime: 'image/png',
    tags: ['reel', 'ai', 'cover'],
  })

  if (opts.contentId) {
    const [content] = await db
      .select()
      .from(smcContentItems)
      .where(
        and(eq(smcContentItems.id, opts.contentId), eq(smcContentItems.companyId, opts.companyId)),
      )
      .limit(1)
    if (content) {
      const payload = {
        ...(content.payload as Record<string, unknown>),
        coverUrl,
        scenes,
        imageUrl: coverUrl,
      }
      await updateContent(opts.companyId, opts.contentId, { payload })
    }
  }

  await audit(opts.companyId, 'content.reel_media', {
    entityType: 'media',
    entityId: asset.id,
    actorUserId: opts.userId,
  })

  return {
    coverUrl,
    scenes,
    asset,
    videoNote:
      'Video: kapak + sahneler hazır. Graph Reels için public MP4 video_url ekleyin veya sonraki adımda video render kullanın.',
  }
}
