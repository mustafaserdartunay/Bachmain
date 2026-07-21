import { getStoredSession } from '../utils/platformAuth'

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_PLATFORM_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')
    ? 'https://api.bachmain.com'
    : typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:8080'
      : '')

async function socialFetch(path, { method = 'GET', body } = {}) {
  const { token } = getStoredSession()
  if (!API_BASE || !token) {
    const err = new Error('API_UNAVAILABLE')
    err.code = 'API_UNAVAILABLE'
    throw err
  }
  const res = await fetch(`${String(API_BASE).replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    err.code = data.error || data.code
    err.status = res.status
    throw err
  }
  return data
}

export const smcApi = {
  health: () => socialFetch('/v1/social/health'),
  overview: () => socialFetch('/v1/social/overview'),
  oauthStart: () => socialFetch('/v1/social/instagram/oauth/start'),
  accounts: () => socialFetch('/v1/social/instagram/accounts'),
  disconnect: (id) => socialFetch(`/v1/social/instagram/accounts/${id}`, { method: 'DELETE' }),
  refresh: (id) => socialFetch(`/v1/social/instagram/accounts/${id}/refresh`, { method: 'POST' }),
  generate: (body) => socialFetch('/v1/social/ai/generate', { method: 'POST', body }),
  content: () => socialFetch('/v1/social/content'),
  patchContent: (id, body) => socialFetch(`/v1/social/content/${id}`, { method: 'PATCH', body }),
  templates: () => socialFetch('/v1/social/templates'),
  brandKits: () => socialFetch('/v1/social/brand-kits'),
  saveBrandKit: (body) => socialFetch('/v1/social/brand-kits', { method: 'POST', body }),
  media: () => socialFetch('/v1/social/media'),
  addMedia: (body) => socialFetch('/v1/social/media', { method: 'POST', body }),
  campaigns: () => socialFetch('/v1/social/campaigns'),
  createCampaign: (name) => socialFetch('/v1/social/campaigns', { method: 'POST', body: { name } }),
  schedules: () => socialFetch('/v1/social/schedules'),
  createSchedule: (body) => socialFetch('/v1/social/schedules', { method: 'POST', body }),
  patchSchedule: (id, body) => socialFetch(`/v1/social/schedules/${id}`, { method: 'PATCH', body }),
  approvals: () => socialFetch('/v1/social/approvals'),
  requestApproval: (contentId) =>
    socialFetch('/v1/social/approvals', { method: 'POST', body: { contentId } }),
  decideApproval: (id, decision, note) =>
    socialFetch(`/v1/social/approvals/${id}/decide`, { method: 'POST', body: { decision, note } }),
  queue: () => socialFetch('/v1/social/queue'),
  publish: (contentId, scheduledAt) =>
    socialFetch(`/v1/social/publish/${contentId}`, {
      method: 'POST',
      body: scheduledAt ? { scheduledAt } : {},
    }),
  notifications: () => socialFetch('/v1/social/notifications'),
  analytics: () => socialFetch('/v1/social/analytics'),
  tick: () => socialFetch('/v1/social/internal/tick', { method: 'POST' }),
}

export { API_BASE as SMC_API_BASE }
