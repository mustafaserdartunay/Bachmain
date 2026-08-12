/**
 * Super-admin platform ops API.
 * Contract: `/v1/admin/*` on yonetim.bachmain.com
 */
import { api, ApiError } from '@/lib/api'

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export interface SystemHealthMetrics {
  onlineUsers: number
  cpuPercent: number
  ramPercent: number
  storagePercent: number
  hostname?: string
  platform?: string
  loadAverage?: number[]
  memory?: { totalMb: number; freeMb: number }
  database: { status: ServiceStatus; latencyMs: number; detail?: string }
  api: { status: ServiceStatus; latencyMs: number; detail?: string }
  emailQueue: { status: ServiceStatus; pending: number }
  redis: { status: ServiceStatus; latencyMs: number; detail?: string }
  github?: {
    status: ServiceStatus
    latencyMs: number
    detail?: string
    repository?: string
    configured?: boolean
    openIssues?: number | null
    pushedAt?: string | null
  }
  vercel?: { status: ServiceStatus; env?: string; region?: string | null }
  ticketsOpen: number
  revenueMrr: number
  trialUsers: number
  expiredUsers: number
  paidUsers: number
  memberCount?: number
  customerCount?: number
  /** ISO timestamp of last sample */
  sampledAt: string
  /** true when response is placeholder mock (endpoint not yet live) */
  mock?: boolean
  source: '/v1/admin/system-health'
}

export interface PlatformUserRow {
  id: string
  company: string
  companyId: string
  user: string
  email: string
  sessions: number
  devices: number
  mfaEnabled: boolean
  lastLogin: string | null
  plan: string
  status: 'active' | 'trial' | 'suspended' | 'expired'
}

export interface AuditLogEntry {
  id: string
  time: string
  actor: string
  actorId?: string
  action: string
  target: string
  targetId?: string
  ip: string
  meta: Record<string, unknown>
}

export interface AuditLogResponse {
  rows: AuditLogEntry[]
  immutable: true
}

export interface ActionResult {
  ok: boolean
  message?: string
}

export interface SecurityPanel {
  status: ServiceStatus
  label: string
  detail: string
  count?: number
  immutable?: boolean
  placeholder?: boolean
  checks?: Record<string, boolean>
  links?: Record<string, string>
}

export interface SecurityOverview {
  ok: boolean
  score: number
  sampledAt: string
  production: boolean
  database: string
  panels: Record<string, SecurityPanel>
  recommendations: string[]
  mock?: boolean
  source: string
}

export interface AiosProviderRow {
  id: string
  label: string
  configured: boolean
  models?: string[]
}

export interface AiosAgentRow {
  id: string
  name: string
  role: string
  modules: string[]
  defaultProvider: string
  defaultModel: string
  costLimitUsd: number
}

export interface AiosToolRow {
  id: string
  label: string
  description: string
  requiresHumanApproval: boolean
}

export interface AiosOverview {
  ok: boolean
  agentsTotal: number
  toolsTotal: number
  providersConfigured: number
  providers: AiosProviderRow[]
  agents?: AiosAgentRow[]
  tools?: AiosToolRow[]
  sections?: string[]
  mock?: boolean
  source: string
  sampledAt?: string
}

export const platformAdminApi = {
  /** Live via GET /v1/admin/system-health */
  getSystemHealth: async (): Promise<SystemHealthMetrics> => {
    const data = await api.get<SystemHealthMetrics>('/v1/admin/system-health')
    return { ...data, mock: false, source: '/v1/admin/system-health' }
  },

  /** GET /v1/admin/users */
  listUsers: async (): Promise<PlatformUserRow[]> => {
    const res = await api.get<{ rows: PlatformUserRow[] } | PlatformUserRow[]>('/v1/admin/users')
    return Array.isArray(res) ? res : (res.rows ?? [])
  },

  /** GET /v1/admin/users/:id/login-history */
  getLoginHistory: (userId: string) =>
    api.get<{ rows: { id: string; ip: string; device: string; date: string }[] }>(
      `/v1/admin/users/${userId}/login-history`,
    ),

  /** POST /v1/admin/users/:id/force-logout */
  forceLogout: (userId: string) =>
    api.post<ActionResult>(
      `/v1/admin/users/${encodeURIComponent(userId)}/force-logout`,
      {},
    ),

  /** POST /v1/admin/users/:id/suspend */
  suspend: (userId: string, reason?: string) =>
    api.post<ActionResult>(`/v1/admin/users/${encodeURIComponent(userId)}/suspend`, {
      reason,
    }),

  /** DELETE /v1/admin/users/:id */
  deleteUser: (userId: string) =>
    api.delete<ActionResult>(`/v1/admin/users/${encodeURIComponent(userId)}`),

  /** POST /v1/admin/users/:id/reset-password */
  resetPassword: (userId: string) =>
    api.post<ActionResult>(
      `/v1/admin/users/${encodeURIComponent(userId)}/reset-password`,
      {},
    ),

  /** POST /v1/admin/users/:id/reset-trial */
  resetTrial: (userId: string) =>
    api.post<ActionResult>(`/v1/admin/users/${encodeURIComponent(userId)}/reset-trial`, {}),

  /** POST /v1/admin/users/:id/upgrade-plan */
  upgradePlan: (userId: string, plan: string) =>
    api.post<ActionResult>(`/v1/admin/users/${encodeURIComponent(userId)}/upgrade-plan`, {
      plan,
    }),

  /** POST /v1/admin/purge-demo — remove seed/demo rows, keep real members */
  purgeDemo: () => api.post<{ ok: boolean; removedCustomers: number; removedTickets: number }>(
    '/v1/admin/purge-demo',
    {},
  ),

  /** GET /v1/admin/audit-logs — immutable, never delete */
  listAuditLogs: async (action?: string): Promise<AuditLogResponse> => {
    const q = action && action !== 'all' ? `?action=${encodeURIComponent(action)}` : ''
    const res = await api.get<{ rows: AuditLogEntry[] }>(`/v1/admin/audit-logs${q}`)
    return { rows: res.rows ?? [], immutable: true }
  },

  /** GET /security/overview — live Security Center score + panels */
  getSecurityOverview: async (): Promise<SecurityOverview> => {
    const data = await api.get<SecurityOverview>('/security/overview')
    return { ...data, mock: false, source: '/security/overview' }
  },

  getAiosOverview: async (): Promise<AiosOverview> => {
    const data = await api.get<AiosOverview>('/aios/overview')
    return { ...data, mock: false, source: '/aios/overview' }
  },
}

export { ApiError }
