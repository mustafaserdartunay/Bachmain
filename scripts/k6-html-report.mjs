#!/usr/bin/env node
/**
 * Minimal HTML report from k6 summary-export JSON.
 */
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
if (args[0] === '--index') {
  const dir = args[1]
  const tiers = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('vus-'))
    .map((d) => d.name)
  const links = tiers
    .map(
      (t) =>
        `<li><a href="./${t}/report.html">${t}</a>${fs.existsSync(path.join(dir, t, 'FAILED.txt')) ? ' — FAILED' : ''}</li>`,
    )
    .join('\n')
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    `<!doctype html><html><head><meta charset="utf-8"><title>k6 reports</title></head>
<body><h1>BachMain k6 reports</h1><ul>${links || '<li>No tiers run</li>'}</ul></body></html>`,
  )
  process.exit(0)
}

const [summaryPath, outPath, vus] = args
if (!summaryPath || !outPath) {
  console.error('Usage: k6-html-report.mjs <summary.json> <out.html> [vus]')
  process.exit(1)
}
if (!fs.existsSync(summaryPath)) {
  fs.writeFileSync(
    outPath,
    `<!doctype html><html><head><meta charset="utf-8"><title>k6 missing</title></head>
<body><h1>No summary for ${vus || '?'} VUs</h1></body></html>`,
  )
  process.exit(0)
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
const metrics = summary.metrics || {}
const row = (name, m) => {
  if (!m) return ''
  const avg = m.avg ?? m.values?.avg
  const p95 = m['p(95)'] ?? m.values?.['p(95)']
  const rate = m.rate ?? m.values?.rate
  return `<tr><td>${name}</td><td>${avg ?? '—'}</td><td>${p95 ?? '—'}</td><td>${rate ?? '—'}</td></tr>`
}

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>k6 ${vus} VUs</title>
<style>body{font-family:system-ui;margin:2rem}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:.4rem .7rem} .fail{color:#b91c1c}</style>
</head><body>
<h1>k6 load — ${vus} concurrent users</h1>
<p>Generated ${new Date().toISOString()}</p>
<table>
<thead><tr><th>Metric</th><th>avg</th><th>p95</th><th>rate</th></tr></thead>
<tbody>
${row('http_req_duration', metrics.http_req_duration)}
${row('http_req_failed', metrics.http_req_failed)}
${row('bach_errors', metrics.bach_errors)}
${row('bach_login_ms', metrics.bach_login_ms)}
${row('bach_api_ms', metrics.bach_api_ms)}
</tbody></table>
<pre>${JSON.stringify(summary.root_group || {}, null, 2)}</pre>
</body></html>`
fs.writeFileSync(outPath, html)
console.log('Wrote', outPath)
