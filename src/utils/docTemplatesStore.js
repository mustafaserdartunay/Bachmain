/**
 * Document Center templates — tenant-scoped via workspace sync.
 */
import { softDeleteRecord, restoreDeletedRecord } from './deletedRecordsStore'

const STORAGE_KEY = 'erlenbox-doc-templates'
export const DOC_TEMPLATES_EVENT = 'bach:doc-templates-updated'

export function emptyDocTemplate(partial = {}) {
  return {
    id: `tpl-${Date.now()}`,
    name: 'Yeni Şablon',
    docType: 'quote', // quote | order | invoice | waybill | production | label | pos | generic
    pageSize: 'A4',
    orientation: 'portrait',
    headerHtml: '<h1>{{sirket.unvan}}</h1><p>{{sirket.adres}}</p>',
    bodyHtml: [
      '<p><strong>Müşteri:</strong> {{musteri.unvan}}</p>',
      '<p><strong>Belge No:</strong> {{belge.no}}</p>',
      '<p><strong>Tarih:</strong> {{belge.tarih}}</p>',
      '<hr />',
      '<div>{{kalemler_html}}</div>',
      '<p style="text-align:right"><strong>Toplam:</strong> {{belge.toplam}}</p>',
    ].join('\n'),
    footerHtml: '<p style="font-size:11px;color:#666">{{sirket.unvan}} · {{sirket.telefon}}</p>',
    // Visual designer foundation (HTML fields above are preserved)
    designMode: 'visual',
    blocks: [],
    status: 'draft', // draft | published | archived
    version: 1,
    versions: [],
    zoom: 1,
    themeId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

function snapshotVersion(template) {
  return {
    version: template.version || 1,
    savedAt: new Date().toISOString(),
    name: template.name,
    status: template.status || 'draft',
    designMode: template.designMode || 'visual',
    pageSize: template.pageSize,
    orientation: template.orientation,
    headerHtml: template.headerHtml,
    bodyHtml: template.bodyHtml,
    footerHtml: template.footerHtml,
    blocks: Array.isArray(template.blocks) ? structuredClone(template.blocks) : [],
    themeId: template.themeId ?? null,
    zoom: template.zoom ?? 1,
  }
}

/** Deep-ish clone of a template as a new draft. */
export function duplicateDocTemplate(template, overrides = {}) {
  if (!template) return null
  const copy = emptyDocTemplate({
    ...template,
    id: `tpl-${Date.now()}`,
    name: `${template.name || 'Şablon'} (kopya)`,
    status: 'draft',
    version: 1,
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: Array.isArray(template.blocks) ? structuredClone(template.blocks) : [],
    ...overrides,
  })
  return saveDocTemplate(copy)
}

/** Mark template published and bump version (keeps previous snapshot). */
export function publishDocTemplate(templateId) {
  const current = getDocTemplateById(templateId)
  if (!current) return null
  const versions = [...(current.versions || []), snapshotVersion(current)]
  return saveDocTemplate({
    ...current,
    status: 'published',
    version: (current.version || 1) + 1,
    versions,
  })
}

/** Soft-archive without deleting (status only). */
export function archiveDocTemplate(templateId) {
  const current = getDocTemplateById(templateId)
  if (!current) return null
  return saveDocTemplate({
    ...current,
    status: 'archived',
  })
}

/**
 * Restore a prior version snapshot onto the live template.
 * Pushes the current state into `versions` before overwrite.
 */
export function restoreDocTemplateVersion(templateId, versionNumber) {
  const current = getDocTemplateById(templateId)
  if (!current) return null
  const snap = (current.versions || []).find((item) => item.version === versionNumber)
  if (!snap) return null

  const versions = [...(current.versions || []), snapshotVersion(current)]
  return saveDocTemplate({
    ...current,
    name: snap.name ?? current.name,
    status: 'draft',
    designMode: snap.designMode || current.designMode || 'visual',
    pageSize: snap.pageSize || current.pageSize,
    orientation: snap.orientation || current.orientation,
    headerHtml: snap.headerHtml ?? current.headerHtml,
    bodyHtml: snap.bodyHtml ?? current.bodyHtml,
    footerHtml: snap.footerHtml ?? current.footerHtml,
    blocks: Array.isArray(snap.blocks) ? structuredClone(snap.blocks) : [],
    themeId: snap.themeId ?? current.themeId ?? null,
    zoom: snap.zoom ?? current.zoom ?? 1,
    version: (current.version || 1) + 1,
    versions,
  })
}

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(DOC_TEMPLATES_EVENT))
}

export function loadDocTemplates() {
  return readAll().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
}

export function getDocTemplateById(id) {
  return readAll().find((item) => item.id === id) || null
}

export function saveDocTemplate(template) {
  const list = readAll()
  const next = {
    ...emptyDocTemplate(),
    ...template,
    updatedAt: new Date().toISOString(),
  }
  const index = list.findIndex((item) => item.id === next.id)
  if (index >= 0) list[index] = { ...list[index], ...next }
  else list.unshift(next)
  writeAll(list)
  return next
}

export function softDeleteDocTemplate(templateId) {
  const list = readAll()
  const template = list.find((item) => item.id === templateId)
  if (!template) return null
  writeAll(list.filter((item) => item.id !== templateId))
  softDeleteRecord('docTemplates', template, { entityLabel: template.name })
  return template
}

export function restoreDocTemplate(templateId) {
  const record = restoreDeletedRecord('docTemplates', templateId)
  if (!record) return null
  return saveDocTemplate(record)
}

export function listTemplatesByDocType(docType) {
  return loadDocTemplates().filter((item) => !docType || item.docType === docType)
}
