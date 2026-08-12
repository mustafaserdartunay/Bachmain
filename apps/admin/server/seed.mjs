/**
 * Empty baseline for admin store — no demo customers, tickets, or module filler.
 * Real members are created via signup / staff flows and persist in Neon or db.json.
 */
import { emptyModuleRows } from './purgeDemoData.mjs'

export const customers = []
export const supportTickets = []

export const seedData = {
  accounts: [],
  customers: [],
  supportTickets: [],
  customerExtras: {
    users: [],
    invoices: [],
    payments: [],
    aiUsage: { totalQueries: 0, tokensUsed: 0, costEstimate: 0, topFeatures: [] },
    loginHistory: [],
    timeline: [],
  },
  dashboard: {
    kpis: [],
    revenueChart: [],
    recentActivities: [],
    pendingPayments: [],
    systemHealth: [],
  },
  modules: emptyModuleRows(),
  announcements: [],
  auditLogs: [],
  sessions: [],
  authEvents: [],
  notifications: [],
  paymentRequests: [],
  _demoPurgeVersion: 1,
  _demoPurgedAt: new Date(0).toISOString(),
}
