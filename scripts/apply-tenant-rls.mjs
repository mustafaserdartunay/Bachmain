#!/usr/bin/env node
/**
 * Apply tenant RLS SQL against DATABASE_URL.
 * Usage:
 *   node --env-file=apps/api/.env scripts/apply-tenant-rls.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const sqlPath = path.join(root, 'apps/api/drizzle/0018_tenant_rls.sql')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL required')
  process.exit(1)
}
if (/127\.0\.0\.1|localhost/.test(url) && process.env.ALLOW_LOCAL_RLS !== '1') {
  console.error(
    'DATABASE_URL looks local. Set real Neon URL, or ALLOW_LOCAL_RLS=1 for docker/local.',
  )
  process.exit(1)
}

const require = createRequire(path.join(root, 'apps/api/package.json'))
const pg = require('pg')

const sql = fs.readFileSync(sqlPath, 'utf8')
const pool = new pg.Pool({
  connectionString: url,
  ssl: /neon\.tech|sslmode=require/i.test(url) ? { rejectUnauthorized: false } : undefined,
  max: 1,
})

try {
  await pool.query(sql)
  console.log('OK: tenant RLS applied from', sqlPath)
} catch (err) {
  console.error('FAIL:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
