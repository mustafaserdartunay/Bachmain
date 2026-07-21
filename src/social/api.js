import { getStoredSession } from '../utils/platformAuth'
import { readLocalMetaApp } from './metaLocalStore'

const PLATFORM_API =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')
    ? 'https://api.bachmain.com'
    : typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:8080'
      : '')

async function crmSocial(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api/social${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    err.code = data.error
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

async function platformSocial(path, { method = 'GET', body } = {}) {
  const { token } = getStoredSession()
  if (!PLATFORM_API || !token) {
    const err = new Error('API_UNAVAILABLE')
    err.code = 'API_UNAVAILABLE'
    throw err
  }
  const res = await fetch(`${String(PLATFORM_API).replace(/\/$/, '')}/v1/social${path}`, {
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
    err.code = data.error
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

async function socialFetch(path, opts = {}) {
  try {
    return await platformSocial(path, opts)
  } catch (e) {
    if (path.startsWith('/instagram/oauth') || path.startsWith('/meta') || path === '/health') {
      throw e
    }
    throw e
  }
}

export const smcApi = {
  health: async () => {
    try {
      return await platformSocial('/health')
    } catch {
      return crmSocial('/health')
    }
  },
  metaSetup: async () => {
    try {
      return await platformSocial('/meta/setup')
    } catch {
      const h = await crmSocial('/health')
      const local = readLocalMetaApp()
      return {
        ...h,
        tenantConfigured: Boolean(local?.appId),
        tenantAppId: local?.appId || null,
        tenantRedirectUri: local?.redirectUri || null,
        ready: Boolean(local?.appId && local?.appSecret) || h.metaConfigured,
      }
    }
  },
  saveMetaSetup: async (body) => {
    try {
      return await platformSocial('/meta/setup', { method: 'POST', body })
    } catch {
      // CRM path: credentials stay local; oauth-start receives them
      return { ok: true, ready: true, tenantConfigured: true, ...body, local: true }
    }
  },
  oauthStart: async () => {
    const local = readLocalMetaApp()
    const { user } = getStoredSession()
    try {
      return await platformSocial('/instagram/oauth/start')
    } catch {
      return crmSocial('/oauth-start', {
        method: 'POST',
        body: {
          appId: local?.appId,
          appSecret: local?.appSecret,
          redirectUri: local?.redirectUri,
          companyId: user?.companyId || user?.cid || 'local',
          userId: user?.id || 'user',
        },
      })
    }
  },
  accounts: async () => {
    try {
      return await platformSocial('/instagram/accounts')
    } catch {
      return crmSocial('/accounts')
    }
  },
  disconnect: async (id) => {
    try {
      return await platformSocial(`/instagram/accounts/${id}`, { method: 'DELETE' })
    } catch {
      return crmSocial('/accounts', { method: 'DELETE' })
    }
  },
  refresh: (id) => socialFetch(`/instagram/accounts/${id}/refresh`, { method: 'POST' }),
  generate: (body) => socialFetch('/ai/generate', { method: 'POST', body }),
  reelMedia: async (body) => {
    try {
      return await platformSocial('/ai/reel-media', { method: 'POST', body })
    } catch {
      return crmSocial('/reel-media', { method: 'POST', body })
    }
  },
  content: () => socialFetch('/content'),
  patchContent: (id, body) => socialFetch(`/content/${id}`, { method: 'PATCH', body }),
  templates: () => socialFetch('/templates'),
  brandKits: () => socialFetch('/brand-kits'),
  saveBrandKit: (body) => socialFetch('/brand-kits', { method: 'POST', body }),
  media: () => socialFetch('/media'),
  addMedia: (body) => socialFetch('/media', { method: 'POST', body }),
  campaigns: () => socialFetch('/campaigns'),
  createCampaign: (name) => socialFetch('/campaigns', { method: 'POST', body: { name } }),
  schedules: () => socialFetch('/schedules'),
  createSchedule: (body) => socialFetch('/schedules', { method: 'POST', body }),
  patchSchedule: (id, body) => socialFetch(`/schedules/${id}`, { method: 'PATCH', body }),
  approvals: () => socialFetch('/approvals'),
  requestApproval: (contentId) =>
    socialFetch('/approvals', { method: 'POST', body: { contentId } }),
  decideApproval: (id, decision, note) =>
    socialFetch(`/approvals/${id}/decide`, { method: 'POST', body: { decision, note } }),
  queue: () => socialFetch('/queue'),
  publish: (contentId, scheduledAt) =>
    socialFetch(`/publish/${contentId}`, {
      method: 'POST',
      body: scheduledAt ? { scheduledAt } : {},
    }),
  notifications: () => socialFetch('/notifications'),
  analytics: () => socialFetch('/analytics'),
  tick: () => socialFetch('/internal/tick', { method: 'POST' }),
}

export { PLATFORM_API as SMC_API_BASE }
