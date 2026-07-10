import { QUICK_ACTIONS } from './dashboardModernData'

export const DASHBOARD_LAYOUT_STORAGE_KEY = 'bach-dashboard-layout'
export const DASHBOARD_LAYOUT_EVENT = 'bach:dashboard-layout-updated'

export const DASHBOARD_SECTION_IDS = {
  finance: 'finance',
  quickActions: 'quick-actions',
  timeline: 'timeline',
  crmActivity: 'crm-activity',
  taxStatus: 'tax-status',
  customBlocks: 'custom-blocks',
}

export const DEFAULT_DASHBOARD_SECTIONS = [
  { id: 'finance', label: 'Finans Özeti', visible: true },
  { id: 'quick-actions', label: 'Hızlı İşlemler', visible: true },
  { id: 'crm-activity', label: 'CRM Aktivite Özeti', visible: true },
  { id: 'custom-blocks', label: 'Dinamik Bloklar', visible: true },
  { id: 'timeline', label: 'Tekrarlayan Ödemeler Zaman Çizelgesi', visible: true },
  { id: 'tax-status', label: 'KDV Durumu', visible: true },
]

const QUICK_ACTION_TONES = {
  blue: {
    surface: 'from-blue-500/10 via-blue-50 to-white',
    border: 'border-blue-100 hover:border-blue-200',
    text: 'text-blue-700',
    chip: 'bg-blue-500/10 text-blue-700',
  },
  emerald: {
    surface: 'from-emerald-500/10 via-emerald-50 to-white',
    border: 'border-emerald-100 hover:border-emerald-200',
    text: 'text-emerald-700',
    chip: 'bg-emerald-500/10 text-emerald-700',
  },
  fuchsia: {
    surface: 'from-fuchsia-500/10 via-fuchsia-50 to-white',
    border: 'border-fuchsia-100 hover:border-fuchsia-200',
    text: 'text-fuchsia-700',
    chip: 'bg-fuchsia-500/10 text-fuchsia-700',
  },
  cyan: {
    surface: 'from-cyan-500/10 via-cyan-50 to-white',
    border: 'border-cyan-100 hover:border-cyan-200',
    text: 'text-cyan-700',
    chip: 'bg-cyan-500/10 text-cyan-700',
  },
  amber: {
    surface: 'from-amber-500/10 via-amber-50 to-white',
    border: 'border-amber-100 hover:border-amber-200',
    text: 'text-amber-700',
    chip: 'bg-amber-500/10 text-amber-700',
  },
  orange: {
    surface: 'from-orange-500/10 via-orange-50 to-white',
    border: 'border-orange-100 hover:border-orange-200',
    text: 'text-orange-700',
    chip: 'bg-orange-500/10 text-orange-700',
  },
  violet: {
    surface: 'from-violet-500/10 via-violet-50 to-white',
    border: 'border-violet-100 hover:border-violet-200',
    text: 'text-violet-700',
    chip: 'bg-violet-500/10 text-violet-700',
  },
  teal: {
    surface: 'from-teal-500/10 via-teal-50 to-white',
    border: 'border-teal-100 hover:border-teal-200',
    text: 'text-teal-700',
    chip: 'bg-teal-500/10 text-teal-700',
  },
}

export const QUICK_ACTION_ICON_OPTIONS = [
  { id: 'file-text', label: 'Dosya' },
  { id: 'cart', label: 'Sepet' },
  { id: 'factory', label: 'Üretim' },
  { id: 'users', label: 'Kullanıcılar' },
  { id: 'handshake', label: 'Tedarikçi' },
  { id: 'warehouse', label: 'Depo' },
  { id: 'package-check', label: 'Teslim' },
]

export const CUSTOM_BLOCK_TYPES = [
  { id: 'link', label: 'Bağlantı Kartı' },
  { id: 'note', label: 'Bilgi Notu' },
]

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeLabel(label) {
  return String(label || '').trim().toLocaleLowerCase('tr-TR')
}

export function getDefaultQuickActionConfigs() {
  return QUICK_ACTIONS.map((action) => ({
    id: action.id,
    label: action.label,
    href: action.href,
    createHref: action.createHref,
    icon: action.icon,
    tone: action.tone,
    visible: true,
    isCustom: false,
  }))
}

