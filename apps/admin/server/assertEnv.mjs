/**
 * Fail-fast ENV validation for admin control-plane API.
 * Production: missing required secrets → process exit.
 * Development: warn only (whitelist).
 */

function isProduction() {
  return (
    String(process.env.NODE_ENV || '').toLowerCase() === 'production' ||
    String(process.env.VERCEL_ENV || '').toLowerCase() === 'production'
  )
}

function present(name) {
  const v = String(process.env[name] || '').trim()
  return Boolean(v) && v !== 'undefined' && v !== 'null'
}

/** Zod-like issue list for required keys */
export function validateAdminEnv(env = process.env) {
  const issues = []
  const prod = isProduction()

  if (prod) {
    if (!present('JWT_SECRET') && !present('ADMIN_JWT_SECRET')) {
      issues.push('JWT_SECRET (or ADMIN_JWT_SECRET) is required in production')
    }
    if (present('STRIPE_SECRET_KEY') && !present('STRIPE_WEBHOOK_SECRET')) {
      issues.push('STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set')
    }
    if (!present('RESEND_API_KEY')) {
      // Soft warning — do not crash boot; password reset queues as skipped_no_provider
      console.warn(
        '[assertEnv] RESEND_API_KEY missing — transactional mail (password reset) will not send until configured',
      )
    }
  }

  return { ok: issues.length === 0, issues, production: prod }
}

export function assertAdminEnv() {
  const result = validateAdminEnv()
  if (result.ok) return result

  const message = `Invalid environment: ${result.issues.join('; ')}`
  if (result.production) {
    console.error(`[assertEnv] ${message}`)
    process.exit(1)
  }
  console.warn(`[assertEnv] ${message}`)
  return result
}

export function envHealthSnapshot() {
  const checks = {
    jwt: present('JWT_SECRET') || present('ADMIN_JWT_SECRET'),
    database: present('DATABASE_URL'),
    stripe: present('STRIPE_SECRET_KEY'),
    stripeWebhook: present('STRIPE_WEBHOOK_SECRET'),
    resend: present('RESEND_API_KEY'),
    openai: present('OPENAI_API_KEY'),
    aiProxySecret: present('AI_PROXY_SECRET'),
    redis: present('REDIS_URL'),
  }
  const scoreParts = [
    checks.jwt ? 20 : 0,
    checks.database ? 20 : 0,
    checks.stripeWebhook || !checks.stripe ? 15 : 0,
    checks.openai ? 15 : 0,
    checks.aiProxySecret ? 10 : 0,
    checks.resend ? 10 : 0,
    checks.redis ? 10 : 0,
  ]
  const score = scoreParts.reduce((a, b) => a + b, 0)
  return { checks, score, production: isProduction() }
}
