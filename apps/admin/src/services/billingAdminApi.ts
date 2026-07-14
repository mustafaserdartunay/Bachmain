import { api } from '@/lib/api'

export const billingAdminApi = {
  overview: () => api.get<Record<string, unknown>>('/billing/admin/overview'),
  plans: () => api.get<{ ok: boolean; plans: PlanRow[]; modules: ModuleDef[] }>('/billing/admin/plans'),
  createPlan: (body: Partial<PlanRow>) => api.post<{ ok: boolean; plan: PlanRow }>('/billing/admin/plans', body),
  updatePlan: (id: string, body: Partial<PlanRow>) =>
    api.patch<{ ok: boolean; plan: PlanRow }>(`/billing/admin/plans/${id}`, body),
  addons: () => api.get<{ ok: boolean; addons: AddonRow[] }>('/billing/admin/addons'),
  createAddon: (body: Partial<AddonRow>) => api.post<{ ok: boolean; addon: AddonRow }>('/billing/admin/addons', body),
  updateAddon: (id: string, body: Partial<AddonRow>) =>
    api.patch<{ ok: boolean; addon: AddonRow }>(`/billing/admin/addons/${id}`, body),
  subscriptions: () => api.get<{ ok: boolean; rows: SubscriptionRow[] }>('/billing/admin/subscriptions'),
  patchSubscription: (id: string, body: Record<string, unknown>) =>
    api.patch(`/billing/admin/subscriptions/${id}`, body),
  payments: () => api.get<{ ok: boolean; rows: PaymentRow[] }>('/billing/admin/payments'),
  approvePayment: (id: string) => api.post(`/billing/admin/payments/${id}/approve`, {}),
  invoices: () => api.get<{ ok: boolean; rows: InvoiceRow[] }>('/billing/admin/invoices'),
  coupons: () => api.get<{ ok: boolean; rows: CouponRow[] }>('/billing/admin/coupons'),
  createCoupon: (body: Partial<CouponRow>) => api.post('/billing/admin/coupons', body),
  campaigns: () => api.get<{ ok: boolean; rows: CampaignRow[] }>('/billing/admin/campaigns'),
  createCampaign: (body: Partial<CampaignRow>) => api.post('/billing/admin/campaigns', body),
  trialPeriods: () => api.get<{ ok: boolean; rows: TrialRow[] }>('/billing/admin/trial-periods'),
  createTrial: (body: Partial<TrialRow>) => api.post('/billing/admin/trial-periods', body),
  renewals: () => api.get<{ ok: boolean; rows: SubscriptionRow[] }>('/billing/admin/renewals'),
  history: () => api.get<{ ok: boolean; rows: HistoryRow[] }>('/billing/admin/history'),
}

export interface ModuleDef {
  code: string
  label: string
  group: string
}

export interface PlanRow {
  id: string
  code: string
  name: string
  description?: string
  prices?: Record<string, number>
  modules?: string[]
  maxUsers?: number
  storageGb?: number
  active?: boolean
  sortOrder?: number
}

export interface AddonRow {
  id: string
  code: string
  label: string
  monthlyPrice: number
  yearlyPrice: number
  trialDays: number
  active?: boolean
}

export interface SubscriptionRow {
  id: string
  customerId: string
  company?: string
  email?: string
  planName?: string
  planCode?: string
  status: string
  period?: string
  periodEnd?: string
  graceUntil?: string | null
  remainingDays?: number | null
  remainingHours?: number | null
  remainingMinutes?: number | null
  autoRenew?: boolean
}

export interface PaymentRow {
  id: string
  customerId?: string
  planCode?: string
  method?: string
  status?: string
  amountTry?: number
  period?: string
  createdAt?: string
}

export interface InvoiceRow {
  id: string
  number?: string
  customerId?: string
  amountTry?: number
  issuedAt?: string
  planCode?: string
}

export interface CouponRow {
  id?: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  active?: boolean
  maxUses?: number | null
  usedCount?: number
  expiresAt?: string | null
}

export interface CampaignRow {
  id?: string
  name: string
  description?: string
  planCodes?: string[]
  discountPercent?: number
  active?: boolean
}

export interface TrialRow {
  id?: string
  name: string
  days: number
  planCode: string
  active?: boolean
}

export interface HistoryRow {
  id: string
  customerId?: string
  action: string
  at?: string
  meta?: Record<string, unknown>
}
