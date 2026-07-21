import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import { META_OAUTH_SCOPES } from './catalog.js'

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
  }
}

export function buildOAuthUrl(state: string, creds?: MetaCredentials) {
  const c = creds || platformMetaCredentials()
  if (!metaConfigured(c)) {
    throw new AppError('META_NOT_CONFIGURED', 'META_APP_ID / SECRET / REDIRECT_URI gerekli', 503)
  }
  const u = new URL(`https://www.facebook.com/${graphVersion()}/dialog/oauth`)
  u.searchParams.set('client_id', c.appId)
  u.searchParams.set('redirect_uri', c.redirectUri)
  u.searchParams.set('state', state)
  u.searchParams.set('scope', META_OAUTH_SCOPES)
  u.searchParams.set('response_type', 'code')
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

export async function exchangeCodeForToken(code: string, creds: MetaCredentials) {
  return graphGet('/oauth/access_token', '', {
    client_id: creds.appId,
    client_secret: creds.appSecret,
    redirect_uri: creds.redirectUri,
    code,
  }) as Promise<{ access_token: string; expires_in?: number }>
}

export async function exchangeLongLived(shortToken: string, creds: MetaCredentials) {
  return graphGet('/oauth/access_token', '', {
    grant_type: 'fb_exchange_token',
    client_id: creds.appId,
    client_secret: creds.appSecret,
    fb_exchange_token: shortToken,
  }) as Promise<{ access_token: string; expires_in?: number }>
}

export async function discoverInstagramBusiness(userToken: string) {
  const pages = (await graphGet('/me/accounts', userToken, {
    fields: 'id,name,access_token,instagram_business_account',
  })) as { data?: Array<Record<string, unknown>> }
  const page = (pages.data || []).find((p) => p.instagram_business_account)
  if (!page) {
    throw new AppError(
      'NO_IG_BUSINESS',
      'Bağlı Facebook Sayfasında Instagram Business hesabı bulunamadı',
      400,
    )
  }
  const ig = page.instagram_business_account as { id: string }
  const pageToken = String(page.access_token || userToken)
  const profile = (await graphGet(`/${ig.id}`, pageToken, {
    fields: 'id,username,name',
  })) as { id: string; username?: string; name?: string }
  return {
    igUserId: profile.id,
    pageId: String(page.id),
    username: profile.username || profile.id,
    displayName: profile.name || profile.username || profile.id,
    pageToken,
  }
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
