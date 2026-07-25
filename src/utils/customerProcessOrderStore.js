import { CUSTOM_PROCESS_PANELS_EVENT, getCustomProcessPanels } from './customProcessPanelsStore'

const ORDER_KEY = 'bach-customer-process-order'
export const CUSTOMER_PROCESS_ORDER_EVENT = 'bach:customer-process-order-updated'

export const BUILTIN_CUSTOMER_PROCESS_FIELDS = [
  {
    fieldKey: 'type',
    title: 'Tipi',
    description: 'Müşteri listesi ve kayıtlarında kullanılır.',
    activeLabel: 'Aktif Tip',
    countSuffix: 'tip tanımlı',
    emptyMessage: 'Henüz tip eklenmedi.',
    placeholder: 'Yeni tip adı...',
    builtin: true,
  },
  {
    fieldKey: 'representative',
    title: 'Temsilci',
    description: 'Müşteri listesi temsilci sütunu ve filtreleri.',
    activeLabel: 'Aktif Temsilci',
    countSuffix: 'temsilci tanımlı',
    emptyMessage: 'Henüz temsilci eklenmedi.',
    placeholder: 'Yeni temsilci adı...',
    builtin: true,
  },
  {
    fieldKey: 'scoring',
    title: 'Puantaj',
    description: 'Müşteri puantaj değerlendirmesi.',
    activeLabel: 'Aktif Puantaj',
    countSuffix: 'puantaj tanımlı',
    emptyMessage: 'Henüz puantaj eklenmedi.',
    placeholder: 'Yeni puantaj adı...',
    builtin: true,
  },
]

const BUILTIN_KEYS = BUILTIN_CUSTOMER_PROCESS_FIELDS.map((item) => item.fieldKey)

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
  window.dispatchEvent(new CustomEvent(CUSTOMER_PROCESS_ORDER_EVENT, { detail: { order } }))
  return order
}

function customFieldKeys() {
  return (getCustomProcessPanels('customer') || []).map((panel) => panel.fieldKey).filter(Boolean)
}

/** Mevcut custom + builtin alanlarla senkronize sıra. */
export function loadCustomerProcessOrder() {
  const customs = customFieldKeys()
  const allowed = new Set([...BUILTIN_KEYS, ...customs])
  const saved = readJson(ORDER_KEY, null)
  const base = Array.isArray(saved) ? saved.filter((key) => allowed.has(key)) : [...BUILTIN_KEYS]
  const missingBuiltins = BUILTIN_KEYS.filter((key) => !base.includes(key))
  const missingCustoms = customs.filter((key) => !base.includes(key))
  return [...base, ...missingBuiltins, ...missingCustoms]
}

export function saveCustomerProcessOrder(order) {
  const customs = customFieldKeys()
  const allowed = new Set([...BUILTIN_KEYS, ...customs])
  const clean = (Array.isArray(order) ? order : []).filter((key) => allowed.has(key))
  const missingBuiltins = BUILTIN_KEYS.filter((key) => !clean.includes(key))
  const missingCustoms = customs.filter((key) => !clean.includes(key))
  return writeOrder([...clean, ...missingBuiltins, ...missingCustoms])
}

export function reorderCustomerProcessOrder(fromIndex, toIndex) {
  const current = loadCustomerProcessOrder()
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
  return saveCustomerProcessOrder(next)
}

/** Sıralı süreç satırları (ayarlar + müşteri sayfası). */
export function resolveCustomerProcessRows() {
  const order = loadCustomerProcessOrder()
  const customByKey = Object.fromEntries(
    (getCustomProcessPanels('customer') || [])
      .filter((panel) => panel.fieldKey)
      .map((panel) => [panel.fieldKey, panel]),
  )
  const builtinByKey = Object.fromEntries(
    BUILTIN_CUSTOMER_PROCESS_FIELDS.map((item) => [item.fieldKey, item]),
  )

  return order
    .map((fieldKey) => {
      if (builtinByKey[fieldKey]) {
        return { ...builtinByKey[fieldKey], id: fieldKey }
      }
      const panel = customByKey[fieldKey]
      if (!panel) return null
      return {
        id: panel.id,
        fieldKey: panel.fieldKey,
        title: panel.title,
        description: panel.description || 'Özel süreç listesi.',
        activeLabel: 'Aktif Seçenek',
        countSuffix: 'seçenek tanımlı',
        emptyMessage: 'Henüz seçenek eklenmedi.',
        placeholder: 'Yeni seçenek adı...',
        builtin: false,
        panel,
      }
    })
    .filter(Boolean)
}

/** Custom panel eklendiğinde / silindiğinde sırayı güncel tut. */
export function syncCustomerProcessOrderWithPanels() {
  return saveCustomerProcessOrder(loadCustomerProcessOrder())
}

if (typeof window !== 'undefined') {
  window.addEventListener(CUSTOM_PROCESS_PANELS_EVENT, () => {
    syncCustomerProcessOrderWithPanels()
  })
}
