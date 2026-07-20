/**
 * Security Center live data for Admin UI (/api/security/*).
 */
import { sendJson } from './authRoutes.mjs'
import { getStaffSession, staffAuthEnabled } from './staffAuth.mjs'
import { loadStore } from './store.mjs'
import { hasDatabase } from './db.mjs'
import { envHealthSnapshot, validateAdminEnv } from './assertEnv.mjs'

function requireStaffOrFail(req, res) {
  const session = getStaffSession(req)
  if (!session && staffAuthEnabled() && process.env.STAFF_AUTH_REQUIRED !== '0') {
    sendJson(req, res, 401, { ok: false, error: 'UNAUTHORIZED', message: 'Staff oturumu gerekli' })
    return null
  }
  return session || { email: 'local-dev' }
}

function computeSecurityScore(snapshot, extras = {}) {
  let score = snapshot.score
  // SSL / headers assumed on Vercel production
  if (snapshot.production) score = Math.min(100, score + 10)
  if (extras.dbLive) score = Math.min(100, score + 5)
  if (extras.auditImmutable) score = Math.min(100, score + 5)
  return Math.max(0, Math.min(100, score))
}

export async function handleSecurityApi(req, res, path) {
  if (!path.startsWith('security')) return false

  const method = req.method
  if (method === 'GET' && (path === 'security' || path === 'security/overview')) {
    if (!requireStaffOrFail(req, res)) return true

    const store = await loadStore()
    const envSnap = envHealthSnapshot()
    const envValidation = validateAdminEnv()
    const accounts = Array.isArray(store.accounts) ? store.accounts : []
    const sessionsApprox = accounts.filter((a) => a?.token || a?.sessionToken).length

    const panels = {
      audit: {
        status: 'healthy',
        label: 'Audit log',
        detail: 'Append-only politika aktif (silme API yok)',
        immutable: true,
      },
      sessions: {
        status: sessionsApprox > 0 ? 'healthy' : 'degraded',
        label: 'Oturumlar',
        detail: `${sessionsApprox} aktif hesap oturumu (store)`,
        count: sessionsApprox,
      },
      env: {
        status: envValidation.ok ? 'healthy' : 'down',
        label: 'ENV health',
        detail: envValidation.ok ? 'Zorunlu env tamam' : envValidation.issues.join('; '),
        checks: envSnap.checks,
      },
      api: {
        status: 'healthy',
        label: 'API',
        detail: 'Admin control-plane ayakta',
      },
      openai: {
        status: envSnap.checks.openai ? 'healthy' : 'degraded',
        label: 'OpenAI',
        detail: envSnap.checks.openai
          ? 'OPENAI_API_KEY tanımlı (client key prod’da reddedilir)'
          : 'OPENAI_API_KEY eksik',
      },
      rateLimit: {
        status: envSnap.checks.redis ? 'healthy' : 'degraded',
        label: 'Rate limit',
        detail: envSnap.checks.redis ? 'Redis URL mevcut' : 'In-memory fallback',
      },
      backup: {
        status: 'degraded',
        label: 'Backup',
        detail: 'Neon PITR + object backup runbook — bkz. docs/55_OPS_BACKUP_DR.md',
        placeholder: true,
      },
      storage: {
        status: 'degraded',
        label: 'Storage',
        detail: 'Private R2 + signed URL hedefi — henüz zorunlu değil',
        placeholder: true,
      },
    }

    const weights = {
      env: 20,
      api: 15,
      openai: 15,
      audit: 15,
      rateLimit: 10,
      sessions: 10,
      backup: 10,
      storage: 5,
    }
    const statusPoints = { healthy: 1, degraded: 0.45, down: 0 }
    let weighted = 0
    let totalW = 0
    for (const [key, w] of Object.entries(weights)) {
      totalW += w
      weighted += w * (statusPoints[panels[key]?.status] ?? 0)
    }
    const panelScore = Math.round((weighted / totalW) * 100)
    const score = computeSecurityScore(
      { ...envSnap, score: panelScore },
      { dbLive: hasDatabase(), auditImmutable: true },
    )

    sendJson(req, res, 200, {
      ok: true,
      score,
      sampledAt: new Date().toISOString(),
      production: envSnap.production,
      database: hasDatabase() ? 'neon' : 'json-store',
      panels,
      recommendations: [
        !envSnap.checks.stripeWebhook && envSnap.checks.stripe
          ? 'STRIPE_WEBHOOK_SECRET tanımlayın'
          : null,
        !envSnap.checks.aiProxySecret ? 'AI_PROXY_SECRET ile AI proxy’yi kilitleyin' : null,
        !envSnap.checks.redis ? 'REDIS_URL ile dağıtık rate limit açın' : null,
        panels.backup.placeholder ? 'Backup/DR runbook’u operasyon takviminde doğrulayın' : null,
      ].filter(Boolean),
    })
    return true
  }

  return false
}
