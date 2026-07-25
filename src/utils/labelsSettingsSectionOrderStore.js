const ORDER_KEY = 'bach-labels-settings-section-order'
export const LABELS_SETTINGS_SECTION_ORDER_EVENT = 'bach:labels-settings-section-order-updated'

/** Süreçler Yönetimi sayfasındaki sürükle-bırak bölüm kimlikleri (varsayılan sıra). */
export const DEFAULT_LABELS_SETTINGS_SECTION_ORDER = [
  'quote',
  'order',
  'depo',
  'production',
  'dashboard',
  'crm',
  'note',
  'salesRep',
  'status',
  'customer',
  'category',
  'cash',
  'tags',
]

const ALLOWED = new Set(DEFAULT_LABELS_SETTINGS_SECTION_ORDER)

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeOrder(order) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order))
  window.dispatchEvent(new CustomEvent(LABELS_SETTINGS_SECTION_ORDER_EVENT, { detail: { order } }))
  return order
}

export function loadLabelsSettingsSectionOrder() {
  const saved = readJson(ORDER_KEY, null)
  const base = Array.isArray(saved)
    ? saved.filter((id) => ALLOWED.has(id))
    : [...DEFAULT_LABELS_SETTINGS_SECTION_ORDER]
  const missing = DEFAULT_LABELS_SETTINGS_SECTION_ORDER.filter((id) => !base.includes(id))
  return [...base, ...missing]
}

export function saveLabelsSettingsSectionOrder(order) {
  const clean = (Array.isArray(order) ? order : []).filter((id) => ALLOWED.has(id))
  const missing = DEFAULT_LABELS_SETTINGS_SECTION_ORDER.filter((id) => !clean.includes(id))
  return writeOrder([...clean, ...missing])
}

export function reorderLabelsSettingsSectionOrder(fromIndex, toIndex) {
  const current = loadLabelsSettingsSectionOrder()
  if (
    fromIndex == null ||
    toIndex == null ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= current.length ||
    toIndex >= current.length
  ) {
    return current
  }
  const next = [...current]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return saveLabelsSettingsSectionOrder(next)
}
