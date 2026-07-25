/** Tenant-local SaaS integration connections + audit logs (IH / SMC Bağlantılar). */

import { getPlatformById } from './catalog'

const KEY = 'bach_saas_integrations_v1'
const EVT = 'bach:saas-integrations-updated'

export const SAAS_INTEGRATIONS_UPDATED_EVENT = EVT

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { connections: {}, logs: [] }
    const parsed = JSON.parse(raw)
    return {
      connections:
        parsed.connections && typeof parsed.connections === 'object' ? parsed.connections : {},
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    }
  } catch {
    return { connections: {}, logs: [] }
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(EVT))
}

function nowIso() {
  return new Date().toISOString()
}

function addDaysIso(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function pushLog(state, entry) {
  state.logs = [
    {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      at: nowIso(),
      success: true,
      httpCode: 200,
      durationMs: 120 + Math.floor(Math.random() * 400),
      ...entry,
    },
    ...state.logs,
  ].slice(0, 500)
}

export function listConnections() {
  return { ...read().connections }
}

export function getConnection(platformId) {
  return read().connections[platformId] || null
}

export function isConnected(platformId) {
  const row = getConnection(platformId)
  return Boolean(row?.connected)
}

export function listLogs(filter = {}) {
  let logs = read().logs
  if (filter.platformId) logs = logs.filter((l) => l.platformId === filter.platformId)
  if (filter.limit) logs = logs.slice(0, filter.limit)
  return logs
}

export function overviewStats() {
  const { connections, logs } = read()
  const rows = Object.values(connections)
  const connected = rows.filter((c) => c.connected)
  const webhookOk = connected.filter((c) => c.webhookStatus === 'active').length
  const expiringSoon = connected.filter((c) => {
    if (!c.tokenExpiresAt) return false
    const ms = new Date(c.tokenExpiresAt).getTime() - Date.now()
    return ms > 0 && ms < 3 * 24 * 60 * 60 * 1000
  }).length
  const failed = logs.filter((l) => !l.success).length
  return {
    totalPlatforms: rows.length,
    connected: connected.length,
    webhookActive: webhookOk,
    expiringSoon,
    failedRequests: failed,
    totalMessages: connected.reduce((s, c) => s + (c.messageCount || 0), 0),
    lastSyncAt: connected
      .map((c) => c.lastSyncAt)
      .filter(Boolean)
      .sort()
      .at(-1),
  }
}

/**
 * Complete OAuth wizard — stores connection without exposing tokens to UI.
 */
export function connectPlatform({
  platformId,
  accountId,
  accountLabel,
  accountMeta = '',
  extras = {},
}) {
  const platform = getPlatformById(platformId)
  if (!platform) return { error: 'unknown_platform' }
  if (platform.status === 'coming') return { error: 'coming' }

  const state = read()
  const prev = state.connections[platformId] || {}
  state.connections[platformId] = {
    ...prev,
    platformId,
    connected: true,
    accountId: accountId || `acc_${platformId}`,
    accountLabel: accountLabel || platform.title,
    accountMeta,
    businessName: extras.businessName || accountMeta || platform.title,
    phoneNumber: extras.phoneNumber || (platformId === 'whatsapp' ? accountLabel : ''),
    followerCount: extras.followerCount || null,
    webhookStatus: 'active',
    tokenStatus: 'valid',
    tokenExpiresAt: addDaysIso(55),
    lastSyncAt: nowIso(),
    connectedAt: prev.connectedAt || nowIso(),
    messageCount: prev.messageCount || Math.floor(Math.random() * 500),
    apiVersion: extras.apiVersion || 'v1',
    errorCount: 0,
    lastError: null,
    ...extras,
  }
  pushLog(state, {
    platformId,
    action: 'oauth.connect',
    success: true,
    detail: `${platform.title} bağlandı · ${accountLabel || accountId}`,
  })
  write(state)
  return state.connections[platformId]
}

export function disconnectPlatform(platformId) {
  const state = read()
  if (!state.connections[platformId]) return null
  state.connections[platformId] = {
    ...state.connections[platformId],
    connected: false,
    webhookStatus: 'inactive',
    tokenStatus: 'revoked',
    disconnectedAt: nowIso(),
  }
  pushLog(state, {
    platformId,
    action: 'oauth.disconnect',
    success: true,
    detail: 'Bağlantı kesildi',
  })
  write(state)
  return state.connections[platformId]
}

export function refreshToken(platformId) {
  const state = read()
  const row = state.connections[platformId]
  if (!row?.connected) return { error: 'not_connected' }
  state.connections[platformId] = {
    ...row,
    tokenStatus: 'valid',
    tokenExpiresAt: addDaysIso(60),
    lastSyncAt: nowIso(),
  }
  pushLog(state, {
    platformId,
    action: 'token.refresh',
    success: true,
    detail: 'Token yenilendi',
  })
  write(state)
  return state.connections[platformId]
}

export function syncPlatform(platformId) {
  const state = read()
  const row = state.connections[platformId]
  if (!row?.connected) return { error: 'not_connected' }
  const ok = Math.random() > 0.08
  state.connections[platformId] = {
    ...row,
    lastSyncAt: nowIso(),
    webhookStatus: ok ? 'active' : 'error',
    errorCount: ok ? row.errorCount || 0 : (row.errorCount || 0) + 1,
    lastError: ok ? null : 'Senkronizasyon zaman aşımı',
    messageCount: (row.messageCount || 0) + (ok ? Math.floor(Math.random() * 12) : 0),
  }
  pushLog(state, {
    platformId,
    action: 'sync',
    success: ok,
    httpCode: ok ? 200 : 504,
    detail: ok ? 'Senkron tamam' : 'Senkron başarısız',
  })
  write(state)
  return state.connections[platformId]
}

export function testWebhook(platformId) {
  const state = read()
  const row = state.connections[platformId]
  if (!row?.connected) return { error: 'not_connected' }
  const ok = Math.random() > 0.1
  state.connections[platformId] = {
    ...row,
    webhookStatus: ok ? 'active' : 'error',
    lastError: ok ? null : 'Webhook yanıt vermedi',
  }
  pushLog(state, {
    platformId,
    action: 'webhook.test',
    success: ok,
    httpCode: ok ? 200 : 502,
    detail: ok ? 'Webhook OK' : 'Webhook hata',
  })
  write(state)
  return { ok, connection: state.connections[platformId] }
}

export function sendTestMessage(platformId) {
  const state = read()
  const row = state.connections[platformId]
  if (!row?.connected) return { error: 'not_connected' }
  pushLog(state, {
    platformId,
    action: 'message.test',
    success: true,
    detail: 'Test mesajı kuyruğa alındı',
  })
  write(state)
  return { ok: true }
}

export function formatRelativeTr(iso) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'Az önce'
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} dk önce`
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} sa önce`
  return `${Math.floor(ms / 86_400_000)} gün önce`
}

export function subscribeIntegrations(fn) {
  const handler = () => fn()
  window.addEventListener(EVT, handler)
  return () => window.removeEventListener(EVT, handler)
}
