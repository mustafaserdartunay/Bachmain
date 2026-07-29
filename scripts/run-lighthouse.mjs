#!/usr/bin/env node
/**
 * Lighthouse CI-style runner for BachMain surfaces.
 * Requires Chrome/Chromium. Writes HTML + JSON under tests/reports/lighthouse.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const REPORT_DIR = path.join(process.cwd(), 'tests', 'reports', 'lighthouse')
fs.mkdirSync(REPORT_DIR, { recursive: true })

const targets = [
  { id: 'web-home', url: process.env.WEB_URL || 'https://bachmain.com/' },
  { id: 'web-login', url: `${process.env.WEB_URL || 'https://bachmain.com'}/giris` },
  { id: 'app-shell', url: process.env.APP_URL || 'https://uygulama.bachmain.com/' },
  { id: 'admin-login', url: `${process.env.ADMIN_URL || 'https://yonetim.bachmain.com'}/giris` },
]

const scores = []
let failed = 0
const thresholds = {
  performance: Number(process.env.LH_MIN_PERFORMANCE || 0.25),
  accessibility: Number(process.env.LH_MIN_ACCESSIBILITY || 0.85),
  bestPractices: Number(process.env.LH_MIN_BEST_PRACTICES || 0.9),
  seo: Number(process.env.LH_MIN_SEO || 0.65),
}

for (const t of targets) {
  const outBase = path.join(REPORT_DIR, t.id)
  console.log(`Lighthouse → ${t.url}`)
  const result = spawnSync(
    'npx',
    [
      '--yes',
      'lighthouse',
      t.url,
      '--quiet',
      '--chrome-flags=--headless --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo',
      `--output=html`,
      `--output=json`,
      `--output-path=${outBase}`,
    ],
    { encoding: 'utf8', env: process.env },
  )
  if (result.status !== 0) {
    failed += 1
    fs.writeFileSync(
      `${outBase}.FAILED.txt`,
      result.stderr || result.stdout || `exit ${result.status}`,
    )
    scores.push({ id: t.id, url: t.url, error: true })
    continue
  }
  // lighthouse writes outBase.report.html / .report.json depending on version; normalize
  const jsonPath = [`${outBase}.report.json`, `${outBase}.json`].find((p) => fs.existsSync(p))
  if (jsonPath) {
    const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const cats = report.categories || {}
    scores.push({
      id: t.id,
      url: t.url,
      performance: cats.performance?.score,
      accessibility: cats.accessibility?.score,
      bestPractices: cats['best-practices']?.score,
      seo: cats.seo?.score,
    })
  } else {
    scores.push({ id: t.id, url: t.url, note: 'json missing' })
  }
}

const violations = scores.flatMap((score) =>
  Object.entries(thresholds)
    .filter(([key, minimum]) => {
      const actual = score[key]
      return typeof actual === 'number' && actual < minimum
    })
    .map(([key, minimum]) => ({
      target: score.id,
      category: key,
      actual: score[key],
      minimum,
    })),
)

const index = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Lighthouse summary</title>
<style>body{font-family:system-ui;margin:2rem}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:.4rem .7rem}.bad{color:#b91c1c}</style>
</head><body>
<h1>BachMain Lighthouse</h1>
<p>${new Date().toISOString()}</p>
<p>Budgets: performance ${Math.round(thresholds.performance * 100)}, accessibility ${Math.round(thresholds.accessibility * 100)}, best practices ${Math.round(thresholds.bestPractices * 100)}, SEO ${Math.round(thresholds.seo * 100)}</p>
${violations.length ? `<h2 class="bad">Budget failures</h2><pre>${JSON.stringify(violations, null, 2)}</pre>` : '<p>All configured budgets passed.</p>'}
<table><thead><tr><th>Target</th><th>Perf</th><th>A11y</th><th>BP</th><th>SEO</th><th>Report</th></tr></thead>
<tbody>
${scores
  .map((s) => {
    const pct = (v) => (typeof v === 'number' ? Math.round(v * 100) : s.error ? 'ERR' : '—')
    return `<tr class="${s.error ? 'bad' : ''}"><td>${s.id}</td><td>${pct(s.performance)}</td><td>${pct(s.accessibility)}</td><td>${pct(s.bestPractices)}</td><td>${pct(s.seo)}</td><td><a href="./${s.id}.report.html">HTML</a></td></tr>`
  })
  .join('')}
</tbody></table>
</body></html>`
fs.writeFileSync(path.join(REPORT_DIR, 'index.html'), index)
fs.writeFileSync(
  path.join(REPORT_DIR, 'summary.json'),
  JSON.stringify({ thresholds, violations, scores }, null, 2),
)
console.log(`Wrote ${REPORT_DIR}/index.html`)
process.exit(failed || violations.length ? 1 : 0)
