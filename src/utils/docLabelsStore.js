/**
 * Document Center labels — tenant-scoped via workspace sync.
 */
import { softDeleteRecord, restoreDeletedRecord } from './deletedRecordsStore'
import { getLabelPreset } from './labelPresets'

const STORAGE_KEY = 'erlenbox-doc-labels'
export const DOC_LABELS_EVENT = 'bach:doc-labels-updated'

export function emptyDocLabel(partial = {}) {
  const preset = getLabelPreset(partial.presetId || '50x30')
  return {
    id: `lbl-${Date.now()}`,
    name: 'Yeni Etiket',
    presetId: preset.id,
    widthMm: partial.widthMm ?? preset.widthMm,
    heightMm: partial.heightMm ?? preset.heightMm,
    copies: 1,
    gridCols: 1,
    gridRows: 1,
    showTitle: true,
    titleText: '{{urun.ad}}',
    showSku: true,
    skuText: '{{urun.sku}}',
    showCompany: true,
    companyText: '{{sirket.unvan}}',
    barcodeEnabled: true,
    barcodeSymbology: 'CODE128',
    barcodeValue: '{{urun.barkod}}',
    barcodeHeightMm: 12,
    barcodeShowText: true,
    qrEnabled: false,
    qrValue: '{{belge.url}}',
    qrSizeMm: 18,
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
  window.dispatchEvent(new CustomEvent(DOC_LABELS_EVENT))
}

export function loadDocLabels() {
  return readAll().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
}

export function getDocLabelById(id) {
  return readAll().find((item) => item.id === id) || null
}

export function saveDocLabel(label) {
  const list = readAll()
  const next = {
    ...emptyDocLabel(),
    ...label,
    updatedAt: new Date().toISOString(),
  }
  const index = list.findIndex((item) => item.id === next.id)
  if (index >= 0) list[index] = { ...list[index], ...next }
  else list.unshift(next)
  writeAll(list)
  return next
}

export function softDeleteDocLabel(labelId) {
  const list = readAll()
  const label = list.find((item) => item.id === labelId)
  if (!label) return null
  writeAll(list.filter((item) => item.id !== labelId))
  softDeleteRecord('docLabels', label, { entityLabel: label.name })
  return label
}

export function restoreDocLabel(labelId) {
  const record = restoreDeletedRecord('docLabels', labelId)
  if (!record) return null
  return saveDocLabel(record)
}
