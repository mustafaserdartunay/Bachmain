/** Map platform store records into admin module rows. */

export function statusLabel(status) {
  const map = {
    active: 'Aktif',
    trial: 'Deneme',
    suspended: 'Askıda',
    churned: 'İptal',
    cancelled: 'İptal',
    pending: 'Bekleyen',
    paid: 'Ödendi',
    overdue: 'Gecikmiş',
  }
  return map[status] || status || '—'
}

export function customerToRow(c, account) {
  return {
    id: c.id,
    company: c.company,
    contact: c.contact,
    email: c.email || account?.email || '—',
    phone: c.phone || account?.phone || '—',
    city: c.city || '—',
    plan: c.plan || 'Starter',
    mrr: typeof c.mrr === 'number' ? `₺${c.mrr.toLocaleString('tr-TR')}` : c.mrr || '₺0',
    status: statusLabel(c.status),
    source: c.source === 'self_signup' ? 'Web Üyelik' : c.source || 'Manuel',
    licenseExpiry: c.licenseExpiry || '—',
    tenantCode: c.tenantCode || account?.tenantCode || '—',
    createdAt: c.createdAt || '—',
  }
}

export function buildCustomerRows(store) {
  const accounts = store.accounts || []
  const byCustomer = new Map(accounts.map((a) => [a.customerId, a]))
  return (store.customers || []).map((c) => customerToRow(c, byCustomer.get(c.id)))
}

export function buildAccountRows(store) {
  const customers = store.customers || []
  const byId = new Map(customers.map((c) => [c.id, c]))
  return (store.accounts || []).map((a) => {
    const c = byId.get(a.customerId)
    return {
      id: a.id,
      email: a.email,
      fullName: a.fullName,
      company: a.companyName || c?.company || '—',
      phone: a.phone || c?.phone || '—',
      plan: a.plan || c?.plan || 'Starter',
      status: statusLabel(c?.status || 'trial'),
      customerId: a.customerId,
      tenantCode: a.tenantCode || '—',
      lastLoginAt: a.lastLoginAt || '—',
      createdAt: a.createdAt || '—',
      role: a.role || 'owner',
    }
  })
}

export function buildPaymentRequestRows(store) {
  return (store.paymentRequests || []).map((p) => ({
    id: p.id,
    email: p.email || '—',
    company: p.companyName || '—',
    phone: p.phone || '—',
    plan: p.plan || '—',
    status: statusLabel(p.status || 'pending'),
    source: p.source || 'checkout',
    customerId: p.customerId || '—',
    createdAt: p.createdAt || '—',
  }))
}

export function buildMembershipMetrics(store) {
  const customers = store.customers || []
  const accounts = store.accounts || []
  const payments = store.paymentRequests || []
  const webSignups = customers.filter((c) => c.source === 'self_signup').length
  const trials = customers.filter((c) => c.status === 'trial').length
  const active = customers.filter((c) => c.status === 'active').length
  const pendingPay = payments.filter((p) => p.status === 'pending').length
  return [
    { label: 'Toplam Müşteri', value: String(customers.length), change: '', trend: 'up' },
    { label: 'Web Üyelik', value: String(webSignups), change: '', trend: 'up' },
    { label: 'Deneme', value: String(trials), change: '', trend: 'neutral' },
    { label: 'Aktif / Hesap', value: `${active} / ${accounts.length}`, change: '', trend: 'up' },
    { label: 'Ödeme Talebi', value: String(pendingPay), change: '', trend: pendingPay ? 'warning' : 'neutral' },
  ]
}
