const STORAGE_KEY = 'bach-recurring-payments-v1'
export const RECURRING_PAYMENTS_EVENT = 'bach:recurring-payments-updated'

function createId() {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function loadRecurringPayments() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function saveRecurringPayments(items) {
  const next = Array.isArray(items) ? items : []
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(RECURRING_PAYMENTS_EVENT))
  return next
}

export function upsertRecurringPayment(item) {
  const items = loadRecurringPayments()
  const index = items.findIndex((entry) => entry.id === item.id)
  const nextItem = {
    id: item.id || createId(),
    title: String(item.title || '').trim(),
    subtitle: String(item.subtitle || '').trim(),
    amount: Number(item.amount) || 0,
    interval: item.interval || 'monthly',
    dayOfMonth: Number(item.dayOfMonth) || 1,
    weekday: Number(item.weekday) || 1,
    category: item.category || 'Genel Gider',
    vendorName: item.vendorName || '',
    active: item.active !== false,
  }
  if (index >= 0) items[index] = { ...items[index], ...nextItem }
  else items.push(nextItem)
  return saveRecurringPayments(items)
}
