import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import { META_OAUTH_SCOPES, META_PLATFORM_SCOPES, type SocialPlatform } from './catalog.js'

export type MetaCredentials = {
  appId: string
  appSecret: string
  redirectUri: string
}

export function platformMetaCredentials(): MetaCredentials {
  return {
    appId: String(
      (env as { META_APP_ID?: string }).META_APP_ID || process.env.META_APP_ID || '',
    ).trim(),
    appSecret: String(
      (env as { META_APP_SECRET?: string }).META_APP_SECRET || process.env.META_APP_SECRET || '',
    ).trim(),
    redirectUri: String(
      (env as { META_REDIRECT_URI?: string }).META_REDIRECT_URI ||
        process.env.META_REDIRECT_URI ||
        '',
    ).trim(),
  }
}

export function webhookVerifyToken() {
  return String(
    (env as { META_WEBHOOK_VERIFY_TOKEN?: string }).META_WEBHOOK_VERIFY_TOKEN ||
      process.env.META_WEBHOOK_VERIFY_TOKEN ||
      '',
  ).trim()
}

export function webhookAppSecret(creds?: MetaCredentials | null) {
  return String(
    (env as { META_WEBHOOK_APP_SECRET?: string }).META_WEBHOOK_APP_SECRET ||
      process.env.META_WEBHOOK_APP_SECRET ||
      creds?.appSecret ||
      platformMetaCredentials().appSecret ||
      '',
  ).trim()
}

export function metaConfigured(creds?: Partial<MetaCredentials> | null) {
  const c = {
    ...platformMetaCredentials(),
    ...(creds?.appId ? { appId: creds.appId } : {}),
    ...(creds?.appSecret ? { appSecret: creds.appSecret } : {}),
    ...(creds?.redirectUri ? { redirectUri: creds.redirectUri } : {}),
  }
  return Boolean(c.appId && c.appSecret && c.redirectUri)
}

export function graphVersion() {
  return (
    (env as { META_GRAPH_VERSION?: string }).META_GRAPH_VERSION ||
    process.env.META_GRAPH_VERSION ||
    'v21.0'
  )
}

/** PKCE S256 */
export function generatePkcePair() {
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  return { codeVerifier, codeChallenge }
}

export function signOAuthState(payload: Record<string, string>) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', env.JWT_ACCESS_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyOAuthState(state: string) {
  const [body, sig] = String(state).split('.')
  if (!body || !sig) throw new AppError('INVALID_STATE', 'OAuth state geçersiz', 400)
  const expected = createHmac('sha256', env.JWT_ACCESS_SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError('INVALID_STATE', 'OAuth state imzası hatalı', 400)
  }
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
    cid: string
    uid: string
    nonce: string
    appId?: string
    platform?: string
    pkce?: string
  }
}

export function buildOAuthUrl(
  state: string,
  creds?: MetaCredentials,
  opts?: {
    scopes?: string[] | string
    codeChallenge?: string
    platform?: SocialPlatform | string
  },
) {
  const c = creds || platformMetaCredentials()
  if (!metaConfigured(c)) {
    throw new AppError('META_NOT_CONFIGURED', 'META_APP_ID / SECRET / REDIRECT_URI gerekli', 503)
  }
  const platform = (opts?.platform || 'instagram') as keyof typeof META_PLATFORM_SCOPES
  const scopeList = opts?.scopes || META_PLATFORM_SCOPES[platform] || META_PLATFORM_SCOPES.instagram
  const scope = Array.isArray(scopeList)
    ? scopeList.join(',')
    : String(scopeList || META_OAUTH_SCOPES)

  const u = new URL(`https://www.facebook.com/${graphVersion()}/dialog/oauth`)
  u.searchParams.set('client_id', c.appId)
  u.searchParams.set('redirect_uri', c.redirectUri)
  u.searchParams.set('state', state)
  u.searchParams.set('scope', scope)
  u.searchParams.set('response_type', 'code')
  if (opts?.codeChallenge) {
    u.searchParams.set('code_challenge', opts.codeChallenge)
    u.searchParams.set('code_challenge_method', 'S256')
  }
  return u.toString()
}

async function graphGet(path: string, token: string, params: Record<string, string> = {}) {
  const u = new URL(`https://graph.facebook.com/${graphVersion()}${path}`)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  if (token) u.searchParams.set('access_token', token)
  const res = await fetch(u)
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const msg = (data.error as { message?: string } | undefined)?.message || 'Graph hatası'
    throw new AppError('META_GRAPH_ERROR', msg, 502)
  }
  return data
}

