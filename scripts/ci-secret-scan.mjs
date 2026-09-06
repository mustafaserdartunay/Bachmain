#!/usr/bin/env node
/**
 * Soft secret scan for CI (non-blocking).
 * Avoids `git ls-files` (can hang on large/locked worktrees); walks source dirs.
 */
import fs from 'node:fs'
import path from 'node:path'

const patterns = [
  { name: 'OpenAI live-ish key', re: /sk-[a-zA-Z0-9]{20,}/g },
  { name: 'Stripe live secret', re: /sk_live_[a-zA-Z0-9]+/g },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'Mapbox secret-ish token', re: /sk\.eyJ[a-zA-Z0-9._-]{20,}/g },
  { name: 'Mapbox public token literal', re: /pk\.eyJ[a-zA-Z0-9._-]{40,}/g },
]

const roots = ['src', 'server', 'api', 'apps', 'scripts', '.github']
const skipDir = new Set([
  'node_modules',
  'dist',
  '.git',
  '.tmp-vercel',
  '.vercel',
  'restore-backups',
  'BACHMAIN_DOCUMENT_CENTER',
])

function walk(dir, out = []) {
  let entries = []
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const ent of entries) {
    if (skipDir.has(ent.name)) continue
    const abs = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(abs, out)
    else if (/\.(js|jsx|mjs|cjs|ts|tsx|json|env|yml|yaml|md)$/i.test(ent.name)) {
      if (ent.name.includes('.example')) continue
      out.push(abs)
    }
  }
  return out
}

const root = process.cwd()
const files = roots.flatMap((r) => walk(path.join(root, r)))
const hits = []

for (const abs of files) {
  let text = ''
  try {
    const st = fs.statSync(abs)
    if (st.size > 1_500_000) continue
    text = fs.readFileSync(abs, 'utf8')
  } catch {
    continue
  }
  for (const { name, re } of patterns) {
    re.lastIndex = 0
    if (re.test(text)) hits.push({ file: path.relative(root, abs), name })
  }
}

if (hits.length) {
  console.warn('[secret-scan] Potential secrets (review; CI soft-fail):')
  for (const h of hits.slice(0, 50)) console.warn(`  - ${h.name}: ${h.file}`)
  process.exit(0)
}

console.log('[secret-scan] OK')
process.exit(0)
