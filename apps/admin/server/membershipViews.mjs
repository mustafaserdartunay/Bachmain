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
    gsm: c.gsm || account?.gsm || c.phone || '—',
    taxNo: c.taxNo || account?.taxNo || '—',
    taxOffice: c.taxOffice || account?.taxOffice || '—',
    address: c.address || account?.address || '—',
    city: c.city || '—',
    district: c.district || account?.district || '—',
    plan: c.plan || 'Starter',
    mrr: typeof c.mrr === 'number' ? `₺${c.mrr.toLocaleString('tr-TR')}` : c.mrr || '₺0',
    status: statusLabel(c.status),
    source:
      c.source === 'self_signup'
        ? 'Web Üyelik'
        : c.source === 'demo_request'
          ? 'Demo Talep'
          : c.source === 'demo_converted'
            ? 'Demo → Üyelik'
            : c.source || 'Manuel',
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
    const isDemo = a.role === 'demo_lead' || a.canLogin === false || a.source === 'demo_request'
    return {
      id: a.id,
      email: a.email,
      fullName: a.fullName,
      company: a.companyName || c?.company || '—',
      phone: a.phone || c?.phone || '—',
      gsm: a.gsm || c?.gsm || a.phone || '—',
      taxNo: a.taxNo || c?.taxNo || '—',
      taxOffice: a.taxOffice || c?.taxOffice || '—',
      address: a.address || c?.address || '—',
      city: a.city || c?.city || '—',
      district: a.district || c?.district || '—',
      plan: a.plan || c?.plan || 'Starter',
      status: isDemo ? 'Demo Talep' : statusLabel(c?.status || 'trial'),
      source: isDemo
        ? 'Demo Talep'
        : a.source === 'demo_converted'
          ? 'Demo → Üyelik'
          : a.source === 'self_signup'
            ? 'Web Üyelik'
            : a.source || 'Web',
      customerId: a.customerId,
      tenantCode: a.tenantCode || '—',
      lastLoginAt: a.lastLoginAt || a.lastDemoAt || '—',
      createdAt: a.createdAt || '—',
      role: isDemo ? 'demo' : a.role || 'owner',
      companySize: a.companySize || c?.companySize || '—',
      message: a.demoMessage || c?.demoMessage || '—',
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
