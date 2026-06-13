export const ACTIVITY_KEY = 'erlenbox-customer-activity'
export const ACTIVITY_USER = 'Yönetici'

export function readActivity(customerId) {
  if (!customerId) return []
  try {
    const all = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}')
    return Array.isArray(all[customerId]) ? all[customerId] : []
  } catch {
    return []
  }
}

export function writeActivity(customerId, entries) {
  if (!customerId) return
  let all = {}
  try {
    all = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}')
  } catch {
    all = {}
  }
  all[customerId] = entries
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(all))
}

export function appendActivity(customerId, action, detail) {
  if (!customerId) return []
  const entry = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    user: ACTIVITY_USER,
    action,
    detail,
  }
  const next = [entry, ...readActivity(customerId)]
  writeActivity(customerId, next)
  return next
}

export function formatActivityStamp(iso) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
