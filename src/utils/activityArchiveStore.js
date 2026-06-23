export const ACTIVITY_ARCHIVE_STORAGE_KEY = 'erlenbox-activity-archive-log'
export const ACTIVITY_ARCHIVE_EVENT = 'erlenbox:activity-archive-updated'

const MAX_ENTRIES = 800

const MODULE_LABELS = {
  customers: 'Müşteriler',
  suppliers: 'Tedarikçiler',
  products: 'Hizmet ve Ürünler',
  crm: 'CRM',
  fieldSales: 'Saha Satış',
  workflow: 'Süreçler Yönetimi',
  settings: 'Ayarlar',
  personnel: 'Personel',
  projects: 'Yeni Proje',
  shopping: 'Shopping',
  treasury: 'Kasa',
  b2b: 'Bayi Yönetimi',
  omnichannel: 'Mesaj Merkezi',
  einvoice: 'E-Fatura',
  reports: 'Raporlar',
}

const ACTION_LABELS = {
  archive: 'Arşivlendi',
  delete: 'Silindi',
  restore: 'Geri Alındı',
  undo: 'Geri Alındı',
  create: 'Oluşturuldu',
  update: 'Güncellendi',
}

function createId(prefix = 'act') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function dispatchUpdate() {
  window.dispatchEvent(new CustomEvent(ACTIVITY_ARCHIVE_EVENT))
}

function cloneForStorage(value) {
  if (Array.isArray(value)) return value.map(cloneForStorage)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (['image', 'file', 'imageFile', 'url'].includes(key)) return [key, null]
        if (['instagramImages', 'webImages', 'videos', 'gallery', 'files'].includes(key)) return [key, []]
        return [key, cloneForStorage(item)]
      }),
    )
  }
  return value
}

export function formatActivityArchiveDate(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}

export function getActivityModuleLabel(module) {
  return MODULE_LABELS[module] || module || 'Sistem'
}

export function getActivityActionLabel(action) {
  return ACTION_LABELS[action] || action || 'İşlem'
}

export function readActivityEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACTIVITY_ARCHIVE_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeActivityEntries(entries) {
  const next = Array.isArray(entries) ? entries.slice(0, MAX_ENTRIES) : []
  localStorage.setItem(ACTIVITY_ARCHIVE_STORAGE_KEY, JSON.stringify(next))
  dispatchUpdate()
  return next
}

export function appendActivityEntry(entry) {
  const now = new Date().toISOString()
  const nextEntry = {
    id: entry.id || createId(),
    at: entry.at || now,
    action: entry.action || 'update',
    module: entry.module || 'system',
    entityType: entry.entityType || '',
    entityId: entry.entityId || '',
    entityLabel: entry.entityLabel || '',
    description: entry.description || '',
    snapshot: entry.snapshot == null ? null : cloneForStorage(entry.snapshot),
    undo: entry.undo || null,
    restoredAt: entry.restoredAt || '',
    restoredByEntryId: entry.restoredByEntryId || '',
  }
  return writeActivityEntries([nextEntry, ...readActivityEntries()])
}

export function markActivityEntryRestored(entryId) {
  const restoredAt = new Date().toISOString()
  const restoreEntryId = createId('restore')
  const entries = readActivityEntries()
  const target = entries.find((entry) => entry.id === entryId)
  const nextEntries = entries.map((entry) => (
    entry.id === entryId
      ? { ...entry, restoredAt, restoredByEntryId: restoreEntryId }
      : entry
  ))
  const restoreEntry = {
    id: restoreEntryId,
    at: restoredAt,
    action: 'restore',
    module: target?.module || 'system',
    entityType: target?.entityType || '',
    entityId: target?.entityId || '',
    entityLabel: target?.entityLabel || '',
    description: `${target?.entityLabel || 'Kayıt'} geri alındı.`,
    snapshot: null,
    undo: null,
  }
  return writeActivityEntries([restoreEntry, ...nextEntries])
}

export function filterActivityEntries({ modules = [], actions = [] } = {}) {
  const moduleSet = new Set(modules.filter(Boolean))
  const actionSet = new Set(actions.filter(Boolean))
  return readActivityEntries().filter((entry) => (
    (!moduleSet.size || moduleSet.has(entry.module))
    && (!actionSet.size || actionSet.has(entry.action))
  ))
}
