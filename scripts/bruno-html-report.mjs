#!/usr/bin/env node
import fs from 'node:fs'

const [inPath, outPath] = process.argv.slice(2)
if (!inPath || !outPath) {
  console.error('Usage: bruno-html-report.mjs <results.json> <out.html>')
  process.exit(1)
}

let data = { skipped: true }
if (fs.existsSync(inPath)) {
  try {
    data = JSON.parse(fs.readFileSync(inPath, 'utf8'))
  } catch {
    data = { parseError: true }
  }
}

const failures = []
const walk = (node, trail = []) => {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach((n, i) => walk(n, [...trail, String(i)]))
    return
  }
  if (node.error || node.assertionResults?.some?.((a) => a.status === 'fail')) {
    failures.push({ path: trail.join('/'), detail: node.error || node.assertionResults })
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'results' || k === 'requests' || k === 'items' || Array.isArray(v))
      walk(v, [...trail, k])
  }
}
walk(data)

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Bruno API report</title>
<style>body{font-family:system-ui;margin:2rem}.fail{color:#b91c1c}pre{background:#f4f4f5;padding:1rem;overflow:auto}</style>
</head><body>
<h1>Bruno API collection report</h1>
<p>Generated ${new Date().toISOString()}</p>
<p>Failures: <span class="${failures.length ? 'fail' : ''}">${failures.length}</span></p>
${failures.length ? `<h2 class="fail">Failed assertions</h2><pre>${JSON.stringify(failures, null, 2)}</pre>` : '<p>No structured failures detected (or CLI skipped).</p>'}
<h2>Raw</h2>
<pre>${JSON.stringify(data, null, 2).slice(0, 50000)}</pre>
</body></html>`
fs.writeFileSync(outPath, html)
console.log('Wrote', outPath)