async function graphPost(path: string, token: string, body: Record<string, unknown>) {
  const u = new URL(`https://graph.facebook.com/${graphVersion()}${path}`)
  u.searchParams.set('access_token', token)
  const res = await fetch(u, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const msg = (data.error as { message?: string } | undefined)?.message || 'Graph hatası'
    throw new AppError('META_GRAPH_ERROR', msg, 502)
  }
  return data
}

export async function exchangeCodeForToken(
  code: string,
  creds: MetaCredentials,
  opts?: { codeVerifier?: string },
) {
  const params: Record<string, string> = {
    client_id: creds.appId,
    client_secret: creds.appSecret,
    redirect_uri: creds.redirectUri,
    code,
  }
  if (opts?.codeVerifier) params.code_verifier = opts.codeVerifier
  return graphGet('/oauth/access_token', '', params) as Promise<{
    access_token: string
    expires_in?: number
    token_type?: string
  }>
}

export async function exchangeLongLived(shortToken: string, creds: MetaCredentials) {
  return graphGet('/oauth/access_token', '', {
    grant_type: 'fb_exchange_token',
    client_id: creds.appId,
    client_secret: creds.appSecret,
    fb_exchange_token: shortToken,
  }) as Promise<{ access_token: string; expires_in?: number }>
}

export async function debugToken(inputToken: string, creds: MetaCredentials) {
  return graphGet('/debug_token', '', {
    input_token: inputToken,
    access_token: `${creds.appId}|${creds.appSecret}`,
  }) as Promise<{
    data?: {
      is_valid?: boolean
      scopes?: string[]
      expires_at?: number
      user_id?: string
      granular_scopes?: Array<{ scope: string; target_ids?: string[] }>
    }
  }>
}

export type FacebookPageCandidate = {
  pageId: string
  name: string
  pageToken: string
  category?: string
  igUserId?: string
  igUsername?: string
  igName?: string
}

export async function listFacebookPages(userToken: string): Promise<FacebookPageCandidate[]> {
  const pages = (await graphGet('/me/accounts', userToken, {
    fields:
      'id,name,access_token,category,instagram_business_account{id,username,name,profile_picture_url,followers_count}',
    limit: '100',
  })) as { data?: Array<Record<string, unknown>> }

  return (pages.data || []).map((p) => {
    const ig = p.instagram_business_account as
      { id?: string; username?: string; name?: string; followers_count?: number } | undefined
    return {
      pageId: String(p.id),
      name: String(p.name || p.id),
      pageToken: String(p.access_token || userToken),
      category: p.category ? String(p.category) : undefined,
      igUserId: ig?.id,
      igUsername: ig?.username,
      igName: ig?.name,
    }
  })
}

export async function discoverInstagramBusiness(userToken: string) {
  const pages = await listFacebookPages(userToken)
  const page = pages.find((p) => p.igUserId)
  if (!page || !page.igUserId) {
    throw new AppError(
      'NO_IG_BUSINESS',
      'Bağlı Facebook Sayfasında Instagram Business/Creator hesabı bulunamadı',
      400,
    )
  }
  const profile = await getInstagramProfile(page.igUserId, page.pageToken)
  return {
    igUserId: profile.id,
    pageId: page.pageId,
    username: profile.username || profile.id,
    displayName: profile.name || profile.username || profile.id,
    pageToken: page.pageToken,
    followersCount: profile.followers_count,
  }
}

export async function getInstagramProfile(igUserId: string, token: string) {
  return graphGet(`/${igUserId}`, token, {
    fields:
      'id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count',
  }) as Promise<{
    id: string
    username?: string
    name?: string
    biography?: string
    website?: string
    profile_picture_url?: string
    followers_count?: number
    follows_count?: number
    media_count?: number
  }>
}

export async function listInstagramMedia(
  igUserId: string,
  token: string,
  opts?: { limit?: number; mediaType?: string },
) {
  const params: Record<string, string> = {
    fields:
      'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url}',
    limit: String(opts?.limit || 25),
  }
  const data = (await graphGet(`/${igUserId}/media`, token, params)) as {
    data?: Array<Record<string, unknown>>
    paging?: Record<string, unknown>
  }
  let items = data.data || []
  if (opts?.mediaType) {
    items = items.filter((m) => String(m.media_type || '') === opts.mediaType)
  }
  return { items, paging: data.paging }
}

export async function listInstagramStories(igUserId: string, token: string) {
  const data = (await graphGet(`/${igUserId}/stories`, token, {
    fields: 'id,media_type,media_url,timestamp,permalink',
  })) as { data?: Array<Record<string, unknown>> }
  return data.data || []
}

