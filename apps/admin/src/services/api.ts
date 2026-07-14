import { api } from '@/lib/api'
import type { Customer, MetricItem, SupportTicket, TimelineEvent } from '@/types'
import { getModuleById } from '@/data/modules'

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
  pendingPayments: { id: string; customer: string; amount: number; dueDate: string; status: string }[]
  systemHealth: { name: string; status: string; uptime: string; latency: string }[]
}

export interface ModuleListResponse {
  rows: Record<string, unknown>[]
  metrics: MetricItem[]
}

export interface CustomerFull extends Customer {
  userList: { id: string; name: string; email: string; role: string; lastLogin: string; status: string }[]
  invoices: { id: string; number: string; date: string; amount: number; status: string }[]
  payments: { id: string; date: string; amount: number; method: string; status: string }[]
  aiUsage: { totalQueries: number; tokensUsed: number; costEstimate: number; topFeatures: string[] }
  loginHistory: { id: string; user: string; ip: string; device: string; date: string }[]
  timeline: TimelineEvent[]
  supportTickets: SupportTicket[]
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
  get: (id: string) => api.get<SupportTicket>(`/support/tickets/${id}`),
  create: (data: Partial<SupportTicket>) => api.post<SupportTicket>('/support/tickets', data),
  addNote: (id: string, content: string, author = 'Admin') =>
    api.post(`/support/tickets/${id}/notes`, { content, author }),
}

export const modulesApi = {
  list: (moduleId: string) => api.get<ModuleListResponse>(`/modules/${moduleId}`),
  get: (moduleId: string, itemId: string) => api.get<Record<string, unknown>>(`/modules/${moduleId}/${itemId}`),
  create: (moduleId: string, data: Record<string, unknown>) => api.post(`/modules/${moduleId}`, data),
  update: (moduleId: string, itemId: string, data: Record<string, unknown>) =>
    api.put(`/modules/${moduleId}/${itemId}`, data),
  delete: (moduleId: string, itemId: string) => api.delete(`/modules/${moduleId}/${itemId}`),
  bulkDelete: (moduleId: string, ids: string[]) =>
    api.post(`/modules/${moduleId}/bulk-delete`, { ids }),
}

export async function fetchModulePage(moduleId: string) {
  const config = getModuleById(moduleId)
  if (!config) throw new Error('Modül bulunamadı')

  const { rows, metrics } = await modulesApi.list(moduleId)
  return { ...config, rows, metrics }
}
