import { decryptSecret } from '../../server/socialMeta.js'

function readCookie(req, name) {
  const raw = req.headers.cookie || ''
  const hit = raw
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`))
  return hit ? hit.slice(name.length + 1) : ''
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const raw = readCookie(req, 'bach_ig_account')
      if (!raw) return res.status(200).json({ ok: true, accounts: [] })
      const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
      const { tokenCipher, ...publicAccount } = parsed
      return res.status(200).json({
        ok: true,
        accounts: [{ ...publicAccount, hasToken: Boolean(tokenCipher) }],
      })
    } catch {
      return res.status(200).json({ ok: true, accounts: [] })
    }
  }
  if (req.method === 'DELETE') {
    res.setHeader(
      'Set-Cookie',
      'bach_ig_account=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    )
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', 'GET, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
