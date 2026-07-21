/**
 * CRM Vercel serverless Meta Instagram OAuth + AI reel media.
 * Uses platform META_* env or tenant credentials from request body / store.
 */
import { createHmac, createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

const GRAPH = process.env.META_GRAPH_VERSION || 'v21.0'
const SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
].join(',')

function encKey() {
  const secret =
    process.env.JWT_ACCESS_SECRET ||
    process.env.META_TOKEN_SECRET ||
    'bachmain-dev-meta-secret-key!!'
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(plain) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encKey(), iv)
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`
}

export function decryptSecret(payload) {
  const [ivB64, tagB64, dataB64] = String(payload).split('.')
  const decipher = createDecipheriv('aes-256-gcm', encKey(), Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export function platformCreds() {
  return {
    appId: String(process.env.META_APP_ID || '').trim(),
    appSecret: String(process.env.META_APP_SECRET || '').trim(),
    redirectUri: String(process.env.META_REDIRECT_URI || '').trim(),
  }
}

export function defaultRedirectUri(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  if (host) return `${proto}://${host}/api/social/oauth/callback`
  return 'https://bachmain.vercel.app/api/social/oauth/callback'
}

export function metaReady(creds) {
  return Boolean(creds?.appId && creds?.appSecret && creds?.redirectUri)
}

export function signState(payload) {
  const secret =
    process.env.JWT_ACCESS_SECRET ||
    process.env.META_TOKEN_SECRET ||
    'bachmain-dev-meta-secret-key!!'
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyState(state) {
  const secret =
    process.env.JWT_ACCESS_SECRET ||
    process.env.META_TOKEN_SECRET ||
    'bachmain-dev-meta-secret-key!!'
  const [body, sig] = String(state).split('.')
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  if (sig !== expected) throw new Error('INVALID_STATE')
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
}

export function buildOAuthUrl(state, creds) {
  const u = new URL(`https://www.facebook.com/${GRAPH}/dialog/oauth`)
  u.searchParams.set('client_id', creds.appId)
  u.searchParams.set('redirect_uri', creds.redirectUri)
  u.searchParams.set('state', state)
  u.searchParams.set('scope', SCOPES)
  u.searchParams.set('response_type', 'code')
  return u.toString()
}

async function graphGet(path, token, params = {}) {
  const u = new URL(`https://graph.facebook.com/${GRAPH}${path}`)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  if (token) u.searchParams.set('access_token', token)
  const res = await fetch(u)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Graph error')
  return data
}

export async function exchangeAndDiscover(code, creds) {
  const short = await graphGet('/oauth/access_token', '', {
    client_id: creds.appId,
    client_secret: creds.appSecret,
    redirect_uri: creds.redirectUri,
    code,
  })
  const longLived = await graphGet('/oauth/access_token', '', {
    grant_type: 'fb_exchange_token',
    client_id: creds.appId,
    client_secret: creds.appSecret,
    fb_exchange_token: short.access_token,
  })
  const pages = await graphGet('/me/accounts', longLived.access_token, {
    fields: 'id,name,access_token,instagram_business_account',
  })
  const page = (pages.data || []).find((p) => p.instagram_business_account)
  if (!page) throw new Error('Instagram Business hesabı bulunamadı (Sayfa bağlayın)')
  const igId = page.instagram_business_account.id
  const pageToken = page.access_token || longLived.access_token
  const profile = await graphGet(`/${igId}`, pageToken, { fields: 'id,username,name' })
  return {
    igUserId: profile.id,
    pageId: String(page.id),
    username: profile.username || profile.id,
    displayName: profile.name || profile.username || profile.id,
    pageToken,
    expiresIn: longLived.expires_in || 60 * 24 * 3600,
  }
}

export async function generateReelImages(prompt) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY tanımlı değil')
  const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Instagram Reels vertical 9:16 cover, premium product photo: ${prompt}`,
      size: '1024x1792',
      n: 1,
    }),
  })
  const imageData = await imageRes.json()
  if (!imageRes.ok) throw new Error(imageData?.error?.message || 'Görsel üretilemedi')
  const coverUrl = imageData.data?.[0]?.url
  const scenes = [{ label: 'Kapak', url: coverUrl }]
  for (const label of ['Sahne 2', 'Sahne 3']) {
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${label} Instagram Reels vertical scene: ${prompt}`,
          size: '1024x1792',
          n: 1,
        }),
      })
      const d = await r.json()
      if (r.ok && d.data?.[0]?.url) scenes.push({ label, url: d.data[0].url })
    } catch {
      /* ignore */
    }
  }
  return {
    coverUrl,
    scenes,
    videoHint:
      'Kapak ve sahneler hazır. MP4 için video_url ekleyin veya sahneleri Reels editöründe birleştirin.',
  }
}

export function healthPayload(req) {
  const platform = platformCreds()
  const redirect = platform.redirectUri || defaultRedirectUri(req)
  return {
    ok: true,
    metaConfigured: metaReady(platform),
    platformMetaConfigured: metaReady({ ...platform, redirectUri: redirect }),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    redirectUriHint: redirect,
    setupPath: '/sosyal-medya/meta-kurulum',
    graphVersion: GRAPH,
  }
}
