/**
 * Remote ops — proxies control-plane kill switch / overview to apps/api.
 */
import { sendJson } from './authRoutes.mjs'
import { getStaffSession, staffAuthEnabled } from './staffAuth.mjs'

function requireStaffOrFail(req, res) {
  const session = getStaffSession(req)
  if (!session && staffAuthEnabled() && process.env.STAFF_AUTH_REQUIRED !== '0') {
    sendJson(req, res, 401, { ok: false, error: 'UNAUTHORIZED', message: 'Staff oturumu gerekli' })
    return null
  }
  return session || { email: 'local-dev' }
}

function apiBase() {
  return String(
    process.env.REMOTE_API_URL || process.env.API_PUBLIC_URL || 'http://127.0.0.1:8080',
  ).replace(/\/$/, '')
}

function internalKey() {
  return process.env.REMOTE_INTERNAL_SECRET || ''
}

async function proxy(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-remote-internal': internalKey(),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

export async function handleRemoteOpsApi(req, res, apiPath, body = {}) {
  const path = String(apiPath || '')
  if (!path.startsWith('remote')) return false
  if (!requireStaffOrFail(req, res)) return true

  if (req.method === 'GET' && (path === 'remote/ops' || path === 'remote')) {
    try {
      const overview = await fetch(`${apiBase()}/v1/remote/internal/overview`, {
        headers: { 'x-remote-internal': internalKey() },
      })
      if (!overview.ok) {
        const health = await fetch(`${apiBase()}/v1/health`)
          .then((r) => r.json())
          .catch(() => null)
        sendJson(req, res, 200, {
          ok: true,
          connected: false,
          killSwitch: false,
          devices: 0,
          online: 0,
          offline: 0,
          activeSessions: 0,
          sessionsLast24h: 0,
          apiHealth: health,
          message: 'Kontrol düzlemi bağlı değil',
        })
        return true
      }
      const data = await overview.json()
      sendJson(req, res, 200, { ok: true, connected: true, ...data })
    } catch {
      sendJson(req, res, 200, {
        ok: true,
        connected: false,
        devices: 0,
        online: 0,
        offline: 0,
        activeSessions: 0,
        sessionsLast24h: 0,
        message: 'Kontrol düzlemi bağlı değil',
      })
    }
    return true
  }

  if (req.method === 'POST' && path === 'remote/kill-switch') {
    const enabled = Boolean(body?.enabled)
    const result = await proxy('/v1/remote/internal/kill-switch', {
      method: 'POST',
      body: { enabled },
    })
    sendJson(req, res, result.status, result.data)
    return true
  }

  return false
}
