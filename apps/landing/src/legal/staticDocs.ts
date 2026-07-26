import {
  LEGAL_DOC_TYPES,
  DEFAULT_LEGAL_COMPANY,
  buildDraftBody,
  LAWYER_NOTICE,
  type LegalDocType,
} from './catalog'

/** Simple markdown → HTML (static export friendly). */
export function markdownToHtml(md: string) {
  const lines = String(md || '').split(/\r?\n/)
  const out: string[] = []
  let para: string[] = []
  const flush = () => {
    if (!para.length) return
    out.push(`<p>${escapeHtml(para.join(' ').trim())}</p>`)
    para = []
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flush()
      continue
    }
    if (line.startsWith('# ')) {
      flush()
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`)
      continue
    }
    if (line.startsWith('## ')) {
      flush()
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      flush()
      out.push(`<li>${escapeHtml(line.replace(/^[-•]\s+/, ''))}</li>`)
      continue
    }
    para.push(line.trim())
  }
  flush()
  let html = out.join('\n')
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
  return html
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const PUBLISHED_AT = '2026-07-26T00:00:00.000Z'

export function getStaticLegalDoc(typeOrSlug: string) {
  const meta =
    LEGAL_DOC_TYPES.find((d: (typeof LEGAL_DOC_TYPES)[number]) => {
      return (
        d.type === typeOrSlug ||
        d.slug === typeOrSlug ||
        (d.aliases as readonly string[]).includes(typeOrSlug)
      )
    }) || null
  if (!meta) return null
  const bodyMarkdown = buildDraftBody(meta.type as LegalDocType, DEFAULT_LEGAL_COMPANY)
  return {
    type: meta.type,
    slug: meta.slug,
    title: meta.title,
    version: '1.0.0',
    publishedAt: PUBLISHED_AT,
    revisionAt: PUBLISHED_AT,
    bodyMarkdown,
    bodyHtml: markdownToHtml(bodyMarkdown),
    companyName: DEFAULT_LEGAL_COMPANY.legalName,
    lawyerNotice: LAWYER_NOTICE,
  }
}

export { LEGAL_DOC_TYPES, LAWYER_NOTICE }
export { CONSENT_PACKS } from './catalog'
