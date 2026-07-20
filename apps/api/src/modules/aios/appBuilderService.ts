import { AppError } from '../../shared/errors.js'
import { getAppBuilderCatalog, scaffoldFromNaturalLanguage } from './appBuilderCatalog.js'

type DraftRow = {
  id: string
  companyId: string
  name: string
  slug: string
  status: 'draft' | 'preview' | 'published'
  prompt: string
  scaffold: ReturnType<typeof scaffoldFromNaturalLanguage>
  version: number
  createdAt: string
  updatedAt: string
  publishMeta?: Record<string, unknown>
}

const draftsByCompany = new Map<string, DraftRow[]>()

function uid() {
  return `abd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function appBuilderOverview(companyId: string) {
  const rows = draftsByCompany.get(companyId) || []
  return {
    version: 'AB-0',
    drafts: rows.length,
    published: rows.filter((r) => r.status === 'published').length,
    preview: rows.filter((r) => r.status === 'preview').length,
    catalog: getAppBuilderCatalog(),
    deepLinks: {
      workflow: '/otomasyon/designer',
      analytics: '/analitik?tab=builder',
      documents: '/belge-merkezi/tasarimci',
      plugins: '/platform?tab=plugins',
    },
  }
}

export function listAppBuilderDrafts(companyId: string) {
  return draftsByCompany.get(companyId) || []
}

export function createAppBuilderDraft(companyId: string, prompt: string) {
  const scaffold = scaffoldFromNaturalLanguage(prompt)
  const now = new Date().toISOString()
  const row: DraftRow = {
    id: uid(),
    companyId,
    name: scaffold.name,
    slug: scaffold.slug,
    status: 'draft',
    prompt: String(prompt || '').trim(),
    scaffold,
    version: 1,
    createdAt: now,
    updatedAt: now,
  }
  const list = draftsByCompany.get(companyId) || []
  draftsByCompany.set(companyId, [row, ...list].slice(0, 100))
  return row
}

export function nlAppBuilder(companyId: string, prompt: string) {
  if (!String(prompt || '').trim()) throw new AppError('VALIDATION', 'prompt gerekli', 400)
  return createAppBuilderDraft(companyId, prompt)
}

export function publishAppBuilderDraft(companyId: string, draftId: string) {
  const list = draftsByCompany.get(companyId) || []
  const idx = list.findIndex((d) => d.id === draftId)
  if (idx < 0) throw new AppError('NOT_FOUND', 'Taslak bulunamadı', 404)
  const row = list[idx]
  const published: DraftRow = {
    ...row,
    status: 'published',
    version: row.version + 1,
    updatedAt: new Date().toISOString(),
    publishMeta: {
      pluginCode: `plugin.${row.slug}`,
      channel: 'platform_plugins',
      note: 'AB-0 stub — Plugin SDK kaydı Platform Center’da tamamlanır (PC-2).',
    },
  }
  list[idx] = published
  draftsByCompany.set(companyId, list)
  return published
}
