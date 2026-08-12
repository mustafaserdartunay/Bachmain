/**
 * Security Center live data for Admin UI (/api/security/*).
 */
import { sendJson } from './authRoutes.mjs'
import { getStaffSession, staffAuthEnabled } from './staffAuth.mjs'
import { loadStore } from './store.mjs'
import { hasDatabase } from './db.mjs'
import { envHealthSnapshot, validateAdminEnv } from './assertEnv.mjs'
import { collectSystemHealthExtras } from './systemMetrics.mjs'

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
    const live = await collectSystemHealthExtras()

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
        status: live.api.status,
        label: 'API',
        detail: `${live.api.detail || 'Admin control-plane'} · ${live.api.latencyMs}ms`,
      },
      openai: {
        status: envSnap.checks.openai ? 'healthy' : 'degraded',
        label: 'OpenAI',
        detail: envSnap.checks.openai
          ? 'OPENAI_API_KEY tanımlı (client key prod’da reddedilir)'
          : 'OPENAI_API_KEY eksik',
      },
      rateLimit: {
        status: live.redis.status,
        label: 'Rate limit / Redis',
        detail: live.redis.detail || (envSnap.checks.redis ? 'Redis URL mevcut' : 'In-memory fallback'),
      },
      deploy: {
        status: live.github.status,
        label: 'CI / Deploy (GitHub)',
        detail: live.github.detail || 'GitHub Actions',
        links: {
          actions: `https://github.com/${live.github.repository || 'mustafaserdartunay/Bachmain'}/actions`,
          vercelCrm: 'https://vercel.com/bachmain/bachmain',
          vercelAdmin: 'https://vercel.com/bachmain/bachmain-admin',
        },
      },
      backup: {
        status: live.database.status === 'healthy' ? 'healthy' : 'degraded',
        label: 'Backup / Neon',
        detail:
          live.database.status === 'healthy'
            ? `Neon canlı · ${live.database.latencyMs}ms latency · PITR runbook docs/55`
            : live.database.detail || 'Neon bağlantısı yok',
        placeholder: live.database.status !== 'healthy',
      },
      storage: {
        status: 'degraded',
        label: 'Storage',
        detail: 'Private R2 + signed URL hedefi — henüz zorunlu değil',
        placeholder: true,
      },
    }

    const weights = {
      env: 18,
      api: 14,
      openai: 14,
      audit: 14,
      rateLimit: 10,
      sessions: 8,
      deploy: 8,
      backup: 8,
      storage: 6,
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
        'CI: PR açın — Preview deploy + Actions; prod için staging soak tercih edin',
      ].filter(Boolean),
    })
    return true
  }

  if (method === 'GET' && path === 'security/deploy') {
    if (!requireStaffOrFail(req, res)) return true
    sendJson(req, res, 200, {
      ok: true,
      sampledAt: new Date().toISOString(),
      ci: {
        status: 'degraded',
        detail: 'GitHub Actions workflow ci.yml (lint soft-fail during transition)',
        url: 'https://github.com/mustafaserdartunay/Bachmain/actions',
      },
      rollback: {
        steps: [
          'Vercel → Project → Deployments',
          'Previous Ready deployment → Promote / Instant Rollback',
          'Smoke: login + one CRM page + /api/health',
        ],
        docs: 'docs/63_STAGING_AND_PREVIEW.md',
      },
      environments: {
        production: ['uygulama.bachmain.com', 'yonetim.bachmain.com', 'bachmain.com'],
        staging: 'Configure staging Neon + Vercel Staging env (docs/63)',
        preview: 'Automatic on PR when Git connected to Vercel',
      },
    })
    return true
  }

  return false
}
