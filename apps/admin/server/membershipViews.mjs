/** Map platform store records into admin module rows. */

export function statusLabel(status) {
  const map = {
    active: 'Aktif',
    trial: 'Deneme',
    trialing: 'Deneme',
    suspended: 'Askıda',
    churned: 'İptal',
    cancelled: 'İptal',
    expired: 'Süresi Doldu',
    pending: 'Bekleyen',
    pending_payment: 'Ödeme Bekliyor',
    grace: 'Grace',
    paid: 'Ödendi',
    overdue: 'Gecikmiş',
  }
  return map[status] || status || '—'
}

export function remainingDaysFromExpiry(licenseExpiry) {
  if (!licenseExpiry || licenseExpiry === '—') return null
  const end = new Date(`${String(licenseExpiry).slice(0, 10)}T23:59:59.999`)
  if (Number.isNaN(end.getTime())) return null
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

/**
 * Informative membership status for admin list/detail.
 * Examples: "Demo 6 gün kaldı", "Paket 14 gün kaldı", "Paket Bitti", "Demo Bitti"
 */
export function membershipStatusDisplay({
  isDemo = false,
  status,
  subscriptionStatus,
  licenseExpiry,
} = {}) {
  const raw = String(subscriptionStatus || status || 'trial').toLowerCase()
  const days = remainingDaysFromExpiry(licenseExpiry)
  const isSuspended = raw === 'suspended'
  const isCancelled = raw === 'churned' || raw === 'cancelled'
  const isPendingPay = raw === 'pending_payment' || raw === 'pending'
  const isTrialish =
    isDemo || raw === 'trial' || raw === 'trialing' || raw === 'demo' || raw === 'demo_request'
  const isPaid =
    raw === 'active' ||
    raw === 'grace' ||
    raw === 'expired' ||
    (!isTrialish && !isSuspended && !isCancelled && !isPendingPay)

  if (isSuspended) {
    return { label: 'Askıda', kind: 'suspended', remainingDays: days, badge: 'warning' }
  }
  if (isCancelled) {
    return { label: 'İptal', kind: 'cancelled', remainingDays: days, badge: 'danger' }
  }
  if (isPendingPay) {
    return {
      label: 'Ödeme Bekliyor',
      kind: 'pending_payment',
      remainingDays: days,
      badge: 'warning',
    }
  }

  if (isTrialish) {
    if (days === null) {
      return {
        label: isDemo ? 'Demo Kullanıcısı' : 'Deneme',
        kind: 'demo_unknown',
        remainingDays: null,
        badge: 'gold',
      }
    }
    if (days < 0) {
      return { label: 'Demo Bitti', kind: 'demo_ended', remainingDays: days, badge: 'danger' }
    }
    if (days === 0) {
      return {
        label: 'Demo Kullanıcısı · bugün bitiyor',
        kind: 'demo_active',
        remainingDays: 0,
        badge: 'warning',
      }
    }
    return {
      label: `Demo Kullanıcısı · ${days} gün`,
      kind: 'demo_active',
      remainingDays: days,
      badge: days <= 3 ? 'warning' : 'gold',
    }
  }

  if (isPaid || raw === 'expired') {
    if (days !== null && days < 0) {
      return { label: 'Paket Bitti', kind: 'package_ended', remainingDays: days, badge: 'danger' }
    }
    if (raw === 'expired') {
      return { label: 'Paket Bitti', kind: 'package_ended', remainingDays: days, badge: 'danger' }
    }
    if (days === 0) {
      return {
        label: 'Paket bugün bitiyor',
        kind: 'package_active',
        remainingDays: 0,
        badge: 'warning',
      }
    }
    if (days !== null && days > 0) {
      return {
        label: `Paket ${days} gün kaldı`,
        kind: 'package_active',
        remainingDays: days,
        badge: days <= 7 ? 'warning' : 'success',
      }
    }
    return { label: 'Aktif', kind: 'package_active', remainingDays: days, badge: 'success' }
  }

  return {
    label: statusLabel(raw),
    kind: 'other',
    remainingDays: days,
    badge: 'default',
  }
}

function sourceLabel(source, isDemo) {
  if (isDemo) return 'Demo Kullanıcısı'
  const raw = String(source || '')
  if (
    raw === 'self_signup' ||
    raw === 'bachmain_register_page' ||
    raw === 'bachmain_register_checkout' ||
    raw === 'web'
  ) {
    return 'Web Üyelik'
  }
  if (raw === 'demo_request') return 'Demo Kullanıcısı'
  if (raw === 'demo_converted') return 'Demo → Üyelik'
  if (!raw || raw === 'manual' || raw === 'Manuel') return 'Manuel'
  return raw
}

export function customerToRow(c, account) {
  const isDemo =
    account?.role === 'demo_lead' ||
    account?.canLogin === false ||
    c?.source === 'demo_request' ||
    account?.source === 'demo_request'
  const display = membershipStatusDisplay({
    isDemo,
    status: c.status,
    subscriptionStatus: c.subscriptionStatus,
    licenseExpiry: c.licenseExpiry,
  })
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
    planCode: c.planCode || null,
    mrr: typeof c.mrr === 'number' ? `₺${c.mrr.toLocaleString('tr-TR')}` : c.mrr || '₺0',
    status: display.label,
    statusRaw: c.status || 'trial',
    statusKind: display.kind,
    statusBadge: display.badge,
    remainingDays: display.remainingDays,
    source: sourceLabel(c.source, isDemo),
    sourceRaw: c.source || account?.source || 'manual',
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
    const licenseExpiry = c?.licenseExpiry || a.licenseExpiry || null
    const display = membershipStatusDisplay({
      isDemo,
      status: c?.status || (isDemo ? 'trial' : 'trial'),
      subscriptionStatus: c?.subscriptionStatus,
      licenseExpiry,
    })
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
      planCode: c?.planCode || a.planCode || null,
      status: display.label,
      statusRaw: c?.status || (isDemo ? 'demo' : 'trial'),
      statusKind: display.kind,
      statusBadge: display.badge,
      remainingDays: display.remainingDays,
      source: sourceLabel(a.source || c?.source, isDemo),
      sourceRaw: a.source || c?.source || 'web',
      customerId: a.customerId,
      tenantCode: a.tenantCode || c?.tenantCode || '—',
      licenseExpiry: licenseExpiry || '—',
      lastLoginAt: a.lastLoginAt || a.lastDemoAt || '—',
      createdAt: a.createdAt || '—',
      role: isDemo ? 'demo' : a.role || 'owner',
      companySize: a.companySize || c?.companySize || '—',
      message: a.demoMessage || c?.demoMessage || '—',
      canLogin: a.canLogin !== false,
      subscriptionStatus: c?.subscriptionStatus || null,
    }
  })
}

