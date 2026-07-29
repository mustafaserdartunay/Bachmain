import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  companies,
  smcConnectionLogs,
  smcInstagramAccounts,
  smcOauthStates,
  smcSocialConnections,
  smcWebhookEvents,
  users,
} from '../../db/schema/index.js'
import { decryptSecret, encryptSecret } from '../../shared/crypto.js'
import { AppError } from '../../shared/errors.js'
import { notifyUser } from '../notifications/notificationService.js'
import {
  META_CONTENT_SCOPES,
  META_PLATFORM_SCOPES,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from './catalog.js'
import {
  debugToken,
  exchangeCodeForToken,
  exchangeLongLived,
  generatePkcePair,
  getInstagramProfile,
  listFacebookPages,
  listInstagramComments,
  listInstagramConversations,
  listInstagramMedia,
  listInstagramStories,
  listWhatsAppBusinessAccounts,
  buildOAuthUrl,
  signOAuthState,
  verifyOAuthState,
  verifyWebhookChallenge,
  verifyWebhookSignature,
  webhookAppSecret,
  type MetaCredentials,
} from './metaGraph.js'
import {
  resolveMetaCredentials,
  getMetaAppPublic,
  saveMetaApp,
  socialHealth,
} from './socialService.js'
import { accountStatusFromExpiry } from './recurrence.js'

const OAUTH_TTL_MS = 15 * 60 * 1000

function parseUa(ua: string) {
  const s = ua || ''
  const os = /Windows/i.test(s)
    ? 'Windows'
    : /Mac OS|Macintosh/i.test(s)
      ? 'macOS'
      : /Android/i.test(s)
        ? 'Android'
        : /iPhone|iPad/i.test(s)
          ? 'iOS'
          : /Linux/i.test(s)
            ? 'Linux'
            : 'Unknown'
  const browser = /Edg\//i.test(s)
    ? 'Edge'
    : /Chrome\//i.test(s)
      ? 'Chrome'
      : /Firefox\//i.test(s)
        ? 'Firefox'
        : /Safari\//i.test(s)
          ? 'Safari'
          : 'Unknown'
  const device = /Mobile|Android|iPhone/i.test(s) ? 'mobile' : 'desktop'
  return { os, browser, device }
}

export async function writeConnectionLog(opts: {
  companyId: string
  connectionId?: string | null
  userId?: string | null
  platform: string
  action: string
  success?: boolean
  ip?: string | null
  userAgent?: string | null
  message?: string
  meta?: Record<string, unknown>
}) {
  const ua = opts.userAgent || ''
  const parsed = parseUa(ua)
  await db.insert(smcConnectionLogs).values({
    companyId: opts.companyId,
    connectionId: opts.connectionId || null,
    userId: opts.userId || null,
    platform: opts.platform,
    action: opts.action,
    success: opts.success !== false,
    ip: opts.ip || null,
    userAgent: ua || null,
    device: parsed.device,
    os: parsed.os,
    browser: parsed.browser,
    message: opts.message || null,
    meta: opts.meta || {},
  })
}

function publicConnection(row: typeof smcSocialConnections.$inferSelect) {
  const tokenStatus = accountStatusFromExpiry(row.tokenExpiresAt)
  return {
    id: row.id,
    platform: row.platform,
    externalId: row.externalId,
    parentExternalId: row.parentExternalId,
    displayName: row.displayName,
    username: row.username,
    phoneNumber: row.phoneNumber,
    status: row.status,
    scopes: row.scopes || [],
    tokenExpiresAt: row.tokenExpiresAt,
    tokenStatus:
      tokenStatus === 'live'
        ? 'valid'
        : tokenStatus === 'expiring'
          ? 'expiring'
          : row.status === 'revoked'
            ? 'revoked'
            : 'expired',
    lastSyncAt: row.lastSyncAt,
    lastError: row.lastError,
    connectedBy: row.connectedBy,
    connectedAt: row.connectedAt,
    meta: sanitizeMeta(row.meta || {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function sanitizeMeta(meta: Record<string, unknown>) {
  const copy = { ...meta }
  delete copy.userToken
  delete copy.pageToken
  delete copy.accessToken
  return copy
}

async function upsertConnection(opts: {
  companyId: string
  platform: string
  externalId: string
  parentExternalId?: string | null
  displayName?: string | null
  username?: string | null
  phoneNumber?: string | null
  token: string
  refreshToken?: string | null
  tokenExpiresAt?: Date | null
  scopes?: string[]
  connectedBy?: string | null
  meta?: Record<string, unknown>
}) {
  const ciphertext = encryptSecret(opts.token)
  const refreshCipher = opts.refreshToken ? encryptSecret(opts.refreshToken) : null
  const existing = await db
    .select()
    .from(smcSocialConnections)
    .where(
      and(
        eq(smcSocialConnections.companyId, opts.companyId),
        eq(smcSocialConnections.platform, opts.platform),
        eq(smcSocialConnections.externalId, opts.externalId),
        isNull(smcSocialConnections.deletedAt),
      ),
    )
    .limit(1)

  const values = {
    parentExternalId: opts.parentExternalId || null,
    displayName: opts.displayName || null,
    username: opts.username || null,
    phoneNumber: opts.phoneNumber || null,
    tokenCiphertext: ciphertext,
    refreshTokenCiphertext: refreshCipher,
    tokenExpiresAt: opts.tokenExpiresAt || null,
    scopes: opts.scopes || [],
    status: 'connected',
    lastSyncAt: new Date(),
    lastError: null as string | null,
    connectedBy: opts.connectedBy || null,
    connectedAt: new Date(),
    meta: opts.meta || {},
    updatedAt: new Date(),
    deletedAt: null as Date | null,
  }

  if (existing[0]) {
    await db
      .update(smcSocialConnections)
      .set(values)
      .where(eq(smcSocialConnections.id, existing[0].id))
    return existing[0].id
  }
  const [row] = await db
    .insert(smcSocialConnections)
    .values({
      companyId: opts.companyId,
      platform: opts.platform,
      externalId: opts.externalId,
      ...values,
    })
    .returning()
  return row.id
}

/** Mirror IG connection into legacy smc_instagram_accounts for Content Studio */
async function mirrorInstagramAccount(opts: {
  companyId: string
  igUserId: string
  pageId: string
  username: string
  displayName: string
  pageToken: string
  expiresAt: Date | null
  scopes: string[]
}) {
  const ciphertext = encryptSecret(opts.pageToken)
  const existing = await db
    .select()
    .from(smcInstagramAccounts)
    .where(
      and(
        eq(smcInstagramAccounts.companyId, opts.companyId),
        eq(smcInstagramAccounts.igUserId, opts.igUserId),
        isNull(smcInstagramAccounts.deletedAt),
      ),
    )
    .limit(1)
  if (existing[0]) {
    await db
      .update(smcInstagramAccounts)
      .set({
        pageId: opts.pageId,
        username: opts.username,
        displayName: opts.displayName,
        tokenCiphertext: ciphertext,
        tokenExpiresAt: opts.expiresAt,
        status: 'live',
        scopes: opts.scopes,
        updatedAt: new Date(),
      })
      .where(eq(smcInstagramAccounts.id, existing[0].id))
    return existing[0].id
  }
  const [row] = await db
    .insert(smcInstagramAccounts)
    .values({
      companyId: opts.companyId,
      igUserId: opts.igUserId,
      pageId: opts.pageId,
      username: opts.username,
      displayName: opts.displayName,
      tokenCiphertext: ciphertext,
      tokenExpiresAt: opts.expiresAt,
      status: 'live',
      scopes: opts.scopes,
    })
    .returning()
  return row.id
}

export async function startPlatformOAuth(opts: {
  companyId: string
  userId: string
  platform: SocialPlatform | string
  redirectUriOverride?: string
}) {
  const platform = String(opts.platform || 'instagram').toLowerCase()
  if (
    !SOCIAL_PLATFORMS.includes(platform as (typeof SOCIAL_PLATFORMS)[number]) &&
    platform !== 'all'
  ) {
    throw new AppError('INVALID_PLATFORM', 'Geçersiz platform', 400)
  }
  const creds = await resolveMetaCredentials(opts.companyId)
  if (opts.redirectUriOverride) creds.redirectUri = opts.redirectUriOverride

  const { codeVerifier, codeChallenge } = generatePkcePair()
  const nonce = randomNonce()
  const scopes =
    platform === 'all'
      ? [...META_PLATFORM_SCOPES.all]
      : [...(META_PLATFORM_SCOPES[platform as SocialPlatform] || META_PLATFORM_SCOPES.instagram)]

  await db.insert(smcOauthStates).values({
    companyId: opts.companyId,
    userId: opts.userId,
    platform,
    stateNonce: nonce,
    codeVerifier,
    redirectUri: creds.redirectUri,
    scopes,
    expiresAt: new Date(Date.now() + OAUTH_TTL_MS),
    meta: {},
  })

  const state = signOAuthState({
    cid: opts.companyId,
    uid: opts.userId,
    nonce,
    appId: creds.appId,
    platform,
    pkce: 'S256',
  })

  const url = buildOAuthUrl(state, creds, {
    scopes,
    codeChallenge,
    platform: platform === 'all' ? 'instagram' : platform,
  })

  return { url, state, platform, scopes, expiresInSec: OAUTH_TTL_MS / 1000 }
}

function randomNonce() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

async function consumeOAuthState(nonce: string, companyId: string) {
  const [row] = await db
    .select()
    .from(smcOauthStates)
    .where(
      and(
        eq(smcOauthStates.stateNonce, nonce),
        eq(smcOauthStates.companyId, companyId),
        isNull(smcOauthStates.deletedAt),
      ),
    )
    .limit(1)
  if (!row) throw new AppError('INVALID_STATE', 'OAuth state bulunamadı', 400)
  if (row.consumedAt) throw new AppError('INVALID_STATE', 'OAuth state kullanılmış', 400)
  if (row.expiresAt.getTime() < Date.now()) {
    throw new AppError('INVALID_STATE', 'OAuth state süresi dolmuş', 400)
  }
  await db
    .update(smcOauthStates)
    .set({ consumedAt: new Date(), updatedAt: new Date() })
    .where(eq(smcOauthStates.id, row.id))
  return row
}

export async function completePlatformOAuth(opts: {
  code: string
  state: string
  ip?: string
  userAgent?: string
}) {
  const st = verifyOAuthState(opts.state)
  const oauthRow = await consumeOAuthState(st.nonce, st.cid)
  const creds = await resolveMetaCredentials(st.cid)
  creds.redirectUri = oauthRow.redirectUri

  const short = await exchangeCodeForToken(opts.code, creds, {
    codeVerifier: oauthRow.codeVerifier,
  })
  const longLived = await exchangeLongLived(short.access_token, creds)
  const expiresAt = longLived.expires_in
    ? new Date(Date.now() + longLived.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

  const dbg = await debugToken(longLived.access_token, creds).catch(() => null)
  const grantedScopes = dbg?.data?.scopes || oauthRow.scopes || []

  const platform = (st.platform || oauthRow.platform || 'instagram').toLowerCase()
  const pages = await listFacebookPages(longLived.access_token)
  const waAccounts =
    platform === 'whatsapp' || platform === 'all'
      ? await listWhatsAppBusinessAccounts(longLived.access_token).catch(() => [])
      : []

  const sessionId = encryptSecret(
    JSON.stringify({
      companyId: st.cid,
      userId: st.uid,
      platform,
      userToken: longLived.access_token,
      expiresAt: expiresAt.toISOString(),
      scopes: grantedScopes,
      createdAt: Date.now(),
    }),
  )

  const candidates = {
    facebook: pages.map((p) => ({
      pageId: p.pageId,
      name: p.name,
      category: p.category,
      hasInstagram: Boolean(p.igUserId),
    })),
    instagram: pages
      .filter((p) => p.igUserId)
      .map((p) => ({
        igUserId: p.igUserId!,
        pageId: p.pageId,
        username: p.igUsername || p.igUserId!,
        displayName: p.igName || p.igUsername || p.name,
        pageName: p.name,
      })),
    messenger: pages.map((p) => ({
      pageId: p.pageId,
      name: p.name,
      category: p.category,
    })),
    whatsapp: waAccounts.flatMap((w) =>
      (w.phoneNumbers.length ? w.phoneNumbers : [{ id: w.wabaId }]).map((ph) => ({
        phoneNumberId: ph.id,
        displayPhone: ph.display_phone_number || null,
        verifiedName: ph.verified_name || w.wabaName || null,
        wabaId: w.wabaId,
        wabaName: w.wabaName,
        businessId: w.businessId,
        businessName: w.businessName,
      })),
    ),
  }

  // Auto-complete when exactly one candidate for the requested platform
  let autoConnected: { id: string; platform: string; label: string } | null = null
  if (platform === 'instagram' && candidates.instagram.length === 1) {
    const c = candidates.instagram[0]
    const page = pages.find((p) => p.pageId === c.pageId)!
    autoConnected = await finalizeInstagramSelection({
      companyId: st.cid,
      userId: st.uid,
      page,
      expiresAt,
      scopes: grantedScopes as string[],
      userToken: longLived.access_token,
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  } else if (platform === 'facebook' && candidates.facebook.length === 1) {
    const page = pages[0]
    autoConnected = await finalizeFacebookSelection({
      companyId: st.cid,
      userId: st.uid,
      page,
      expiresAt,
      scopes: grantedScopes as string[],
      platform: 'facebook',
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  } else if (platform === 'messenger' && candidates.messenger.length === 1) {
    const page = pages[0]
    autoConnected = await finalizeFacebookSelection({
      companyId: st.cid,
      userId: st.uid,
      page,
      expiresAt,
      scopes: grantedScopes as string[],
      platform: 'messenger',
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  } else if (platform === 'whatsapp' && candidates.whatsapp.length === 1) {
    const c = candidates.whatsapp[0]
    autoConnected = await finalizeWhatsAppSelection({
      companyId: st.cid,
      userId: st.uid,
      phoneNumberId: c.phoneNumberId,
      wabaId: c.wabaId,
      displayPhone: c.displayPhone,
      verifiedName: c.verifiedName,
      token: longLived.access_token,
      expiresAt,
      scopes: grantedScopes as string[],
      meta: { businessId: c.businessId, businessName: c.businessName, wabaName: c.wabaName },
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  }

  await writeConnectionLog({
    companyId: st.cid,
    userId: st.uid,
    platform,
    action: autoConnected ? 'oauth.auto_connected' : 'oauth.candidates',
    success: true,
    ip: opts.ip,
    userAgent: opts.userAgent,
    message: autoConnected
      ? `Bağlandı: ${autoConnected.label}`
      : `${candidates.instagram.length} IG / ${candidates.facebook.length} FB / ${candidates.whatsapp.length} WA aday`,
    meta: { autoConnected: Boolean(autoConnected) },
  })

  return {
    companyId: st.cid,
    userId: st.uid,
    platform,
    sessionId: autoConnected ? null : sessionId,
    autoConnected,
    candidates,
    scopes: grantedScopes,
    missingScopes: computeMissingScopes(platform, grantedScopes as string[]),
  }
}

function computeMissingScopes(platform: string, granted: string[]) {
  const needed =
    platform === 'all'
      ? META_PLATFORM_SCOPES.all
      : META_PLATFORM_SCOPES[platform as SocialPlatform] || META_CONTENT_SCOPES
  const set = new Set(granted)
  return [...needed].filter((s) => !set.has(s))
}

async function finalizeInstagramSelection(opts: {
  companyId: string
  userId: string
  page: Awaited<ReturnType<typeof listFacebookPages>>[number]
  expiresAt: Date
  scopes: string[]
  userToken: string
  ip?: string
  userAgent?: string
}) {
  if (!opts.page.igUserId) throw new AppError('NO_IG', 'Instagram hesabı yok', 400)
  let profile: {
    id: string
    username?: string
    name?: string
    followers_count?: number
  } = {
    id: opts.page.igUserId,
    username: opts.page.igUsername,
    name: opts.page.igName,
    followers_count: undefined,
  }
  try {
    profile = await getInstagramProfile(opts.page.igUserId, opts.page.pageToken)
  } catch {
    /* use page discovery fields */
  }
  const username = profile.username || opts.page.igUsername || opts.page.igUserId
  const displayName = profile.name || username
  const id = await upsertConnection({
    companyId: opts.companyId,
    platform: 'instagram',
    externalId: opts.page.igUserId,
    parentExternalId: opts.page.pageId,
    displayName,
    username,
    token: opts.page.pageToken,
    tokenExpiresAt: opts.expiresAt,
    scopes: opts.scopes,
    connectedBy: opts.userId,
    meta: {
      pageName: opts.page.name,
      followersCount: profile.followers_count,
      accountType: 'business_or_creator',
    },
  })
  await mirrorInstagramAccount({
    companyId: opts.companyId,
    igUserId: opts.page.igUserId,
    pageId: opts.page.pageId,
    username,
    displayName,
    pageToken: opts.page.pageToken,
    expiresAt: opts.expiresAt,
    scopes: opts.scopes,
  })
  await writeConnectionLog({
    companyId: opts.companyId,
    connectionId: id,
    userId: opts.userId,
    platform: 'instagram',
    action: 'connect',
    success: true,
    ip: opts.ip,
    userAgent: opts.userAgent,
    message: `@${username}`,
  })
  await notifyUser({
    userId: opts.userId,
    companyId: opts.companyId,
    type: 'social.connected',
    title: 'Instagram bağlandı',
    body: `@${username} hesabı BachMain’e bağlandı.`,
    link: '/sosyal-medya/hesaplar',
    meta: { platform: 'instagram', connectionId: id },
  }).catch(() => {})
  return { id, platform: 'instagram', label: `@${username}` }
}

async function finalizeFacebookSelection(opts: {
  companyId: string
  userId: string
  page: Awaited<ReturnType<typeof listFacebookPages>>[number]
  expiresAt: Date
  scopes: string[]
  platform: 'facebook' | 'messenger'
  ip?: string
  userAgent?: string
}) {
  const id = await upsertConnection({
    companyId: opts.companyId,
    platform: opts.platform,
    externalId: opts.page.pageId,
    displayName: opts.page.name,
    username: opts.page.name,
    token: opts.page.pageToken,
    tokenExpiresAt: opts.expiresAt,
    scopes: opts.scopes,
    connectedBy: opts.userId,
    meta: { category: opts.page.category, igUserId: opts.page.igUserId },
  })
  await writeConnectionLog({
    companyId: opts.companyId,
    connectionId: id,
    userId: opts.userId,
    platform: opts.platform,
    action: 'connect',
    success: true,
    ip: opts.ip,
    userAgent: opts.userAgent,
    message: opts.page.name,
  })
  await notifyUser({
    userId: opts.userId,
    companyId: opts.companyId,
    type: 'social.connected',
    title: opts.platform === 'messenger' ? 'Messenger bağlandı' : 'Facebook Sayfası bağlandı',
    body: `${opts.page.name} bağlantısı tamamlandı.`,
    link: '/sosyal-medya/hesaplar',
    meta: { platform: opts.platform, connectionId: id },
  }).catch(() => {})
  return { id, platform: opts.platform, label: opts.page.name }
}

async function finalizeWhatsAppSelection(opts: {
  companyId: string
  userId: string
  phoneNumberId: string
  wabaId: string
  displayPhone?: string | null
  verifiedName?: string | null
  token: string
  expiresAt: Date | null
  scopes: string[]
  meta?: Record<string, unknown>
  ip?: string
  userAgent?: string
}) {
  const id = await upsertConnection({
    companyId: opts.companyId,
    platform: 'whatsapp',
    externalId: opts.phoneNumberId,
    parentExternalId: opts.wabaId,
    displayName: opts.verifiedName || opts.displayPhone || opts.phoneNumberId,
    phoneNumber: opts.displayPhone || null,
    token: opts.token,
    tokenExpiresAt: opts.expiresAt,
    scopes: opts.scopes,
    connectedBy: opts.userId,
    meta: { wabaId: opts.wabaId, ...(opts.meta || {}) },
  })
  await writeConnectionLog({
    companyId: opts.companyId,
    connectionId: id,
    userId: opts.userId,
    platform: 'whatsapp',
    action: 'connect',
    success: true,
    ip: opts.ip,
    userAgent: opts.userAgent,
    message: opts.displayPhone || opts.phoneNumberId,
  })
  await notifyUser({
    userId: opts.userId,
    companyId: opts.companyId,
    type: 'social.connected',
    title: 'WhatsApp Business bağlandı',
    body: `${opts.displayPhone || opts.phoneNumberId} numarası bağlandı.`,
    link: '/sosyal-medya/hesaplar',
    meta: { platform: 'whatsapp', connectionId: id },
  }).catch(() => {})
  return {
    id,
    platform: 'whatsapp',
    label: opts.displayPhone || opts.phoneNumberId,
  }
}

function decodeSession(sessionId: string) {
  try {
    const raw = decryptSecret(sessionId)
    const data = JSON.parse(raw) as {
      companyId: string
      userId: string
      platform: string
      userToken: string
      expiresAt: string
      scopes: string[]
      createdAt: number
    }
    if (Date.now() - data.createdAt > 30 * 60 * 1000) {
      throw new AppError('SESSION_EXPIRED', 'Seçim oturumu süresi doldu — yeniden bağlanın', 400)
    }
    return data
  } catch (e) {
    if (e instanceof AppError) throw e
    throw new AppError('INVALID_SESSION', 'Geçersiz seçim oturumu', 400)
  }
}

export async function getPendingCandidates(opts: { companyId: string; sessionId: string }) {
  const session = decodeSession(opts.sessionId)
  if (session.companyId !== opts.companyId) {
    throw new AppError('TENANT_MISMATCH', 'Şirket uyuşmazlığı', 403)
  }
  const pages = await listFacebookPages(session.userToken)
  const waAccounts =
    session.platform === 'whatsapp' || session.platform === 'all'
      ? await listWhatsAppBusinessAccounts(session.userToken).catch(() => [])
      : []
  return {
    platform: session.platform,
    scopes: session.scopes,
    missingScopes: computeMissingScopes(session.platform, session.scopes || []),
    candidates: {
      facebook: pages.map((p) => ({
        pageId: p.pageId,
        name: p.name,
        category: p.category,
        hasInstagram: Boolean(p.igUserId),
      })),
      instagram: pages
        .filter((p) => p.igUserId)
        .map((p) => ({
          igUserId: p.igUserId!,
          pageId: p.pageId,
          username: p.igUsername || p.igUserId!,
          displayName: p.igName || p.igUsername || p.name,
          pageName: p.name,
        })),
      messenger: pages.map((p) => ({
        pageId: p.pageId,
        name: p.name,
        category: p.category,
      })),
      whatsapp: waAccounts.flatMap((w) =>
        (w.phoneNumbers.length ? w.phoneNumbers : [{ id: w.wabaId }]).map((ph) => ({
          phoneNumberId: ph.id,
          displayPhone: ph.display_phone_number || null,
          verifiedName: ph.verified_name || w.wabaName || null,
          wabaId: w.wabaId,
          wabaName: w.wabaName,
          businessId: w.businessId,
          businessName: w.businessName,
        })),
      ),
    },
  }
}

export async function confirmPlatformSelection(opts: {
  companyId: string
  userId: string
  sessionId: string
  platform: string
  selection: Record<string, string>
  ip?: string
  userAgent?: string
}) {
  const session = decodeSession(opts.sessionId)
  if (session.companyId !== opts.companyId) {
    throw new AppError('TENANT_MISMATCH', 'Şirket uyuşmazlığı', 403)
  }
  const pages = await listFacebookPages(session.userToken)
  const expiresAt = new Date(session.expiresAt)
  const platform = opts.platform || session.platform

  if (platform === 'instagram') {
    const page = pages.find(
      (p) => p.pageId === opts.selection.pageId || p.igUserId === opts.selection.igUserId,
    )
    if (!page?.igUserId) throw new AppError('NOT_FOUND', 'Instagram hesabı bulunamadı', 404)
    return finalizeInstagramSelection({
      companyId: opts.companyId,
      userId: opts.userId,
      page,
      expiresAt,
      scopes: session.scopes,
      userToken: session.userToken,
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  }

  if (platform === 'facebook' || platform === 'messenger') {
    const page = pages.find((p) => p.pageId === opts.selection.pageId)
    if (!page) throw new AppError('NOT_FOUND', 'Sayfa bulunamadı', 404)
    return finalizeFacebookSelection({
      companyId: opts.companyId,
      userId: opts.userId,
      page,
      expiresAt,
      scopes: session.scopes,
      platform: platform as 'facebook' | 'messenger',
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  }

  if (platform === 'whatsapp') {
    const wa = await listWhatsAppBusinessAccounts(session.userToken)
    let found: {
      phoneNumberId: string
      wabaId: string
      displayPhone?: string | null
      verifiedName?: string | null
      businessId?: string
      businessName?: string
      wabaName?: string
    } | null = null
    for (const w of wa) {
      for (const ph of w.phoneNumbers) {
        if (ph.id === opts.selection.phoneNumberId) {
          found = {
            phoneNumberId: ph.id,
            wabaId: w.wabaId,
            displayPhone: ph.display_phone_number,
            verifiedName: ph.verified_name,
            businessId: w.businessId,
            businessName: w.businessName,
            wabaName: w.wabaName,
          }
        }
      }
    }
    if (!found && opts.selection.phoneNumberId && opts.selection.wabaId) {
      found = {
        phoneNumberId: opts.selection.phoneNumberId,
        wabaId: opts.selection.wabaId,
        displayPhone: opts.selection.displayPhone,
        verifiedName: opts.selection.verifiedName,
      }
    }
    if (!found) throw new AppError('NOT_FOUND', 'WhatsApp numarası bulunamadı', 404)
    return finalizeWhatsAppSelection({
      companyId: opts.companyId,
      userId: opts.userId,
      ...found,
      token: session.userToken,
      expiresAt,
      scopes: session.scopes,
      meta: {
        businessId: found.businessId,
        businessName: found.businessName,
        wabaName: found.wabaName,
      },
      ip: opts.ip,
      userAgent: opts.userAgent,
    })
  }

  throw new AppError('INVALID_PLATFORM', 'Platform desteklenmiyor', 400)
}

/** Manual WhatsApp permanent token connect (Cloud API) */
export async function connectWhatsAppManual(opts: {
  companyId: string
  userId: string
  phoneNumberId: string
  wabaId: string
  accessToken: string
  displayPhone?: string
  verifiedName?: string
  ip?: string
  userAgent?: string
}) {
  const id = await finalizeWhatsAppSelection({
    companyId: opts.companyId,
    userId: opts.userId,
    phoneNumberId: opts.phoneNumberId,
    wabaId: opts.wabaId,
    displayPhone: opts.displayPhone,
    verifiedName: opts.verifiedName,
    token: opts.accessToken,
    expiresAt: null,
    scopes: [...META_PLATFORM_SCOPES.whatsapp],
    meta: { permanent: true },
    ip: opts.ip,
    userAgent: opts.userAgent,
  })
  return id
}

export async function listConnections(companyId: string, platform?: string) {
  const rows = await db
    .select()
    .from(smcSocialConnections)
    .where(
      and(
        eq(smcSocialConnections.companyId, companyId),
        isNull(smcSocialConnections.deletedAt),
        platform ? eq(smcSocialConnections.platform, platform) : sql`true`,
      ),
    )
    .orderBy(desc(smcSocialConnections.connectedAt))
  return rows.map(publicConnection)
}

export async function disconnectConnection(
  companyId: string,
  connectionId: string,
  userId?: string,
  ctx?: { ip?: string; userAgent?: string },
) {
  const [row] = await db
    .select()
    .from(smcSocialConnections)
    .where(
      and(
        eq(smcSocialConnections.id, connectionId),
        eq(smcSocialConnections.companyId, companyId),
        isNull(smcSocialConnections.deletedAt),
      ),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Bağlantı bulunamadı', 404)

  await db
    .update(smcSocialConnections)
    .set({ deletedAt: new Date(), status: 'revoked', updatedAt: new Date() })
    .where(eq(smcSocialConnections.id, connectionId))

  if (row.platform === 'instagram') {
    await db
      .update(smcInstagramAccounts)
      .set({ deletedAt: new Date(), status: 'error', updatedAt: new Date() })
      .where(
        and(
          eq(smcInstagramAccounts.companyId, companyId),
          eq(smcInstagramAccounts.igUserId, row.externalId),
        ),
      )
  }

  await writeConnectionLog({
    companyId,
    connectionId,
    userId,
    platform: row.platform,
    action: 'disconnect',
    success: true,
    ip: ctx?.ip,
    userAgent: ctx?.userAgent,
  })

  if (userId) {
    await notifyUser({
      userId,
      companyId,
      type: 'social.disconnected',
      title: 'Sosyal bağlantı kaldırıldı',
      body: `${row.platform} bağlantısı kaldırıldı.`,
      link: '/sosyal-medya/hesaplar',
    }).catch(() => {})
  }
}

export async function refreshConnection(companyId: string, connectionId: string, userId?: string) {
  const [row] = await db
    .select()
    .from(smcSocialConnections)
    .where(
      and(
        eq(smcSocialConnections.id, connectionId),
        eq(smcSocialConnections.companyId, companyId),
        isNull(smcSocialConnections.deletedAt),
      ),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Bağlantı bulunamadı', 404)

  const creds = await resolveMetaCredentials(companyId)
  const token = decryptSecret(row.tokenCiphertext)
  try {
    const longLived = await exchangeLongLived(token, creds)
    const expiresAt = longLived.expires_in
      ? new Date(Date.now() + longLived.expires_in * 1000)
      : row.tokenExpiresAt
    await db
      .update(smcSocialConnections)
      .set({
        tokenCiphertext: encryptSecret(longLived.access_token),
        tokenExpiresAt: expiresAt,
        status: 'connected',
        lastSyncAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(smcSocialConnections.id, connectionId))

    if (row.platform === 'instagram') {
      await db
        .update(smcInstagramAccounts)
        .set({
          tokenCiphertext: encryptSecret(longLived.access_token),
          tokenExpiresAt: expiresAt,
          status: 'live',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(smcInstagramAccounts.companyId, companyId),
            eq(smcInstagramAccounts.igUserId, row.externalId),
          ),
        )
    }

    await writeConnectionLog({
      companyId,
      connectionId,
      userId,
      platform: row.platform,
      action: 'refresh',
      success: true,
    })
    return publicConnection({
      ...row,
      tokenExpiresAt: expiresAt,
      status: 'connected',
      lastSyncAt: new Date(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'refresh_failed'
    await db
      .update(smcSocialConnections)
      .set({ status: 'error', lastError: msg, updatedAt: new Date() })
      .where(eq(smcSocialConnections.id, connectionId))
    await writeConnectionLog({
      companyId,
      connectionId,
      userId,
      platform: row.platform,
      action: 'refresh',
      success: false,
      message: msg,
    })
    if (userId) {
      await notifyUser({
        userId,
        companyId,
        type: 'social.token_error',
        title: 'Token yenileme başarısız',
        body: `${row.platform} bağlantısını yeniden kurmanız gerekebilir.`,
        link: '/sosyal-medya/hesaplar',
      }).catch(() => {})
    }
    throw err
  }
}

export async function renewExpiringTokens() {
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select()
    .from(smcSocialConnections)
    .where(
      and(
        isNull(smcSocialConnections.deletedAt),
        eq(smcSocialConnections.status, 'connected'),
        lt(smcSocialConnections.tokenExpiresAt, soon),
      ),
    )
    .limit(50)

  let renewed = 0
  let failed = 0
  for (const row of rows) {
    try {
      await refreshConnection(row.companyId, row.id, row.connectedBy || undefined)
      renewed += 1
      if (
        row.connectedBy &&
        row.tokenExpiresAt &&
        row.tokenExpiresAt.getTime() < Date.now() + 3 * 86400000
      ) {
        await notifyUser({
          userId: row.connectedBy,
          companyId: row.companyId,
          type: 'social.token_expiring',
          title: 'Sosyal token süresi dolmak üzere',
          body: `${row.platform} bağlantısı yakında yenilenmeli.`,
          link: '/sosyal-medya/hesaplar',
        }).catch(() => {})
      }
    } catch {
      failed += 1
    }
  }
  return { renewed, failed, scanned: rows.length }
}

export async function getConnectionResources(
  companyId: string,
  connectionId: string,
  kind: string,
) {
  const [row] = await db
    .select()
    .from(smcSocialConnections)
    .where(
      and(
        eq(smcSocialConnections.id, connectionId),
        eq(smcSocialConnections.companyId, companyId),
        isNull(smcSocialConnections.deletedAt),
      ),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Bağlantı bulunamadı', 404)
  const token = decryptSecret(row.tokenCiphertext)

  if (row.platform !== 'instagram') {
    throw new AppError('UNSUPPORTED', 'Bu kaynak yalnızca Instagram için', 400)
  }

  if (kind === 'profile') return getInstagramProfile(row.externalId, token)
  if (kind === 'media' || kind === 'posts') return listInstagramMedia(row.externalId, token)
  if (kind === 'reels') return listInstagramMedia(row.externalId, token, { mediaType: 'REELS' })
  if (kind === 'stories') return listInstagramStories(row.externalId, token)
  if (kind === 'comments') {
    const media = await listInstagramMedia(row.externalId, token, { limit: 10 })
    const all: unknown[] = []
    for (const m of media.items.slice(0, 5)) {
      const comments = await listInstagramComments(String(m.id), token).catch(() => [])
      all.push({ mediaId: m.id, comments })
    }
    return { items: all }
  }
  if (kind === 'dm' || kind === 'conversations') {
    const pageId = row.parentExternalId
    if (!pageId) throw new AppError('NO_PAGE', 'Page ID eksik', 400)
    return { items: await listInstagramConversations(pageId, token) }
  }
  throw new AppError('INVALID_KIND', 'Geçersiz kaynak', 400)
}

export async function listConnectionLogs(companyId: string, limit = 100) {
  const rows = await db
    .select()
    .from(smcConnectionLogs)
    .where(and(eq(smcConnectionLogs.companyId, companyId), isNull(smcConnectionLogs.deletedAt)))
    .orderBy(desc(smcConnectionLogs.createdAt))
    .limit(limit)
  return rows
}

export async function handleWebhookVerify(query: Record<string, string | undefined>) {
  return verifyWebhookChallenge({
    'hub.mode': query['hub.mode'],
    'hub.verify_token': query['hub.verify_token'],
    'hub.challenge': query['hub.challenge'],
  })
}

export async function handleWebhookEvent(opts: {
  platform: string
  rawBody: string
  signature?: string
  payload: Record<string, unknown>
}) {
  const secret = webhookAppSecret()
  const signatureOk = verifyWebhookSignature(opts.rawBody, opts.signature, secret)
  if (secret && !signatureOk) {
    await db.insert(smcWebhookEvents).values({
      platform: opts.platform,
      payload: opts.payload,
      signatureOk: false,
      processed: false,
      error: 'invalid_signature',
    })
    throw new AppError('INVALID_SIGNATURE', 'Webhook imza doğrulaması başarısız', 401)
  }

  const objectType = String(opts.payload.object || opts.platform)
  const entries = (opts.payload.entry as Array<Record<string, unknown>>) || []
  for (const entry of entries) {
    const entryId = String(entry.id || '')
    let companyId: string | null = null
    if (entryId) {
      const [conn] = await db
        .select()
        .from(smcSocialConnections)
        .where(
          and(eq(smcSocialConnections.externalId, entryId), isNull(smcSocialConnections.deletedAt)),
        )
        .limit(1)
      companyId = conn?.companyId || null
      if (conn?.connectedBy) {
        const changes = entry.changes as Array<Record<string, unknown>> | undefined
        const field = changes?.[0]?.field
        if (field === 'permissions' || String(opts.payload.object) === 'permissions') {
          await db
            .update(smcSocialConnections)
            .set({ status: 'revoked', lastError: 'permissions_revoked', updatedAt: new Date() })
            .where(eq(smcSocialConnections.id, conn.id))
          await notifyUser({
            userId: conn.connectedBy,
            companyId: conn.companyId,
            type: 'social.permissions_revoked',
            title: 'Sosyal izinler iptal edildi',
            body: `${conn.platform} izinleri Meta tarafında kaldırıldı — yeniden bağlayın.`,
            link: '/sosyal-medya/hesaplar',
          }).catch(() => {})
        }
      }
    }
    await db.insert(smcWebhookEvents).values({
      companyId,
      platform: opts.platform,
      objectType,
      entryId: entryId || null,
      payload: entry,
      signatureOk: signatureOk || !secret,
      processed: true,
    })
  }
  return { ok: true, entries: entries.length }
}

export async function adminListSocialConnections(limit = 200) {
  const rows = await db
    .select({
      connection: smcSocialConnections,
      companyName: companies.name,
      companySlug: companies.slug,
      connectedByEmail: users.email,
      connectedByName: users.fullName,
    })
    .from(smcSocialConnections)
    .leftJoin(companies, eq(companies.id, smcSocialConnections.companyId))
    .leftJoin(users, eq(users.id, smcSocialConnections.connectedBy))
    .where(isNull(smcSocialConnections.deletedAt))
    .orderBy(desc(smcSocialConnections.connectedAt))
    .limit(limit)

  return rows.map((r) => ({
    ...publicConnection(r.connection),
    companyId: r.connection.companyId,
    companyName: r.companyName,
    companySlug: r.companySlug,
    connectedByEmail: r.connectedByEmail,
    connectedByName: r.connectedByName,
  }))
}

export async function adminListConnectionLogs(limit = 200) {
  return db
    .select({
      log: smcConnectionLogs,
      companyName: companies.name,
    })
    .from(smcConnectionLogs)
    .leftJoin(companies, eq(companies.id, smcConnectionLogs.companyId))
    .orderBy(desc(smcConnectionLogs.createdAt))
    .limit(limit)
}

export { getMetaAppPublic, saveMetaApp, socialHealth, resolveMetaCredentials }
export type { MetaCredentials }
