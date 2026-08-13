import { api } from '@/lib/api'
import type { Customer, MetricItem, SupportTicket, TimelineEvent } from '@/types'
import { getModuleById } from '@/data/modules'
import { dispatchSupportUpdated } from '@/lib/supportAlertEvents'

export {
  platformAdminApi,
  type SystemHealthMetrics,
  type PlatformUserRow,
  type AuditLogEntry,
  type AuditLogResponse,
  type ActionResult,
  type ServiceStatus,
} from './platformAdminApi'

export interface DashboardData {
  kpis: MetricItem[]
  revenueChart: { label: string; value: number }[]
  recentActivities: TimelineEvent[]
  expiringLicenses: Customer[]
  openTickets: SupportTicket[]
  pendingPayments: {
    id: string
    customer: string
    amount: number
    dueDate: string
    status: string
  }[]
  systemHealth: { name: string; status: string; uptime: string; latency: string }[]
}

export interface ModuleListResponse {
  rows: Record<string, unknown>[]
  metrics: MetricItem[]
}

export interface CustomerFull extends Customer {
  userList: {
    id: string
    name: string
    email: string
    role: string
    lastLogin: string
    status: string
  }[]
  invoices: { id: string; number: string; date: string; amount: number; status: string }[]
  payments: { id: string; date: string; amount: number; method: string; status: string }[]
  aiUsage: { totalQueries: number; tokensUsed: number; costEstimate: number; topFeatures: string[] }
  loginHistory: { id: string; user: string; ip: string; device: string; date: string }[]
  timeline: TimelineEvent[]
  supportTickets: SupportTicket[]
  passwordChangedAt?: string | null
  mailLogs?: {
    id: string
    to?: string
    subject?: string
    template?: string
    status?: string
    error?: string | null
    createdAt?: string
    sentAt?: string | null
  }[]
  authEvents?: {
    id: string
    type?: string
    email?: string
    at?: string
    result?: string
    ip?: string
  }[]
}

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
}

export const customersApi = {
  list: () => api.get<Customer[]>('/customers'),
  get: (id: string) => api.get<CustomerFull>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data),
  update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
}

export const supportApi = {
  list: () => api.get<SupportTicket[]>('/support/tickets'),
  get: (id: string) =>
    api.get<SupportTicket>(`/support-ticket?id=${encodeURIComponent(id)}`),
  create: (data: Partial<SupportTicket>) =>
    api
      .post<{ ok?: boolean; ticket?: SupportTicket } | SupportTicket>('/support/tickets', data)
      .then((result) => {
        dispatchSupportUpdated()
        return result
      }),
  update: (
    id: string,
    patch: { status?: string; priority?: string; assignee?: string },
  ) =>
    api
      .post<{ ok: boolean; ticket: SupportTicket }>(
        `/support-ticket?id=${encodeURIComponent(id)}&op=update`,
        patch,
      )
      .then((result) => {
        dispatchSupportUpdated()
        return result
      }),
  addNote: (id: string, content: string, author = 'Admin') =>
    api
      .post(`/support-ticket?id=${encodeURIComponent(id)}&op=notes`, { content, author })
      .then((result) => {
        dispatchSupportUpdated()
        return result
      }),
  reply: (id: string, content: string, author = 'Destek') =>
    api
      .post<{ ok: boolean; reply: { id: string; content: string } }>(
        `/support-ticket?id=${encodeURIComponent(id)}&op=reply`,
        {
          content,
          author,
          notifyUser: true,
        },
      )
      .then((result) => {
        dispatchSupportUpdated()
        return result
      }),
}

export const modulesApi = {
  list: (moduleId: string) => api.get<ModuleListResponse>(`/modules/${moduleId}`),
  get: (moduleId: string, itemId: string) =>
    api.get<Record<string, unknown>>(`/modules/${moduleId}/${itemId}`),
  create: (moduleId: string, data: Record<string, unknown>) =>
    api.post(`/modules/${moduleId}`, data),
  update: (moduleId: string, itemId: string, data: Record<string, unknown>) =>
    api.put(`/modules/${moduleId}/${itemId}`, data),
  delete: (moduleId: string, itemId: string) => api.delete(`/modules/${moduleId}/${itemId}`),
  bulkDelete: (moduleId: string, ids: string[]) =>
    api.post(`/modules/${moduleId}/bulk-delete`, { ids }),
}

export interface MembershipRow {
  id: string
  email: string
  fullName: string
  company: string
  phone?: string
  gsm?: string
  taxNo?: string
  taxOffice?: string
  address?: string
  city?: string
  district?: string
  plan?: string
  planCode?: string | null
  status: string
  statusRaw?: string
  statusKind?: string
  statusBadge?: string
  remainingDays?: number | null
  source?: string
  sourceRaw?: string
  customerId?: string
  tenantCode?: string
  licenseExpiry?: string
  lastLoginAt?: string
  createdAt?: string
  role?: string
  companySize?: string
  message?: string
  canLogin?: boolean
  subscriptionStatus?: string | null
  openTicketCount?: number
  lastActivityAt?: string
  lastPaymentStatus?: string | null
}

export interface MembershipDetail extends MembershipRow {
  account?: Record<string, unknown>
  customer?: Record<string, unknown> | null
  paymentRequests?: Record<string, unknown>[]
  supportTickets?: Record<string, unknown>[]
  billingHistory?: Record<string, unknown>[]
  mailLogs?: Record<string, unknown>[]
  authEvents?: Record<string, unknown>[]
  emailChanges?: Array<{
    id: string
    oldEmail?: string
    newEmail?: string | null
    status?: string
    autoApproved?: boolean
    staffEmail?: string | null
    createdAt?: string
    completedAt?: string | null
    expiresAt?: string
  }>
}

export const membershipsApi = {
  list: () => api.get<ModuleListResponse>('/modules/memberships'),
  /** Uses single-segment /api/member?id=… — multi-segment /api/a/b/c is NOT_FOUND on Vercel. */
  get: (id: string) => {
    const key = decodeURIComponent(String(id || '').trim())
    return api.get<MembershipDetail>(`/member?id=${encodeURIComponent(key)}`)
  },
  extend: (id: string, body: { days?: number; mode?: 'trial' | 'active'; note?: string }) =>
    api.post<{ ok: boolean; licenseExpiry?: string; detail?: MembershipDetail }>('/member', {
      op: 'extend',
      id,
      ...body,
    }),
  action: (
    id: string,
    body: {
      action: 'suspend' | 'activate' | 'set_plan' | 'convert_demo'
      planCode?: string
      period?: string
      asTrial?: boolean
      days?: number
    },
  ) =>
    api.post<{ ok: boolean; detail?: MembershipDetail }>('/member', {
      op: 'action',
      id,
      ...body,
    }),
  delete: (id: string) =>
    api.post<{ ok: boolean; deletedAccountId?: string }>('/member', {
      op: 'delete',
      id,
    }),
  startEmailChange: (id: string) =>
    api.post<{ ok: boolean; request?: Record<string, unknown>; detail?: MembershipDetail }>(
      '/member',
      {
        op: 'start_email_change',
        id,
      },
    ),
}

export async function fetchModulePage(moduleId: string) {
  const config = getModuleById(moduleId)
  if (!config) throw new Error('Modül bulunamadı')

  const { rows, metrics } = await modulesApi.list(moduleId)
  return { ...config, rows, metrics }
}
