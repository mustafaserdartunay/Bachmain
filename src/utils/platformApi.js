/**
 * Platform API client for CRM ↔ Admin shared backend.
 * Falls back to localStorage when API is unreachable.
 */
const API_BASE =
  import.meta.env.VITE_PLATFORM_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')
    ? 'https://yonetim.bachmain.com/api'
    : '')

async function request(path, options = {}) {
  if (!API_BASE) throw new Error('NO_API')
  const res = await fetch(`${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || `HTTP_${res.status}`)
  }
  return res.json()
}

export async function fetchPlatformTickets() {
  return request('tickets')
}

export async function createPlatformTicket({ subject, message, customerName, customerId }) {
  return request('tickets', {
    method: 'POST',
    body: JSON.stringify({ subject, message, customerName, customerId, author: 'customer' }),
  })
}

export async function fetchPlatformNotifications() {
  return request('notifications')
}

export async function fetchPlatformHealth() {
  return request('health')
}

export function getPlatformApiBase() {
  return API_BASE
}
