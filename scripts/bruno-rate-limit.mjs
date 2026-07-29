#!/usr/bin/env node
/**
 * Aggressive rate-limit probe against a protected-ish public endpoint.
 * Writes HTML report under tests/reports/bruno/
 */
import fs from 'node:fs'
import path from 'node:path'

const API_BASE = process.env.API_BASE || 'https://api.bachmain.com'
const COUNT = Number(process.env.RATE_PROBE_COUNT || 80)
const REPORT_DIR = path.join(process.cwd(), 'tests', 'reports', 'bruno')
fs.mkdirSync(REPORT_DIR, { recursive: true })

const results = []
let hit429 = 0
for (let i = 0; i < COUNT; i += 1) {
  const started = Date.now()
  try {
    const res = await fetch(`${API_BASE}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rate-probe@example.com', password: 'x' }),
    })
    if (res.status === 429) hit429 += 1
    results.push({ i, status: res.status, ms: Date.now() - started })
  } catch (err) {
    results.push({ i, status: 0, error: String(err), ms: Date.now() - started })
  }
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Rate limit probe</title>
<style>body{font-family:system-ui;margin:2rem}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:.35rem .6rem}</style>
</head><body>
<h1>Rate limit probe</h1>
<p>Target: ${API_BASE}/v1/auth/login · requests: ${COUNT} · 429 count: <strong>${hit429}</strong></p>
<table><thead><tr><th>#</th><th>status</th><th>ms</th></tr></thead>
<tbody>${results.map((r) => `<tr><td>${r.i}</td><td>${r.status}</td><td>${r.ms}</td></tr>`).join('')}</tbody>
</table>
</body></html>`
fs.writeFileSync(path.join(REPORT_DIR, 'rate-limit.html'), html)
fs.writeFileSync(
  path.join(REPORT_DIR, 'rate-limit.json'),
  JSON.stringify({ hit429, COUNT, results }, null, 2),
)
console.log(`Wrote ${REPORT_DIR}/rate-limit.html (429=${hit429})`)