function mergeQuickActionConfigs(saved) {
  const defaults = getDefaultQuickActionConfigs()
  const removedIds = new Set(['customer', 'supplier', 'stock'])
  const savedList = (Array.isArray(saved) ? saved : []).filter((item) => !removedIds.has(item?.id))
  const savedById = new Map(savedList.map((item) => [item.id, item]))
  const knownIds = defaults.map((item) => item.id).join('|')
  const savedKnownIds = savedList
    .filter((item) => defaults.some((defaultItem) => defaultItem.id === item.id))
    .map((item) => item.id)
    .join('|')

  const mergedDefaults = (knownIds === savedKnownIds ? savedList.filter((item) => savedById.has(item.id) && defaults.some((d) => d.id === item.id)) : defaults)
    .map((item, index) => {
      const fallback = defaults.find((defaultItem) => defaultItem.id === item.id) || defaults[index % defaults.length]
      const current = savedById.get(item.id) || item
      return {
        ...fallback,
        ...current,
        id: fallback.id,
        isCustom: false,
        visible: current.visible !== false,
      }
    })

  const customs = savedList
    .filter((item) => item.isCustom && !defaults.some((defaultItem) => defaultItem.id === item.id))
    .map((item) => ({
      id: item.id || createId('quick-action'),
      label: String(item.label || 'Yeni Kart').trim(),
      href: String(item.href || '/').trim(),
      createHref: String(item.createHref || item.href || '/').trim(),
      icon: item.icon || 'file-text',
      tone: item.tone || 'blue',
      visible: item.visible !== false,
      isCustom: true,
    }))

  return [...mergedDefaults, ...customs]
}

function mergeSections(saved) {
  const savedList = Array.isArray(saved) ? saved : []
  const savedById = new Map(savedList.map((item) => [item.id, item]))
  const merged = DEFAULT_DASHBOARD_SECTIONS.map((section) => ({
    ...section,
    ...(savedById.get(section.id) || {}),
    id: section.id,
    label: String(savedById.get(section.id)?.label || section.label).trim() || section.label,
    visible: savedById.get(section.id)?.visible !== false,
  }))

  savedList.forEach((section) => {
    if (!DEFAULT_DASHBOARD_SECTIONS.some((defaultSection) => defaultSection.id === section.id)) {
      merged.push({
        id: section.id || createId('dashboard-section'),
        label: String(section.label || 'Özel Panel').trim(),
        visible: section.visible !== false,
        isCustom: true,
      })
    }
  })

  const orderIds = savedList.map((item) => item.id).filter(Boolean)
  if (!orderIds.length) return merged

  const orderMap = new Map(orderIds.map((id, index) => [id, index]))
  return [...merged].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
}

function normalizeCustomBlocks(blocks) {
  if (!Array.isArray(blocks)) return []
  return blocks
    .map((block, index) => {
      const label = String(block?.title || block?.label || '').trim()
      if (!label) return null
      return {
        id: String(block?.id || createId('dashboard-block')).trim(),
        type: block?.type === 'note' ? 'note' : 'link',
        title: label,
        subtitle: String(block?.subtitle || '').trim(),
        href: String(block?.href || '/').trim(),
        content: String(block?.content || '').trim(),
        visible: block?.visible !== false,
        tone: block?.tone || 'blue',
      }
    })
    .filter(Boolean)
}

export function getDefaultDashboardLayout() {
  return {
    sections: DEFAULT_DASHBOARD_SECTIONS.map((section) => ({ ...section })),
    quickActions: getDefaultQuickActionConfigs(),
    customBlocks: [],
  }
}

export function loadDashboardLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY) || 'null')
    if (!saved || typeof saved !== 'object') return getDefaultDashboardLayout()
    return {
      sections: mergeSections(saved.sections),
      quickActions: mergeQuickActionConfigs(saved.quickActions),
      customBlocks: normalizeCustomBlocks(saved.customBlocks),
    }
  } catch {
    return getDefaultDashboardLayout()
  }
}

export function publishDashboardLayout(layout) {
  const normalized = {
    sections: mergeSections(layout?.sections),
    quickActions: mergeQuickActionConfigs(layout?.quickActions),
    customBlocks: normalizeCustomBlocks(layout?.customBlocks),
  }
  try {
    localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // localStorage kapalı
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_LAYOUT_EVENT, { detail: normalized }))
  return normalized
}

export function isDashboardSectionVisible(layout, sectionId) {
  const section = (layout?.sections || []).find((item) => item.id === sectionId)
  return section ? section.visible !== false : true
}

export function getQuickActionToneStyles(tone) {
  return QUICK_ACTION_TONES[tone] || QUICK_ACTION_TONES.blue
}

export function buildCopyLabel(label, items) {
  const base = `${String(label || 'Öğe').trim()} Kopya`
  const used = new Set((items || []).map((item) => normalizeLabel(item.label || item.title)))
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

export function createQuickActionConfig(partial = {}) {
  return {
    id: createId('quick-action'),
    label: String(partial.label || 'Yeni Kart').trim(),
    href: String(partial.href || '/').trim(),
    createHref: String(partial.createHref || partial.href || '/').trim(),
    icon: partial.icon || 'file-text',
    tone: partial.tone || 'blue',
    visible: true,
    isCustom: true,
  }
}

export function createCustomBlock(partial = {}) {
  return {
    id: createId('dashboard-block'),
    type: partial.type === 'note' ? 'note' : 'link',
    title: String(partial.title || 'Yeni Blok').trim(),
    subtitle: String(partial.subtitle || '').trim(),
    href: String(partial.href || '/').trim(),
    content: String(partial.content || '').trim(),
    visible: true,
    tone: partial.tone || 'blue',
  }
}

export { createId, normalizeLabel, QUICK_ACTION_TONES }
