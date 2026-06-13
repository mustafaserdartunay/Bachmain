import { findCustomerProfileByReference } from '../data/customerProfiles'

export const CUSTOMER_META_KEY = 'erlenbox-customer-list-settings'

export const customerTypeOptions = [
  { label: 'Müşteri', color: 'bg-blue-500' },
  { label: 'Bayi', color: 'bg-emerald-500' },
]

export const representativeOptions = [
  { label: 'Ayşe Demir', color: 'bg-purple-500' },
  { label: 'Mehmet Kaya', color: 'bg-blue-500' },
  { label: 'Selin Arslan', color: 'bg-emerald-500' },
  { label: 'Fatma Öztürk', color: 'bg-orange-500' },
  { label: 'Ali Çelik', color: 'bg-cyan-500' },
  { label: 'Satış Ekibi', color: 'bg-gray-500' },
  { label: 'Serdar', color: 'bg-fuchsia-500' },
]

export const scoringOptions = [
  { label: 'Kötü', color: 'bg-red-500' },
  { label: 'Normal', color: 'bg-blue-500' },
  { label: 'İyi', color: 'bg-emerald-500' },
  { label: 'Çok İyi', color: 'bg-purple-500' },
  { label: 'Sorunlu', color: 'bg-orange-500' },
]

export const categoryOptions = [
  { label: 'Ambalaj', color: 'bg-blue-500' },
  { label: 'Gıda', color: 'bg-emerald-500' },
  { label: 'Tekstil', color: 'bg-purple-500' },
  { label: 'Kozmetik', color: 'bg-pink-500' },
  { label: 'Elektronik', color: 'bg-cyan-500' },
]

export const statusOptions = [
  { label: 'Taslak', color: 'bg-gray-500' },
  { label: 'Hazırlanıyor', color: 'bg-blue-500' },
  { label: 'Müşteriye Gönderildi', color: 'bg-orange-500' },
  { label: 'Revize İstendi', color: 'bg-purple-500' },
  { label: 'Onaylandı', color: 'bg-emerald-500' },
  { label: 'Reddedildi', color: 'bg-red-500' },
]

export const orderStatusOptions = [
  { label: 'Yeni', color: 'bg-blue-500' },
  { label: 'Üretimde', color: 'bg-fuchsia-500' },
  { label: 'Paketlemede', color: 'bg-cyan-500' },
  { label: 'Kargoda', color: 'bg-amber-500' },
  { label: 'Tamamlandı', color: 'bg-green-500' },
  { label: 'İptal', color: 'bg-red-500' },
]

export const priorityOptions = [
  { label: 'Düşük', color: 'bg-sky-500' },
  { label: 'Normal', color: 'bg-emerald-500' },
  { label: 'Yüksek', color: 'bg-orange-500' },
  { label: 'Acil', color: 'bg-red-500' },
]

export const tagOptions = [
  { label: 'kraft', color: 'bg-amber-500' },
  { label: 'premium', color: 'bg-purple-500' },
  { label: 'e-ticaret', color: 'bg-cyan-500' },
  { label: 'gıda', color: 'bg-emerald-500' },
  { label: 'hızlı teslim', color: 'bg-orange-500' },
  { label: 'baskılı', color: 'bg-blue-500' },
]

export const productCategoryOptions = [
  { label: 'Kraft Kutular', color: 'bg-amber-500' },
  { label: 'Oluklu Kutular', color: 'bg-orange-500' },
  { label: 'Premium Kutular', color: 'bg-purple-500' },
  { label: 'E-Ticaret Kutuları', color: 'bg-cyan-500' },
  { label: 'Gıda Ambalaj', color: 'bg-emerald-500' },
  { label: 'Baskılı Kutular', color: 'bg-blue-500' },
  { label: 'Hizmetler', color: 'bg-fuchsia-500' },
  { label: 'Aksesuarlar', color: 'bg-pink-500' },
]

export const accountOptions = [
  { label: 'Merkez Nakit Kasa', color: 'bg-emerald-500' },
  { label: 'İş Bankası Ticari Hesap', color: 'bg-blue-500' },
  { label: 'Garanti BBVA Tahsilat Hesabı', color: 'bg-purple-500' },
]

export const cashAccountOptions = [
  { label: 'Merkez Nakit Kasa', color: 'bg-emerald-500' },
  { label: 'Şube Nakit Kasa', color: 'bg-teal-500' },
]

