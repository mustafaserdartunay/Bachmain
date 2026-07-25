import { CUSTOM_PROCESS_PANELS_EVENT, getCustomProcessPanels } from './customProcessPanelsStore'

const ORDER_KEY = 'bach-option-section-process-order'
export const OPTION_SECTION_PROCESS_ORDER_EVENT = 'bach:option-section-process-order-updated'

/** Bölüm bazlı yerleşik süreç satırları (müşteri hariç — o ayrı store). */
export const BUILTIN_OPTION_SECTION_ROWS = {
  status: [
    {
      fieldKey: 'status',
      title: 'Teklif Durumu',
      description: 'Taslak, onaylandı, reddedildi vb.',
      activeLabel: 'Aktif Durum',
      countSuffix: 'durum tanımlı',
      emptyMessage: 'Henüz durum eklenmedi.',
      placeholder: 'Yeni durum adı...',
      builtin: true,
    },
    {
      fieldKey: 'orderStatus',
      title: 'Sipariş Durumu',
      description: 'Yeni, üretimde, tamamlandı vb.',
      activeLabel: 'Aktif Durum',
      countSuffix: 'durum tanımlı',
      emptyMessage: 'Henüz durum eklenmedi.',
      placeholder: 'Yeni durum adı...',
      builtin: true,
    },
    {
      fieldKey: 'priority',
      title: 'Öncelik',
      description: 'Teklif ve sipariş listelerinde görünür.',
      activeLabel: 'Aktif Öncelik',
      countSuffix: 'öncelik tanımlı',
      emptyMessage: 'Henüz öncelik eklenmedi.',
      placeholder: 'Yeni öncelik adı...',
      builtin: true,
    },
  ],
  category: [
    {
      fieldKey: 'category',
      title: 'Müşteri Kategorileri',
      description: 'Müşteri sektör kategorileri.',
      activeLabel: 'Aktif Kategori',
      countSuffix: 'kategori tanımlı',
      emptyMessage: 'Henüz kategori eklenmedi.',
      placeholder: 'Yeni müşteri kategorisi...',
      builtin: true,
    },
    {
      fieldKey: 'productCategory',
      title: 'Ürün Kategorileri',
      description: 'Stok ürün kategorileri.',
      activeLabel: 'Aktif Kategori',
      countSuffix: 'kategori tanımlı',
      emptyMessage: 'Henüz kategori eklenmedi.',
      placeholder: 'Yeni ürün kategorisi...',
      builtin: true,
    },
  ],
  cash: [
    {
      fieldKey: 'account',
      title: 'Kasa Türleri',
      description: 'Kasa oluşturma formundaki tür seçenekleri.',
      activeLabel: 'Aktif Kasa Türü',
      countSuffix: 'tür tanımlı',
      emptyMessage: 'Henüz kasa türü eklenmedi.',
      placeholder: 'Yeni kasa türü...',
      builtin: true,
    },
  ],
  tags: [
    {
      fieldKey: 'tags',
      title: 'Etiketler',
      description: 'Teklif ve ürünlerde kullanılabilecek etiket önerileri.',
      activeLabel: 'Aktif Etiket',
      countSuffix: 'etiket tanımlı',
      emptyMessage: 'Henüz etiket eklenmedi.',
      placeholder: 'Yeni etiket adı...',
      builtin: true,
    },
  ],
  salesRep: [
    {
      fieldKey: '__salesRepTaskStages__',
      title: 'Görev Süreç Aşamaları',
      description: 'Satış temsilcisi görevlerinde kullanılan süreç adımları.',
      activeLabel: 'Aktif Aşama',
      countSuffix: 'aşama tanımlı',
      emptyMessage: 'Henüz görev aşaması eklenmedi.',
      placeholder: 'Yeni görev aşaması...',
      builtin: true,
      special: 'salesRepTaskStages',
    },
  ],
}

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

function writeAll(map) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(map))
  window.dispatchEvent(new CustomEvent(OPTION_SECTION_PROCESS_ORDER_EVENT, { detail: { map } }))
  return map
}

function customFieldKeys(sectionId) {
  return (getCustomProcessPanels(sectionId) || []).map((panel) => panel.fieldKey).filter(Boolean)
}

function builtinKeys(sectionId) {
  return (BUILTIN_OPTION_SECTION_ROWS[sectionId] || []).map((row) => row.fieldKey)
}

export function loadOptionSectionProcessOrder(sectionId) {
  const builtins = builtinKeys(sectionId)
  const customs = customFieldKeys(sectionId)
  const allowed = new Set([...builtins, ...customs])
  const all = readJson(ORDER_KEY, {}) || {}
  const saved = Array.isArray(all[sectionId]) ? all[sectionId] : null
  const base = saved ? saved.filter((key) => allowed.has(key)) : [...builtins]
  const missingBuiltins = builtins.filter((key) => !base.includes(key))
  const missingCustoms = customs.filter((key) => !base.includes(key))
  return [...base, ...missingBuiltins, ...missingCustoms]
}

export function saveOptionSectionProcessOrder(sectionId, order) {
  const builtins = builtinKeys(sectionId)
  const customs = customFieldKeys(sectionId)
  const allowed = new Set([...builtins, ...customs])
  const clean = (Array.isArray(order) ? order : []).filter((key) => allowed.has(key))
  const missingBuiltins = builtins.filter((key) => !clean.includes(key))
  const missingCustoms = customs.filter((key) => !clean.includes(key))
  const nextOrder = [...clean, ...missingBuiltins, ...missingCustoms]
  const all = readJson(ORDER_KEY, {}) || {}
  return writeAll({ ...all, [sectionId]: nextOrder })
}

export function reorderOptionSectionProcessOrder(sectionId, fromIndex, toIndex) {
  const current = loadOptionSectionProcessOrder(sectionId)
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
  saveOptionSectionProcessOrder(sectionId, next)
  return next
}

export function resolveOptionSectionProcessRows(sectionId) {
  const order = loadOptionSectionProcessOrder(sectionId)
  const builtinByKey = Object.fromEntries(
    (BUILTIN_OPTION_SECTION_ROWS[sectionId] || []).map((row) => [row.fieldKey, row]),
  )
  const customByKey = Object.fromEntries(
    (getCustomProcessPanels(sectionId) || [])
      .filter((panel) => panel.fieldKey)
      .map((panel) => [panel.fieldKey, panel]),
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

export function syncOptionSectionProcessOrderWithPanels(sectionId) {
  return saveOptionSectionProcessOrder(sectionId, loadOptionSectionProcessOrder(sectionId))
}

export function syncAllOptionSectionProcessOrders() {
  Object.keys(BUILTIN_OPTION_SECTION_ROWS).forEach((sectionId) => {
    syncOptionSectionProcessOrderWithPanels(sectionId)
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener(CUSTOM_PROCESS_PANELS_EVENT, () => {
    syncAllOptionSectionProcessOrders()
  })
}
