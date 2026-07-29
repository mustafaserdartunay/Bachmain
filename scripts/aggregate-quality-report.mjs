#!/usr/bin/env node
/**
 * Aggregate HTML failure report across Playwright / k6 / Bruno / Lighthouse.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'tests', 'reports')
fs.mkdirSync(ROOT, { recursive: true })

const sections = []

function addSection(title, relative) {
  const full = path.join(ROOT, relative)
  const exists = fs.existsSync(full)
  sections.push({ title, relative, exists })
}

addSection('Playwright HTML', 'playwright/html/index.html')
addSection('Playwright JSON', 'playwright/results.json')
addSection('k6 index', 'k6/index.html')
addSection('Bruno', 'bruno/index.html')
addSection('Bruno rate limit', 'bruno/rate-limit.html')
addSection('Lighthouse', 'lighthouse/index.html')

const failedArtifacts = []
function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (/FAILED|fail|error/i.test(ent.name)) failedArtifacts.push(path.relative(ROOT, p))
  }
}
walk(ROOT)

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>BachMain quality reports</title>
<style>
body{font-family:system-ui;margin:2rem;line-height:1.45;color:#18181b}
a{color:#1d4ed8} .missing{color:#a1a1aa} .fail{color:#b91c1c}
ul{padding-left:1.2rem}
</style></head><body>
<h1>BachMain quality & observability reports</h1>
<p>Generated ${new Date().toISOString()}</p>
<h2>Report index</h2>
<ul>
${sections
  .map(
    (s) =>
      `<li>${s.exists ? `<a href="./${s.relative}">${s.title}</a>` : `<span class="missing">${s.title} (not generated yet)</span>`}</li>`,
  )
  .join('\n')}
</ul>
<h2 class="fail">Failure artifacts</h2>
${
  failedArtifacts.length
    ? `<ul>${failedArtifacts.map((f) => `<li class="fail"><a href="./${f}">${f}</a></li>`).join('')}</ul>`
    : '<p>No FAILED.* artifacts found in this run.</p>'
}
<h2>Suggested next tests</h2>
<ul>
<li>Playwright: multi-tenant isolation, invoice PDF download, Stripe checkout happy-path (staging only)</li>
<li>k6: authenticated write path for teklif/sipariş create with seeded tokens</li>
<li>Bruno: MFA challenge, refresh-token rotation, webhook signature negative tests</li>
<li>Lighthouse: authenticated CRM routes via storageState</li>
<li>Contract tests (OpenAPI) against apps/api route map</li>
<li>Visual regression (Playwright screenshots) for AppPageHeader / SplitCreateButton</li>
</ul>
</body></html>`
fs.writeFileSync(path.join(ROOT, 'index.html'), html)
console.log('Wrote', path.join(ROOT, 'index.html'))
