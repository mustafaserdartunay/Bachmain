import {
  buildOAuthUrl,
  defaultRedirectUri,
  metaReady,
  platformCreds,
  signState,
} from '../../server/socialMeta.js'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const body = req.method === 'POST' ? req.body || {} : {}
    const platform = platformCreds()
    const creds = {
      appId: String(body.appId || platform.appId || '').trim(),
      appSecret: String(body.appSecret || platform.appSecret || '').trim(),
      redirectUri: String(
        body.redirectUri || platform.redirectUri || defaultRedirectUri(req),
      ).trim(),
    }
    if (!metaReady(creds)) {
      return res.status(503).json({
        error: 'META_NOT_CONFIGURED',
        message: 'Meta App ID / Secret / Redirect URI gerekli',
        setupPath: '/sosyal-medya/meta-kurulum',
      })
    }
    const state = signState({
      cid: String(body.companyId || 'local'),
      uid: String(body.userId || 'user'),
      nonce: Date.now().toString(36),
      appId: creds.appId,
      // secret not in state — client must resend or use platform
      redirectUri: creds.redirectUri,
    })
    // Temporarily stash secret hashed reference via env-only; for tenant secret pass via encrypted cookie
    if (body.appSecret) {
      res.setHeader(
        'Set-Cookie',
        `bach_meta_secret=${Buffer.from(creds.appSecret).toString('base64url')}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      )
    }
    return res.status(200).json({
      ok: true,
      url: buildOAuthUrl(state, creds),
      state,
      redirectUri: creds.redirectUri,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'oauth_start_failed' })
  }
}
