/**
 * Super-admin platform ops API stubs.
 * Contract: `/v1/admin/*` on yonetim.bachmain.com (admin.bachmain.com alias).
 */
import { api, ApiError } from '@/lib/api'

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export interface SystemHealthMetrics {
  onlineUsers: number
  cpuPercent: number
  ramPercent: number
  storagePercent: number
  database: { status: ServiceStatus; latencyMs: number }
  api: { status: ServiceStatus; latencyMs: number }
  emailQueue: { status: ServiceStatus; pending: number }
  redis: { status: ServiceStatus; latencyMs: number }
  ticketsOpen: number
  revenueMrr: number
  trialUsers: number
  expiredUsers: number
  paidUsers: number
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

const MOCK_HEALTH: SystemHealthMetrics = {
  onlineUsers: 48,
  cpuPercent: 34,
  ramPercent: 61,
  storagePercent: 47,
  database: { status: 'healthy', latencyMs: 12 },
  api: { status: 'healthy', latencyMs: 28 },
  emailQueue: { status: 'degraded', pending: 126 },
  redis: { status: 'healthy', latencyMs: 3 },
  ticketsOpen: 12,
  revenueMrr: 186500,
  trialUsers: 34,
  expiredUsers: 9,
  paidUsers: 412,
  sampledAt: new Date().toISOString(),
  mock: true,
  source: '/v1/admin/system-health',
}

const MOCK_USERS: PlatformUserRow[] = [
  {
    id: 'u1',
    company: 'Erlenbox Lojistik',
    companyId: 'c1',
    user: 'Ahmet Yılmaz',
    email: 'ahmet@erlenbox.com',
    sessions: 2,
    devices: 3,
    mfaEnabled: true,
    lastLogin: '2026-07-14T08:22:00Z',
    plan: 'Pro',
    status: 'active',
  },
  {
    id: 'u2',
    company: 'Nova Medikal',
    companyId: 'c2',
    user: 'Selin Kaya',
    email: 'selin@novamedikal.com',
    sessions: 1,
    devices: 1,
    mfaEnabled: false,
    lastLogin: '2026-07-13T16:05:00Z',
    plan: 'Trial',
    status: 'trial',
  },
  {
    id: 'u3',
    company: 'Delta İnşaat',
    companyId: 'c3',
    user: 'Murat Demir',
    email: 'murat@deltainsaat.com',
    sessions: 0,
    devices: 2,
    mfaEnabled: true,
    lastLogin: '2026-06-28T11:40:00Z',
    plan: 'Business',
    status: 'suspended',
  },
  {
    id: 'u4',
    company: 'Atlas Perakende',
    companyId: 'c4',
    user: 'Zeynep Arslan',
    email: 'zeynep@atlas.com',
    sessions: 0,
    devices: 1,
    mfaEnabled: false,
    lastLogin: '2026-05-02T09:10:00Z',
    plan: 'Starter',
    status: 'expired',
  },
]

const MOCK_AUDIT: AuditLogEntry[] = [
  {
    id: 'a1',
    time: '2026-07-14T10:12:00Z',
    actor: 'admin@bachmain.com',
    action: 'user.force_logout',
    target: 'ahmet@erlenbox.com',
    ip: '185.25.10.4',
    meta: { sessionsCleared: 2 },
  },
  {
    id: 'a2',
    time: '2026-07-14T09:41:00Z',
    actor: 'admin@bachmain.com',
    action: 'user.upgrade_plan',
    target: 'Nova Medikal',
    ip: '185.25.10.4',
    meta: { from: 'Trial', to: 'Pro' },
  },
  {
    id: 'a3',
    time: '2026-07-13T18:02:00Z',
    actor: 'support@bachmain.com',
    action: 'user.suspend',
    target: 'murat@deltainsaat.com',
    ip: '31.210.40.12',
    meta: { reason: 'billing_hold' },
  },
  {
    id: 'a4',
    time: '2026-07-13T14:28:00Z',
    actor: 'system',
    action: 'auth.login_failed',
    target: 'selin@novamedikal.com',
    ip: '88.241.12.9',
    meta: { attempts: 3 },
  },
]

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

function isNotFoundOrUnavailable(err: unknown) {
  return err instanceof ApiError && (err.status === 404 || err.status === 501 || err.status >= 500)
}

export const platformAdminApi = {
  /** Live via GET /v1/admin/system-health */
  getSystemHealth: async (): Promise<SystemHealthMetrics> => {
    try {
      const data = await api.get<SystemHealthMetrics>('/v1/admin/system-health')
      return { ...data, mock: false, source: '/v1/admin/system-health' }
    } catch (err) {
      if (isNotFoundOrUnavailable(err) || err instanceof ApiError) {
        return { ...MOCK_HEALTH, sampledAt: new Date().toISOString() }
      }
      throw err
    }
  },

  /** GET /v1/admin/users */
  listUsers: async (): Promise<PlatformUserRow[]> => {
    try {
      const res = await api.get<{ rows: PlatformUserRow[] } | PlatformUserRow[]>('/v1/admin/users')
      return Array.isArray(res) ? res : (res.rows ?? [])
    } catch (err) {
      // Yalnızca endpoint yoksa mock; 401/403 gerçek hata olarak yüzeye çıksın
      if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
        return MOCK_USERS
      }
      throw err
    }
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

  /** GET /v1/admin/audit-logs — immutable, never delete */
  listAuditLogs: async (action?: string): Promise<AuditLogResponse> => {
    try {
      const q = action && action !== 'all' ? `?action=${encodeURIComponent(action)}` : ''
      const res = await api.get<{ rows: AuditLogEntry[] }>(`/v1/admin/audit-logs${q}`)
      return { rows: res.rows ?? [], immutable: true }
    } catch (err) {
      if (isNotFoundOrUnavailable(err) || err instanceof ApiError) {
        const rows =
          action && action !== 'all' ? MOCK_AUDIT.filter((r) => r.action === action) : MOCK_AUDIT
        return { rows, immutable: true }
      }
      throw err
    }
  },

  /** GET /security/overview — live Security Center score + panels */
  getSecurityOverview: async (): Promise<SecurityOverview> => {
    try {
      const data = await api.get<SecurityOverview>('/security/overview')
      return { ...data, mock: false, source: '/security/overview' }
    } catch (err) {
      if (isNotFoundOrUnavailable(err) || err instanceof ApiError) {
        return {
          ok: true,
          score: 42,
          sampledAt: new Date().toISOString(),
          production: false,
          database: 'unknown',
          panels: {
            audit: {
              status: 'degraded',
              label: 'Audit log',
              detail: 'API henüz yanıt vermedi',
              immutable: true,
            },
            sessions: { status: 'unknown', label: 'Oturumlar', detail: '—' },
            env: { status: 'unknown', label: 'ENV health', detail: '—' },
            api: { status: 'down', label: 'API', detail: 'Security overview endpoint unreachable' },
            openai: { status: 'unknown', label: 'OpenAI', detail: '—' },
            rateLimit: { status: 'unknown', label: 'Rate limit', detail: '—' },
            deploy: {
              status: 'degraded',
              label: 'CI / Deploy',
              detail: 'Security overview endpoint unreachable',
            },
            backup: {
              status: 'degraded',
              label: 'Backup',
              detail: 'Placeholder',
              placeholder: true,
            },
            storage: {
              status: 'degraded',
              label: 'Storage',
              detail: 'Placeholder',
              placeholder: true,
            },
          },
          recommendations: ['Admin API /security/overview erişimini doğrulayın'],
          mock: true,
          source: '/security/overview',
        }
      }
      throw err
    }
  },

  /** GET /aios/overview — AI Control Center */
  getAiosOverview: async (): Promise<AiosOverview> => {
    try {
      const data = await api.get<AiosOverview>('/aios/overview')
      return {
        ...data,
        mock: false,
        source: data.source || '/aios/overview',
        providersConfigured:
          data.providersConfigured ?? data.providers?.filter((p) => p.configured).length ?? 0,
      }
    } catch (err) {
      if (isNotFoundOrUnavailable(err) || err instanceof ApiError) {
        return {
          ok: true,
          agentsTotal: 23,
          toolsTotal: 19,
          providersConfigured: 0,
          providers: [
            { id: 'openai', label: 'OpenAI', configured: false, models: ['gpt-4o'] },
            { id: 'anthropic', label: 'Anthropic Claude', configured: false },
            { id: 'gemini', label: 'Google Gemini', configured: false },
            { id: 'azure_openai', label: 'Azure OpenAI', configured: false },
            { id: 'local', label: 'Yerel LLM', configured: false },
          ],
          agents: [],
          tools: [],
          mock: true,
          source: '/aios/overview',
          sampledAt: new Date().toISOString(),
        }
      }
      throw err
    }
  },
}