export function buildMembershipDetail(store, accountId) {
  const key = String(accountId || '').trim()
  if (!key) return null
  const accounts = store.accounts || []
  let account =
    accounts.find((a) => a.id === key) ||
    accounts.find((a) => a.customerId === key) ||
    accounts.find((a) => String(a.email || '').toLowerCase() === key.toLowerCase()) ||
    null
  if (!account) return null

  const customer = (store.customers || []).find((c) => c.id === account.customerId) || null
  const row =
    buildAccountRows(store).find((r) => r.id === account.id) ||
    customerToRow(customer || { id: account.customerId, status: 'trial' }, account)

  const paymentRequests = (store.paymentRequests || [])
    .filter(
      (p) =>
        (account.customerId && p.customerId === account.customerId) ||
        (account.email &&
          p.email &&
          String(p.email).toLowerCase() === String(account.email).toLowerCase()),
    )
    .map((p, i) => ({ id: p.id || `pay_${i}`, ...p }))

  const tickets = (store.supportTickets || [])
    .filter((t) => account.customerId && t.customerId === account.customerId)
    .map((t, i) => ({ id: t.id || `tkt_${i}`, ...t }))

  const history = (store.billing?.history || [])
    .filter((h) => account.customerId && h.customerId === account.customerId)
    .slice(0, 40)
    .map((h, i) => ({ id: h.id || `hist_${i}`, ...h }))

  const mailLogs = (
    (store.mail?.logs || []).filter(
      (m) =>
        (account.customerId && m.customerId === account.customerId) ||
        m.accountId === account.id ||
        (m.to &&
          account.email &&
          String(m.to).toLowerCase() === String(account.email).toLowerCase()),
    ) || []
  )
    .slice(0, 30)
    .map((m, i) => ({ id: m.id || `mail_${i}`, ...m }))

  const authEvents = (
    (store.authEvents || []).filter(
      (e) =>
        (account.customerId && e.customerId === account.customerId) ||
        e.accountId === account.id ||
        (account.email && e.email === account.email),
    ) || []
  )
    .slice(0, 30)
    .map((e, i) => ({ id: e.id || `auth_${i}`, ...e }))

  return {
    ...row,
    id: account.id,
    account: {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      phone: account.phone,
      gsm: account.gsm,
      role: account.role,
      canLogin: account.canLogin,
      tenantCode: account.tenantCode,
      companyName: account.companyName,
      taxNo: account.taxNo,
      taxOffice: account.taxOffice,
      address: account.address,
      city: account.city,
      district: account.district,
      companySize: account.companySize,
      demoMessage: account.demoMessage,
      source: account.source,
      createdAt: account.createdAt,
      lastLoginAt: account.lastLoginAt,
      lastDemoAt: account.lastDemoAt,
      passwordChangedAt: account.passwordChangedAt,
      onboardingCompleted: account.onboardingCompleted,
    },
    customer: customer
      ? {
          id: customer.id,
          company: customer.company,
          contact: customer.contact,
          email: customer.email,
          phone: customer.phone,
          status: customer.status,
          subscriptionStatus: customer.subscriptionStatus,
          plan: customer.plan,
          planCode: customer.planCode,
          mrr: customer.mrr,
          licenseExpiry: customer.licenseExpiry,
          city: customer.city,
          taxNo: customer.taxNo,
          balance: customer.balance,
          createdAt: customer.createdAt,
          source: customer.source,
          tenantCode: customer.tenantCode,
          limits: customer.limits,
          graceUntil: customer.graceUntil,
        }
      : null,
    paymentRequests,
    supportTickets: tickets,
    billingHistory: history,
    mailLogs,
    authEvents,
  }
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
  const rows = buildAccountRows(store)
  const webSignups = customers.filter((c) => c.source === 'self_signup').length
  const trials = customers.filter((c) => c.status === 'trial').length
  const active = customers.filter((c) => c.status === 'active').length
  const pendingPay = payments.filter((p) => p.status === 'pending').length
  const demoEnded = rows.filter((r) => r.statusKind === 'demo_ended').length
  const packageEnded = rows.filter((r) => r.statusKind === 'package_ended').length
  return [
    { label: 'Toplam Müşteri', value: String(customers.length), change: '', trend: 'up' },
    { label: 'Web Üyelik', value: String(webSignups), change: '', trend: 'up' },
    { label: 'Deneme', value: String(trials), change: '', trend: 'neutral' },
    { label: 'Aktif / Hesap', value: `${active} / ${accounts.length}`, change: '', trend: 'up' },
    {
      label: 'Süresi Biten',
      value: String(demoEnded + packageEnded),
      change: demoEnded ? `${demoEnded} demo` : '',
      trend: demoEnded + packageEnded ? 'warning' : 'neutral',
    },
    {
      label: 'Ödeme Talebi',
      value: String(pendingPay),
      change: '',
      trend: pendingPay ? 'warning' : 'neutral',
    },
  ]
}
