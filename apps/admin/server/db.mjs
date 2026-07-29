/**
 * Postgres (Neon / Vercel Postgres) adapter for durable platform state.
 * When DATABASE_URL is unset, callers fall back to local JSON (dev only).
 */
import { neon } from '@neondatabase/serverless'

let sql = null
let ready = false

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export function getSql() {
  if (!hasDatabase()) return null
  if (!sql) sql = neon(process.env.DATABASE_URL)
  return sql
}

export async function ensureSchema() {
  const db = getSql()
  if (!db) return false
  if (ready) return true
  await db`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS staff_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS tenant_data (
      tenant_code TEXT NOT NULL,
      collection TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (tenant_code, collection)
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      customer_id TEXT,
      account_id TEXT,
      event_type TEXT NOT NULL,
      amount_cents INTEGER,
      currency TEXT DEFAULT 'TRY',
      raw JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      key TEXT PRIMARY KEY,
      hits INTEGER NOT NULL DEFAULT 0,
      window_start TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  // Billing tables (durable mirror; primary catalog also lives in app_state.billing)
  await db`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      prices JSONB NOT NULL DEFAULT '{}'::jsonb,
      modules JSONB NOT NULL DEFAULT '[]'::jsonb,
      max_users INTEGER DEFAULT 3,
      storage_gb INTEGER DEFAULT 2,
      active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS addon_modules (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      monthly_price INTEGER DEFAULT 0,
      yearly_price INTEGER DEFAULT 0,
      trial_days INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS billing_subscriptions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      plan_code TEXT NOT NULL,
      status TEXT NOT NULL,
      period TEXT,
      period_start TIMESTAMPTZ,
      period_end TIMESTAMPTZ,
      grace_until TIMESTAMPTZ,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS billing_payments (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      method TEXT,
      status TEXT,
      amount_try INTEGER,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS billing_history (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      action TEXT NOT NULL,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  ready = true
  return true
}

export async function loadPayload(id = 'main') {
  const db = getSql()
  if (!db) return null
  await ensureSchema()
  const rows = await db`SELECT payload FROM app_state WHERE id = ${id} LIMIT 1`
  return rows[0]?.payload ?? null
}

export async function savePayload(payload, id = 'main') {
  const db = getSql()
  if (!db) return null
  await ensureSchema()
  await db`
    INSERT INTO app_state (id, payload, updated_at)
    VALUES (${id}, ${JSON.stringify(payload)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload, updated_at = now()
  `
  return payload
}

export async function getTenantCollection(tenantCode, collection) {
  const db = getSql()
  if (!db) return null
  await ensureSchema()
  const rows = await db`
    SELECT payload FROM tenant_data
    WHERE tenant_code = ${tenantCode} AND collection = ${collection}
    LIMIT 1
  `
  return rows[0]?.payload ?? null
}

export async function setTenantCollection(tenantCode, collection, payload) {
  const db = getSql()
  if (!db) throw new Error('DATABASE_URL required for tenant sync')
  await ensureSchema()
  const json = JSON.stringify(payload ?? {})
  await db`
    INSERT INTO tenant_data (tenant_code, collection, payload, updated_at)
    VALUES (${tenantCode}, ${collection}, ${json}::jsonb, now())
    ON CONFLICT (tenant_code, collection) DO UPDATE
    SET payload = EXCLUDED.payload, updated_at = now()
  `
  return payload
}

export async function insertPaymentEvent(event) {
  const db = getSql()
  if (!db) return null
  await ensureSchema()
  await db`
    INSERT INTO payment_events (id, provider, customer_id, account_id, event_type, amount_cents, currency, raw)
    VALUES (
      ${event.id},
      ${event.provider},
      ${event.customerId || null},
      ${event.accountId || null},
      ${event.eventType},
      ${event.amountCents ?? null},
      ${event.currency || 'TRY'},
      ${JSON.stringify(event.raw || {})}::jsonb
    )
  `
  return event
}

export async function upsertStaffUser(user) {
  const db = getSql()
  if (!db) return null
  await ensureSchema()
  await db`
    INSERT INTO staff_users (id, email, full_name, password_hash, role)
    VALUES (${user.id}, ${user.email}, ${user.fullName}, ${user.passwordHash}, ${user.role || 'admin'})
    ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
  `
  return user
}

export async function findStaffByEmail(email) {
  const db = getSql()
  if (!db) return null
  await ensureSchema()
  const rows = await db`SELECT * FROM staff_users WHERE email = ${email} LIMIT 1`
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash,
    role: row.role,
  }
}

/** Simple sliding-window rate limit (DB-backed when available). */
export async function hitRateLimit(key, { limit = 20, windowMs = 15 * 60 * 1000 } = {}) {
  const db = getSql()
  if (!db) {
    // in-memory fallback for local/dev
    if (!globalThis.__bachRate) globalThis.__bachRate = new Map()
    const now = Date.now()
    const cur = globalThis.__bachRate.get(key) || { hits: 0, windowStart: now }
    if (now - cur.windowStart > windowMs) {
      cur.hits = 0
      cur.windowStart = now
    }
    cur.hits += 1
    globalThis.__bachRate.set(key, cur)
    return { allowed: cur.hits <= limit, hits: cur.hits, limit }
  }
  await ensureSchema()
  const rows = await db`SELECT hits, window_start FROM auth_rate_limits WHERE key = ${key} LIMIT 1`
  const now = Date.now()
  if (!rows[0] || now - new Date(rows[0].window_start).getTime() > windowMs) {
    await db`
      INSERT INTO auth_rate_limits (key, hits, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET hits = 1, window_start = now()
    `
    return { allowed: true, hits: 1, limit }
  }
  const hits = Number(rows[0].hits) + 1
  await db`UPDATE auth_rate_limits SET hits = ${hits} WHERE key = ${key}`
  return { allowed: hits <= limit, hits, limit }
}
