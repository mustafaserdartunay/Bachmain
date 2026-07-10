export const DASHBOARD_FINANCE_CARDS_STORAGE_KEY = 'bach-dashboard-finance-cards'
export const DASHBOARD_FINANCE_CARDS_EVENT = 'bach:dashboard-finance-cards-updated'

export const DEFAULT_DASHBOARD_FINANCE_CARDS = [
  { id: 'receivables', label: 'Tahsilat Bekleyen', color: 'bg-cyan-500', visible: true },
  { id: 'payables', label: 'Ödenecekler Toplamı', color: 'bg-orange-500', visible: true },
  { id: 'stock-value', label: 'Stok Toplam Değeri', color: 'bg-teal-500', visible: true },
  { id: 'cash', label: 'Nakit Kasa', color: 'bg-emerald-500', visible: true },
  { id: 'bank', label: 'Bankalar', color: 'bg-blue-500', visible: true },
  { id: 'cheques', label: 'Portföydeki Çekler', color: 'bg-purple-500', visible: true },
  { id: 'promissory-notes', label: 'Portföydeki Senetler', color: 'bg-fuchsia-500', visible: true },
  { id: 'live-assets', label: 'Toplam Canlı Varlık', color: 'bg-indigo-500', visible: true },
  { id: 'future', label: 'Gelecek Tutar', color: 'bg-green-500', visible: true },
  { id: 'possible', label: 'Genel Olası Tutar', color: 'bg-blue-500', visible: true },
]

function normalizeCard(card, index) {
  const fallback = DEFAULT_DASHBOARD_FINANCE_CARDS[index % DEFAULT_DASHBOARD_FINANCE_CARDS.length]
  const label = String(card?.label || '').trim()
  if (!label) return null
  const id = String(card?.id || `dashboard-finance-card-${index}-${Date.now()}`).trim()
  return {
    id,
    label: id === 'bank' && label === 'Banka' ? 'Bankalar' : label,
    color: String(card?.color || fallback?.color || 'bg-blue-500'),
    visible: card?.visible !== false,
  }
}

function mergeWithDefaults(cards) {
  const normalized = Array.isArray(cards) ? cards.map(normalizeCard).filter(Boolean) : []
  const byId = new Map(normalized.map((card) => [card.id, card]))
  const savedKnownIds = normalized
    .filter((card) => DEFAULT_DASHBOARD_FINANCE_CARDS.some((defaultCard) => defaultCard.id === card.id))
    .map((card) => card.id)
    .join('|')
  const defaultKnownIds = DEFAULT_DASHBOARD_FINANCE_CARDS.map((card) => card.id).join('|')
  const orderedDefaults = savedKnownIds === defaultKnownIds
    ? normalized.filter((card) => DEFAULT_DASHBOARD_FINANCE_CARDS.some((defaultCard) => defaultCard.id === card.id))
    : DEFAULT_DASHBOARD_FINANCE_CARDS
  const merged = orderedDefaults.map((card) => ({
    ...card,
    ...(byId.get(card.id) || {}),
  }))
  normalized.forEach((card) => {
    if (!DEFAULT_DASHBOARD_FINANCE_CARDS.some((defaultCard) => defaultCard.id === card.id)) {
      merged.push(card)
    }
  })
  return merged
}

export function loadDashboardFinanceCards() {
  try {
    const saved = JSON.parse(localStorage.getItem(DASHBOARD_FINANCE_CARDS_STORAGE_KEY) || 'null')
    if (Array.isArray(saved)) {
      return mergeWithDefaults(saved)
    }
  } catch {
    // localStorage kapalıysa varsayılan liste kullanılır.
  }
  return DEFAULT_DASHBOARD_FINANCE_CARDS.map((card) => ({ ...card }))
}

export function publishDashboardFinanceCards(cards) {
  const normalized = Array.isArray(cards) ? mergeWithDefaults(cards) : DEFAULT_DASHBOARD_FINANCE_CARDS.map((card) => ({ ...card }))
  try {
    localStorage.setItem(DASHBOARD_FINANCE_CARDS_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // localStorage kapalıysa sadece ekrandaki state güncellenir.
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_FINANCE_CARDS_EVENT, { detail: normalized }))
  return normalized
}