export const bankAccountOptions = [
  { label: 'İş Bankası Ticari Hesap', color: 'bg-blue-500' },
  { label: 'Garanti BBVA Tahsilat Hesabı', color: 'bg-purple-500' },
  { label: 'Akbank Ticari Hesap', color: 'bg-cyan-500' },
]

export const OPTION_LISTS_KEY = 'erlenbox-customer-option-lists'

export const OPTION_COLOR_PALETTE = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-rose-500',
]

const defaultOptionLists = {
  type: customerTypeOptions,
  representative: representativeOptions,
  scoring: scoringOptions,
  category: categoryOptions,
  status: statusOptions,
  orderStatus: orderStatusOptions,
  priority: priorityOptions,
  tags: tagOptions,
  productCategory: productCategoryOptions,
  account: accountOptions,
  cashAccount: cashAccountOptions,
  bankAccount: bankAccountOptions,
}

function pickList(list, field) {
  return Array.isArray(list) ? list : defaultOptionLists[field]
}

function createOptionId(label, index) {
  return `opt-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`
}

export function normalizeOptionList(options) {
  const seen = new Set()
  return (options || []).map((option, index) => {
    let id = option?.id
    if (!id || seen.has(id)) {
      id = createOptionId(option?.label || 'item', index)
    }
    seen.add(id)
    return {
      id,
      label: option.label,
      color: option.color || OPTION_COLOR_PALETTE[index % OPTION_COLOR_PALETTE.length],
    }
  })
}

function normalizeOptionLists(lists) {
  return Object.fromEntries(
    Object.entries(lists).map(([field, options]) => [field, normalizeOptionList(options)]),
  )
}

export function readOptionLists() {
  try {
    const raw = localStorage.getItem(OPTION_LISTS_KEY)
    if (!raw) return normalizeOptionLists({ ...defaultOptionLists })
    const saved = JSON.parse(raw)
    return normalizeOptionLists({
      type: pickList(saved.type, 'type'),
      representative: pickList(saved.representative, 'representative'),
      scoring: pickList(saved.scoring, 'scoring'),
      category: pickList(saved.category, 'category'),
      status: pickList(saved.status, 'status'),
      orderStatus: pickList(saved.orderStatus, 'orderStatus'),
      priority: pickList(saved.priority, 'priority'),
      tags: pickList(saved.tags, 'tags'),
      productCategory: pickList(saved.productCategory, 'productCategory'),
      account: pickList(saved.account, 'account'),
      cashAccount: pickList(saved.cashAccount, 'cashAccount'),
      bankAccount: pickList(saved.bankAccount, 'bankAccount'),
    })
  } catch {
    return normalizeOptionLists({ ...defaultOptionLists })
  }
}

export function saveOptionList(field, options) {
  const current = readOptionLists()
  const next = { ...current, [field]: normalizeOptionList(options) }
  localStorage.setItem(OPTION_LISTS_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:option-lists-updated', { detail: { field } }))
  return next
}

export function getOptionLabels(field) {
  return readOptionLists()[field].map((option) => option.label)
}

export function readCustomerMeta() {
  try {
    const saved = localStorage.getItem(CUSTOMER_META_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function getDefaultCustomerType(customer) {
  return String(customer?.segment || '').toLocaleLowerCase('tr-TR').includes('bayi') ? 'Bayi' : 'Müşteri'
}

export function getDefaultCustomerScoring(customer) {
  const score = Number(customer?.score || 0)
  if (score >= 90) return 'Çok İyi'
  if (score >= 80) return 'İyi'
  if (score >= 65) return 'Normal'
  if (score > 0) return 'Kötü'
  return 'Normal'
}

export function getCustomerMetaSelection(customer, savedMeta = {}) {
  return {
    type: savedMeta.type || getDefaultCustomerType(customer),
    representative: savedMeta.representative || customer?.owner || 'Satış Ekibi',
    scoring: savedMeta.scoring || getDefaultCustomerScoring(customer),
    category: savedMeta.category || '',
  }
}

export function resolveCustomerRepresentative(customerOrRef) {
  const customer = typeof customerOrRef === 'object' && customerOrRef
    ? customerOrRef
    : findCustomerProfileByReference(customerOrRef)
  if (!customer) return ''
  return getCustomerMetaSelection(customer, readCustomerMeta()[customer.id] || {}).representative
}

export function notifyCustomerMetaUpdated(detail = {}) {
  window.dispatchEvent(new CustomEvent('bach:customer-meta-updated', { detail }))
}
