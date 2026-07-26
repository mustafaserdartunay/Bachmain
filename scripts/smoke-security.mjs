#!/usr/bin/env node
/**
 * Smoke tests for sales-gate security primitives (no network / no Vite).
 * Run: node scripts/smoke-security.mjs
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

async function main() {
  const client = await import(pathToFileURL(path.join(root, 'src/utils/rolePermissions.js')).href)
  const { permsForClientRole, roleAllowsClient } = client

  assert.ok(permsForClientRole('owner').includes('*'))
  assert.equal(roleAllowsClient('guest', 'crm.customers.view'), false)
  assert.equal(roleAllowsClient('sales', 'crm.customers.create'), true)
  assert.equal(roleAllowsClient('warehouse', 'finance.mutate'), false)
  assert.equal(roleAllowsClient('accounting', 'finance.view'), true)
  assert.equal(roleAllowsClient('misafir', 'dashboard.view'), true)

  const { validateUploadFile, sanitizeFileName } = await import(
    pathToFileURL(path.join(root, 'src/utils/secureFileUpload.js')).href
  )

  const bad = validateUploadFile(
    { name: 'x.html', size: 10, type: 'text/html' },
    { allowedTypes: ['png'] },
  )
  assert.equal(bad.ok, false)

  const oversized = validateUploadFile(
    { name: 'big.png', size: 20 * 1024 * 1024, type: 'image/png' },
    { allowedTypes: ['png'] },
  )
  assert.equal(oversized.ok, false)

  const good = validateUploadFile(
    { name: 'drawing.PNG', size: 1024, type: 'image/png' },
    { allowedTypes: ['png', 'jpg'] },
  )
  assert.equal(good.ok, true)
  assert.ok(!sanitizeFileName('../../../etc/passwd.pdf').includes('..'))

  // CSRF module load (admin)
  const csrf = await import(pathToFileURL(path.join(root, 'apps/admin/server/csrf.mjs')).href)
  const token = csrf.issueCsrfToken()
  assert.equal(typeof token, 'string')
  assert.ok(token.length >= 32)
  const exempt = csrf.assertCsrf({ method: 'POST', headers: {} }, 'auth/login')
  assert.equal(exempt.ok, true)

  console.log('smoke-security: OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
