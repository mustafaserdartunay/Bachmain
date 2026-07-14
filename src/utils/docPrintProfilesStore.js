/**
 * Yazıcı / Print Profiles — local workspace store.
 */

const STORAGE_KEY = 'bach-doc-print-profiles'
export const PRINT_PROFILES_EVENT = 'bach:print-profiles-updated'

export const BARCODE_PRINTER_BRANDS = ['Zebra', 'TSC', 'Godex', 'Argox', 'Citizen', 'Diğer']

export const OUTPUT_TARGETS = [
  { id: 'browser', label: 'Tarayıcı Yazdır' },
  { id: 'pdf', label: 'PDF' },
  { id: 'png', label: 'PNG' },
  { id: 'csv', label: 'Excel (CSV)' },
  { id: 'html', label: 'Word (HTML)' },
]

export function emptyPrintProfile(partial = {}) {
  return {
    id: `prn-${Date.now()}`,
    name: 'Yeni Profil',
    printerName: '',
    brand: 'Diğer',
    pageSize: 'A4',
    orientation: 'portrait',
    copies: 1,
    autoPrint: false,
    outputTarget: 'pdf',
    marginTop: 15,
    marginRight: 15,
    marginBottom: 15,
    marginLeft: 15,
    defaultForDocType: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(PRINT_PROFILES_EVENT))
}

export function listPrintProfiles() {
  return readAll().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
}

export function getPrintProfileById(id) {
  return readAll().find((p) => p.id === id) || null
}

export function savePrintProfile(profile) {
  const list = readAll()
  const next = {
    ...emptyPrintProfile(profile),
    id: profile.id || `prn-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  }
  const idx = list.findIndex((p) => p.id === next.id)
  if (idx >= 0) list[idx] = { ...list[idx], ...next }
  else list.unshift(next)
  writeAll(list)
  return next
}

export function deletePrintProfile(id) {
  writeAll(readAll().filter((p) => p.id !== id))
}

export function getDefaultProfileForDocType(docType) {
  return listPrintProfiles().find((p) => p.defaultForDocType === docType) || null
}
