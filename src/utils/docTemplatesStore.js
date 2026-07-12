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
    docType: 'quote', // quote | order | production | label | generic
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
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
