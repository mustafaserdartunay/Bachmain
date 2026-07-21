import {
  defaultRedirectUri,
  encryptSecret,
  exchangeAndDiscover,
  platformCreds,
  verifyState,
} from '../../../server/socialMeta.js'

function readCookie(req, name) {
  const raw = req.headers.cookie || ''
  const hit = raw
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`))
  return hit ? hit.slice(name.length + 1) : ''
}

export default async function handler(req, res) {
  const q = req.query || {}
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'bachmain.vercel.app'
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || `${proto}://${host}`

  if (q.error || !q.code || !q.state) {
    const msg = encodeURIComponent(q.error_description || q.error || 'missing')
    res.writeHead(302, { Location: `${appUrl}/sosyal-medya/hesaplar?oauth=error&msg=${msg}` })
    return res.end()
  }

  try {
    const st = verifyState(q.state)
    const platform = platformCreds()
    let appSecret = platform.appSecret
    const cookieSecret = readCookie(req, 'bach_meta_secret')
    if (cookieSecret) {
      try {
        appSecret = Buffer.from(cookieSecret, 'base64url').toString('utf8')
      } catch {
        /* keep platform */
      }
    }
    const creds = {
      appId: st.appId || platform.appId,
      appSecret,
      redirectUri: st.redirectUri || platform.redirectUri || defaultRedirectUri(req),
    }
    const discovered = await exchangeAndDiscover(q.code, creds)
    const account = {
      id: `ig-${discovered.igUserId}`,
      igUserId: discovered.igUserId,
      pageId: discovered.pageId,
      username: discovered.username,
      displayName: discovered.displayName,
      status: 'live',
      tokenExpiresAt: new Date(Date.now() + discovered.expiresIn * 1000).toISOString(),
      connectedAt: new Date().toISOString(),
      tokenCipher: encryptSecret(discovered.pageToken),
    }
    res.setHeader('Set-Cookie', [
      `bach_ig_account=${Buffer.from(JSON.stringify(account)).toString('base64url')}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=5184000`,
      'bach_meta_secret=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    ])
    res.writeHead(302, {
      Location: `${appUrl}/sosyal-medya/hesaplar?oauth=ok&u=${encodeURIComponent(discovered.username)}`,
    })
    return res.end()
  } catch (err) {
    const msg = encodeURIComponent(err.message || 'oauth_failed')
    res.writeHead(302, { Location: `${appUrl}/sosyal-medya/hesaplar?oauth=error&msg=${msg}` })
    return res.end()
  }
}