export async function listInstagramComments(mediaId: string, token: string) {
  const data = (await graphGet(`/${mediaId}/comments`, token, {
    fields: 'id,text,username,timestamp,like_count,replies{id,text,username,timestamp}',
  })) as { data?: Array<Record<string, unknown>> }
  return data.data || []
}

export async function listInstagramConversations(pageId: string, token: string) {
  const data = (await graphGet(`/${pageId}/conversations`, token, {
    fields: 'id,updated_time,message_count,participants,snippet',
    platform: 'instagram',
  })) as { data?: Array<Record<string, unknown>> }
  return data.data || []
}

export async function listWhatsAppBusinessAccounts(userToken: string) {
  const businesses = (await graphGet('/me/businesses', userToken, {
    fields: 'id,name',
  })) as { data?: Array<{ id: string; name?: string }> }

  const out: Array<{
    wabaId: string
    wabaName?: string
    businessId: string
    businessName?: string
    phoneNumbers: Array<{ id: string; display_phone_number?: string; verified_name?: string }>
  }> = []

  for (const biz of businesses.data || []) {
    try {
      const owned = (await graphGet(`/${biz.id}/owned_whatsapp_business_accounts`, userToken, {
        fields: 'id,name,phone_numbers{id,display_phone_number,verified_name}',
      })) as {
        data?: Array<{
          id: string
          name?: string
          phone_numbers?: {
            data?: Array<{ id: string; display_phone_number?: string; verified_name?: string }>
          }
        }>
      }
      for (const waba of owned.data || []) {
        out.push({
          wabaId: waba.id,
          wabaName: waba.name,
          businessId: biz.id,
          businessName: biz.name,
          phoneNumbers: waba.phone_numbers?.data || [],
        })
      }
    } catch {
      /* business may lack WA permission — skip */
    }
  }
  return out
}

export async function getWhatsAppPhoneNumber(phoneNumberId: string, token: string) {
  return graphGet(`/${phoneNumberId}`, token, {
    fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
  }) as Promise<{
    id: string
    display_phone_number?: string
    verified_name?: string
    quality_rating?: string
    code_verification_status?: string
  }>
}

export function verifyWebhookChallenge(query: {
  'hub.mode'?: string
  'hub.verify_token'?: string
  'hub.challenge'?: string
}) {
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']
  const expected = webhookVerifyToken()
  if (!expected) {
    throw new AppError('WEBHOOK_NOT_CONFIGURED', 'META_WEBHOOK_VERIFY_TOKEN gerekli', 503)
  }
  if (mode === 'subscribe' && token === expected && challenge) {
    return challenge
  }
  throw new AppError('WEBHOOK_VERIFY_FAILED', 'Webhook doğrulama başarısız', 403)
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  appSecret: string,
) {
  if (!signatureHeader || !appSecret) return false
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function publishImagePost(opts: {
  igUserId: string
  token: string
  imageUrl: string
  caption: string
}) {
  const container = (await graphPost(`/${opts.igUserId}/media`, opts.token, {
    image_url: opts.imageUrl,
    caption: opts.caption,
  })) as { id: string }
  const published = (await graphPost(`/${opts.igUserId}/media_publish`, opts.token, {
    creation_id: container.id,
  })) as { id: string }
  return { containerId: container.id, publishId: published.id }
}

export async function publishCarousel(opts: {
  igUserId: string
  token: string
  imageUrls: string[]
  caption: string
}) {
  const children: string[] = []
  for (const url of opts.imageUrls.slice(0, 20)) {
    const c = (await graphPost(`/${opts.igUserId}/media`, opts.token, {
      image_url: url,
      is_carousel_item: true,
    })) as { id: string }
    children.push(c.id)
  }
  const container = (await graphPost(`/${opts.igUserId}/media`, opts.token, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption: opts.caption,
  })) as { id: string }
  const published = (await graphPost(`/${opts.igUserId}/media_publish`, opts.token, {
    creation_id: container.id,
  })) as { id: string }
  return { containerId: container.id, publishId: published.id }
}

export async function publishReel(opts: {
  igUserId: string
  token: string
  videoUrl: string
  caption: string
  coverUrl?: string
}) {
  const body: Record<string, unknown> = {
    media_type: 'REELS',
    video_url: opts.videoUrl,
    caption: opts.caption,
  }
  if (opts.coverUrl) body.cover_url = opts.coverUrl
  const container = (await graphPost(`/${opts.igUserId}/media`, opts.token, body)) as { id: string }
  const published = (await graphPost(`/${opts.igUserId}/media_publish`, opts.token, {
    creation_id: container.id,
  })) as { id: string }
  return { containerId: container.id, publishId: published.id }
}
