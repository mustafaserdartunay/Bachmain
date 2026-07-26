#!/usr/bin/env node
/**
 * DR restore drill — dry-run by default.
 * Usage:
 *   node scripts/dr-restore-drill.mjs
 *   node scripts/dr-restore-drill.mjs --live   # requires CONFIRM_RESTORE=YES + DATABASE_URL
 *
 * Evidence is written to docs/dr-evidence/ (gitignored by default via docs/dr-evidence/.gitkeep)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const evidenceDir = path.join(root, 'docs', 'dr-evidence')
const live = process.argv.includes('--live')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')

const checklist = [
  'Neon / Postgres point-in-time or snapshot identified',
  'R2 / object storage versioning checked (or N/A until uploads migrate)',
  'Secrets (JWT, Stripe, Meta) available in vault — not from git',
  'Staging restore target selected (never overwrite prod without change window)',
  'App health: /v1/health and admin /api/health',
  'Tenant smoke: login → list customers for one companyId',
  'RTO / RPO recorded in evidence log',
]

fs.mkdirSync(evidenceDir, { recursive: true })

const report = {
  at: new Date().toISOString(),
  mode: live ? 'live' : 'dry-run',
  databaseUrlPresent: Boolean(process.env.DATABASE_URL),
  confirmRestore: process.env.CONFIRM_RESTORE === 'YES',
  checklist,
  result: 'pending',
  notes: [],
}

if (live) {
  if (process.env.CONFIRM_RESTORE !== 'YES') {
    report.result = 'aborted'
    report.notes.push('Set CONFIRM_RESTORE=YES to run live restore steps')
  } else if (!process.env.DATABASE_URL) {
    report.result = 'aborted'
    report.notes.push('DATABASE_URL missing')
  } else {
    report.result = 'manual-steps-required'
    report.notes.push(
      'Automated pg_restore not bundled — run Neon restore UI or pg_restore against staging, then re-run this script without --live to log evidence.',
    )
  }
} else {
  report.result = 'dry-run-ok'
  report.notes.push('No destructive actions taken. Schedule quarterly live drill.')
}

const outFile = path.join(evidenceDir, `restore-drill-${stamp}.json`)
fs.writeFileSync(outFile, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ok: report.result !== 'aborted', file: outFile, ...report }, null, 2))
process.exit(report.result === 'aborted' ? 1 : 0)
