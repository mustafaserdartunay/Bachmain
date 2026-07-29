/**
 * Staff: cross-tenant Meta social connections (reads smc_* when DATABASE_URL shared).
 */
import { hasDatabase, getSql } from './db.mjs'
import { sendJson, applyCors } from './authRoutes.mjs'

async function ensureTables(db) {
  await db`
    CREATE TABLE IF NOT EXISTS smc_social_connections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      platform text NOT NULL,
      external_id text NOT NULL,
      parent_external_id text,
      display_name text,
      username text,
      phone_number text,
      token_ciphertext text NOT NULL,
      refresh_token_ciphertext text,
      token_expires_at timestamptz,
      scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
      status text NOT NULL DEFAULT 'connected',
      last_sync_at timestamptz,
      last_error text,
      connected_by uuid,
      connected_at timestamptz NOT NULL DEFAULT now(),
      meta jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS smc_connection_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      connection_id uuid,
      user_id uuid,
      platform text NOT NULL,
      action text NOT NULL,
      success boolean NOT NULL DEFAULT true,
      ip text,
      user_agent text,
      device text,
      os text,
      browser text,
      message text,
      meta jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )
  `
}

export async function handleSocialConnections(req, res, path) {
  if (!path.startsWith('social-connections') && path !== 'sosyal-baglantilar') return false
  applyCors(req, res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }

  if (req.method !== 'GET') {
    sendJson(req, res, 405, { error: 'METHOD_NOT_ALLOWED' })
    return true
  }

  if (!hasDatabase()) {
    sendJson(req, res, 200, {
      ok: true,
      connections: [],
      logs: [],
      note: 'DATABASE_URL yok — platform API /v1/admin/social-connections kullanın',
    })
    return true
  }

  try {
    const db = getSql()
    await ensureTables(db)
    const connections = await db`
      SELECT
        c.id,
        c.company_id AS "companyId",
        c.platform,
        c.external_id AS "externalId",
        c.parent_external_id AS "parentExternalId",
        c.display_name AS "displayName",
        c.username,
        c.phone_number AS "phoneNumber",
        c.status,
        c.scopes,
        c.token_expires_at AS "tokenExpiresAt",
        c.last_sync_at AS "lastSyncAt",
        c.last_error AS "lastError",
        c.connected_by AS "connectedBy",
        c.connected_at AS "connectedAt",
        c.created_at AS "createdAt",
        co.name AS "companyName",
        co.slug AS "companySlug",
        u.email AS "connectedByEmail",
        u.full_name AS "connectedByName"
      FROM smc_social_connections c
      LEFT JOIN companies co ON co.id = c.company_id
      LEFT JOIN users u ON u.id = c.connected_by
      WHERE c.deleted_at IS NULL
      ORDER BY c.connected_at DESC
      LIMIT 500
    `
    const logs = await db`
      SELECT
        l.id,
        l.company_id AS "companyId",
        l.connection_id AS "connectionId",
        l.user_id AS "userId",
        l.platform,
        l.action,
        l.success,
        l.ip,
        l.user_agent AS "userAgent",
        l.device,
        l.os,
        l.browser,
        l.message,
        l.created_at AS "createdAt",
        co.name AS "companyName"
      FROM smc_connection_logs l
      LEFT JOIN companies co ON co.id = l.company_id
      WHERE l.deleted_at IS NULL
      ORDER BY l.created_at DESC
      LIMIT 100
    `
    sendJson(req, res, 200, {
      ok: true,
      connections,
      logs,
      // never expose tokens
    })
  } catch (err) {
    sendJson(req, res, 500, {
      error: 'SOCIAL_CONNECTIONS_QUERY_FAILED',
      message: err instanceof Error ? err.message : 'query_failed',
    })
  }
  return true
}
