import type { Customer, SupportTicket, TimelineEvent } from '@/types'

/** No demo customers — lists come from the live admin API. */
export const customers: Customer[] = []

/** No demo tickets — lists come from the live admin API. */
export const supportTickets: SupportTicket[] = []

export const dashboardKpis = []

export const revenueChart: { label: string; value: number }[] = []

export const recentActivities: TimelineEvent[] = []

export const expiringLicenses: Customer[] = []

export const pendingPayments: {
  id: string
  customer: string
  amount: number
  dueDate: string
  status: string
}[] = []

export const systemHealth: { name: string; status: string; uptime: string; latency: string }[] = []

export function getCustomerById(id: string) {
  return customers.find((c) => c.id === id)
}

export function getTicketById(id: string) {
  return supportTickets.find((t) => t.id === id)
}

export const customerUsers = (_customerId: string) => []

export const customerInvoices = (_customerId: string) => []

export const customerPayments = (_customerId: string) => []

export const customerAiUsage = () => ({
  totalQueries: 0,
  tokensUsed: 0,
  costEstimate: 0,
  topFeatures: [] as string[],
})

export const customerLoginHistory = (_customerId: string) => []

export const customerTimeline = (_customerId: string): TimelineEvent[] => []
