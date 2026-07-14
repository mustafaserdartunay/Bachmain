/**
 * Dynamic subscription / license engine backed by admin store (Neon app_state).
 */
import { withStore, loadStore, newId } from './store.mjs'
import {
  DEFAULT_ADDONS,
  DEFAULT_PLANS,
  MODULE_CATALOG,
  PERIOD_MONTHS,
  displayPlanName,
  modulesForPlan,
  normalizePlanCode,
} from './billingCatalog.mjs'

const GRACE_DAYS = 3
const REMINDER_DAYS = 7

function ensureBilling(store) {
  if (!store.billing) store.billing = {}
  const b = store.billing
  if (!Array.isArray(b.plans)) b.plans = []
  if (!Array.isArray(b.addons)) b.addons = []
  if (!Array.isArray(b.subscriptions)) b.subscriptions = []
  if (!Array.isArray(b.subscriptionAddons)) b.subscriptionAddons = []
  if (!Array.isArray(b.history)) b.history = []
  if (!Array.isArray(b.payments)) b.payments = []
  if (!Array.isArray(b.invoices)) b.invoices = []
  if (!Array.isArray(b.licenses)) b.licenses = []
  if (!Array.isArray(b.coupons)) b.coupons = []
  if (!Array.isArray(b.campaigns)) b.campaigns = []
  if (!Array.isArray(b.trialPeriods)) b.trialPeriods = []
  if (!Array.isArray(b.notificationLogs)) b.notificationLogs = []
  if (!Array.isArray(b.emailLogs)) b.emailLogs = []
  return b
}

export function seedBillingIfEmpty(store) {
  const b = ensureBilling(store)
  if (!b.plans.length) {
    b.plans = DEFAULT_PLANS.map((p) => ({
      id: newId('plan'),
      ...p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
  if (!b.addons.length) {
    b.addons = DEFAULT_ADDONS.map((a) => ({
      id: newId('addon'),
      ...a,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }
  if (!b.trialPeriods.length) {
    b.trialPeriods = [
      {
        id: newId('trial'),
        name: 'Standart Deneme',
        days: 7,
        planCode: 'starter',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ]
  }
  return b
}

function pushHistory(b, entry) {
  b.history.unshift({
    id: newId('sh'),
    at: new Date().toISOString(),
    ...entry,
  })
  b.history = b.history.slice(0, 2000)
}

function countdown(untilIso) {
  if (!untilIso) {
    return { remainingDays: null, remainingHours: null, remainingMinutes: null, endAt: null }
  }
  const end = new Date(untilIso)
  if (Number.isNaN(end.getTime())) {
    return { remainingDays: null, remainingHours: null, remainingMinutes: null, endAt: null }
  }
  const ms = end.getTime() - Date.now()
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000))
  return {
    remainingDays: Math.max(0, Math.ceil(ms / 86400000)),
    remainingHours: Math.floor(totalMinutes / 60),
    remainingMinutes: totalMinutes % 60,
    endAt: end.toISOString(),
    expired: ms < 0,
  }
}

function periodEndFrom(start, period) {
  const months = PERIOD_MONTHS[period] || PERIOD_MONTHS.month
  const d = new Date(start)
  d.setMonth(d.getMonth() + months)
  return d
}

function priceForPlan(plan, period) {
  const prices = plan?.prices || {}
  const n = Number(prices[period] ?? prices.month ?? 0)
  return Number.isFinite(n) ? n : 0
}

function applyCoupon(amount, coupon) {
  if (!coupon || !coupon.active) return { amount, discount: 0 }
  const now = Date.now()
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) return { amount, discount: 0 }
  if (coupon.maxUses != null && Number(coupon.usedCount || 0) >= Number(coupon.maxUses)) {
    return { amount, discount: 0 }
  }
  let discount = 0
  if (coupon.type === 'percent') discount = Math.round(amount * (Number(coupon.value) / 100))
  else discount = Number(coupon.value) || 0
  discount = Math.min(amount, Math.max(0, discount))
  return { amount: amount - discount, discount }
}

export function getPlanByCode(store, code) {
  const b = seedBillingIfEmpty(store)
  const normalized = normalizePlanCode(code)
  return b.plans.find((p) => p.code === normalized || p.name === displayPlanName(normalized)) || null
}

export function getCatalog(store) {
  const b = seedBillingIfEmpty(store)
  return {
    modules: MODULE_CATALOG,
    plans: b.plans
      .filter((p) => p.active !== false)
      .sort((a, b2) => (a.sortOrder || 0) - (b2.sortOrder || 0))
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        prices: p.prices,
        maxUsers: p.maxUsers,
        storageGb: p.storageGb,
        modules: p.modules || [],
        sortOrder: p.sortOrder,
      })),
    addons: b.addons.filter((a) => a.active !== false),
    periods: Object.keys(PERIOD_MONTHS),
  }
}

function rebuildLicense(store, customerId, sub, extraModules = []) {
  const b = ensureBilling(store)
  const plan = b.plans.find((p) => p.id === sub.planId) || getPlanByCode(store, sub.planCode)
  const modules = [...new Set([...(plan?.modules || []), ...extraModules, ...(sub.addonModules || [])])]
  let license = b.licenses.find((l) => l.customerId === customerId)
  if (!license) {
    license = { id: newId('lic'), customerId, createdAt: new Date().toISOString() }
    b.licenses.unshift(license)
  }
  license.subscriptionId = sub.id
  license.planCode = plan?.code || sub.planCode
  license.planName = plan?.name || displayPlanName(sub.planCode)
  license.status = sub.status
  license.modules = modules
  license.maxUsers = plan?.maxUsers ?? 3
  license.storageGb = plan?.storageGb ?? 2
  license.periodStart = sub.periodStart
  license.periodEnd = sub.periodEnd
  license.graceUntil = sub.graceUntil || null
  license.updatedAt = new Date().toISOString()

  const customer = (store.customers || []).find((c) => c.id === customerId)
  if (customer) {
    customer.plan = license.planName
    customer.planCode = license.planCode
    customer.status =
      sub.status === 'trialing'
        ? 'trial'
        : sub.status === 'expired'
          ? 'expired'
          : sub.status === 'grace'
            ? 'active'
            : sub.status === 'pending_payment'
              ? customer.status || 'trial'
              : 'active'
    if (sub.status === 'grace' && sub.graceUntil) {
      customer.licenseExpiry = String(sub.graceUntil).slice(0, 10)
    } else if (sub.periodEnd) {
      customer.licenseExpiry = String(sub.periodEnd).slice(0, 10)
    }
    customer.subscriptionStatus = sub.status
    customer.entitlements = modules
    customer.graceUntil = sub.graceUntil || null
  }

  return license
}

export function evaluateLifecycle(store, customerId) {
  const b = seedBillingIfEmpty(store)
  const sub = b.subscriptions.find((s) => s.customerId === customerId && !s.deletedAt)
  if (!sub) return null
  const now = Date.now()
  const periodEnd = sub.periodEnd ? new Date(sub.periodEnd).getTime() : null
  const graceUntil = sub.graceUntil ? new Date(sub.graceUntil).getTime() : null

  if (['active', 'trialing'].includes(sub.status) && periodEnd && periodEnd < now) {
    const graceEnd = new Date(periodEnd)
    graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS)
    sub.status = 'grace'
    sub.graceUntil = graceEnd.toISOString()
    sub.updatedAt = new Date().toISOString()
    pushHistory(b, {
      customerId,
      subscriptionId: sub.id,
      action: 'grace',
      meta: { graceUntil: sub.graceUntil },
    })
    rebuildLicense(store, customerId, sub)
    maybeNotify(store, customerId, 'grace_started', sub)
  } else if (sub.status === 'grace' && graceUntil && graceUntil < now) {
    sub.status = 'expired'
    sub.updatedAt = new Date().toISOString()
    pushHistory(b, { customerId, subscriptionId: sub.id, action: 'expired' })
    rebuildLicense(store, customerId, sub)
    maybeNotify(store, customerId, 'expired', sub)
  } else {
    maybeRemind(store, customerId, sub)
  }
  return sub
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function maybeNotify(store, customerId, type, sub) {
  const b = ensureBilling(store)
  const key = `${type}:${customerId}:${dayKey()}`
  if (b.notificationLogs.some((n) => n.key === key)) return
  const endDate = (sub.graceUntil || sub.periodEnd || '').slice(0, 10)
  const title =
    type === 'grace_started'
      ? 'Aboneliğiniz sona erdi — ek süre başladı'
      : type === 'expired'
        ? 'Aboneliğiniz pasif duruma alındı'
        : 'Abonelik hatırlatması'
  const body =
    type === 'grace_started'
      ? `Aboneliğiniz sona erdi. ${GRACE_DAYS} günlük ek kullanım süreniz başladı. Lütfen aboneliğinizi yenileyin.`
      : type === 'expired'
        ? 'Ek kullanım süreniz doldu. Verileriniz silinmedi; yeni işlem için aboneliğinizi yenileyin.'
        : `Aboneliğiniz ${endDate} tarihinde sona erecek. Kesintisiz kullanım için yenileyin.`

  b.notificationLogs.unshift({
    id: newId('nlog'),
    key,
    customerId,
    type,
    title,
    body,
    endDate,
    createdAt: new Date().toISOString(),
  })
  b.notificationLogs = b.notificationLogs.slice(0, 2000)

  if (!Array.isArray(store.notifications)) store.notifications = []
  store.notifications.unshift({
    id: newId('ntf'),
    title,
    body,
    type: 'subscription',
    customerId,
    createdAt: new Date().toISOString(),
  })

  b.emailLogs.unshift({
    id: newId('elog'),
    customerId,
    type,
    to: (store.customers || []).find((c) => c.id === customerId)?.email || '',
    subject: title,
    body,
    status: process.env.RESEND_API_KEY ? 'queued' : 'skipped_no_provider',
    createdAt: new Date().toISOString(),
  })
  b.emailLogs = b.emailLogs.slice(0, 2000)
}

function maybeRemind(store, customerId, sub) {
  if (!['active', 'trialing', 'grace'].includes(sub.status)) return
  const target = sub.status === 'grace' ? sub.graceUntil : sub.periodEnd
  if (!target) return
  const ms = new Date(target).getTime() - Date.now()
  const daysLeft = Math.ceil(ms / 86400000)
  if (sub.status === 'grace') {
    maybeNotify(store, customerId, 'grace_daily', sub)
    return
  }
  if (daysLeft <= REMINDER_DAYS && daysLeft >= 0) {
    maybeNotify(store, customerId, `renewal_${daysLeft}d`, sub)
  }
}

export function getSubscriptionSnapshot(store, customerId) {
  seedBillingIfEmpty(store)
  evaluateLifecycle(store, customerId)
  const b = ensureBilling(store)
  let sub = b.subscriptions.find((s) => s.customerId === customerId && !s.deletedAt)
  const customer = (store.customers || []).find((c) => c.id === customerId)

  if (!sub && customer) {
    // Bootstrap from legacy customer fields
    const plan = getPlanByCode(store, customer.planCode || customer.plan || 'starter')
    const periodEnd = customer.licenseExpiry
      ? new Date(customer.licenseExpiry + 'T23:59:59.999Z').toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString()
    const status =
      customer.status === 'expired'
        ? 'expired'
        : customer.status === 'trial'
          ? 'trialing'
          : 'active'
    sub = {
      id: newId('sub'),
      customerId,
      planId: plan?.id,
      planCode: plan?.code || 'starter',
      status,
      period: 'month',
      periodStart: customer.createdAt || new Date().toISOString(),
      periodEnd,
      graceUntil: null,
      autoRenew: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    b.subscriptions.unshift(sub)
    rebuildLicense(store, customerId, sub)
  }

  if (!sub) return null

  const plan = b.plans.find((p) => p.id === sub.planId) || getPlanByCode(store, sub.planCode)
  const license = b.licenses.find((l) => l.customerId === customerId)
  const addons = b.subscriptionAddons.filter((a) => a.subscriptionId === sub.id && a.status === 'active')
  const endIso = sub.status === 'grace' ? sub.graceUntil : sub.periodEnd
  const cd = countdown(endIso)
  const payments = b.payments.filter((p) => p.customerId === customerId).slice(0, 50)

  return {
    subscription: sub,
    plan: plan
      ? {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          prices: plan.prices,
          maxUsers: plan.maxUsers,
          storageGb: plan.storageGb,
          modules: plan.modules || [],
        }
      : null,
    license,
    entitlements: license?.modules || plan?.modules || [],
    addons,
    payments,
    history: b.history.filter((h) => h.customerId === customerId).slice(0, 50),
    countdown: cd,
    graceDays: GRACE_DAYS,
    reminderWindowDays: REMINDER_DAYS,
  }
}

export function entitlementPayloadForCustomer(store, customerId) {
  const snap = getSubscriptionSnapshot(store, customerId)
  if (!snap) {
    return {
      plan: 'Starter',
      planCode: 'starter',
      subscriptionStatus: 'trialing',
      entitlements: modulesFallback('starter'),
      limits: { maxUsers: 3, storageGb: 2 },
      remainingDays: 7,
      graceUntil: null,
      licenseExpiry: null,
    }
  }
  const endIso =
    snap.subscription.status === 'grace' ? snap.subscription.graceUntil : snap.subscription.periodEnd
  return {
    plan: snap.plan?.name || displayPlanName(snap.subscription.planCode),
    planCode: snap.plan?.code || snap.subscription.planCode,
    subscriptionStatus: snap.subscription.status,
    entitlements: snap.entitlements,
    limits: {
      maxUsers: snap.plan?.maxUsers ?? 3,
      storageGb: snap.plan?.storageGb ?? 2,
    },
    remainingDays: snap.countdown.remainingDays,
    remainingHours: snap.countdown.remainingHours,
    remainingMinutes: snap.countdown.remainingMinutes,
    graceUntil: snap.subscription.graceUntil,
    licenseExpiry: endIso ? String(endIso).slice(0, 10) : null,
    trialEnd: endIso,
    periodStart: snap.subscription.periodStart,
    periodEnd: snap.subscription.periodEnd,
    autoRenew: Boolean(snap.subscription.autoRenew),
  }
}

function modulesFallback(code) {
  return modulesForPlan(code)
}

export async function createCheckout(store, input) {
  const b = seedBillingIfEmpty(store)
  const planCode = normalizePlanCode(input.planCode || input.plan)
  const plan = getPlanByCode(store, planCode)
  if (!plan) {
    const err = new Error('Paket bulunamadı')
    err.code = 'PLAN_NOT_FOUND'
    throw err
  }
  const period = input.period || 'month'
  if (!PERIOD_MONTHS[period]) {
    const err = new Error('Geçersiz dönem')
    err.code = 'INVALID_PERIOD'
    throw err
  }
  const method = String(input.method || 'card').toLowerCase()
  let amount = priceForPlan(plan, period)
  let coupon = null
  if (input.couponCode) {
    coupon = b.coupons.find((c) => String(c.code).toUpperCase() === String(input.couponCode).toUpperCase())
    const applied = applyCoupon(amount, coupon)
    amount = applied.amount
  }

  const paymentId = newId('pay')
  const isCard = method === 'card' || method === 'stripe'
  const status = isCard && process.env.STRIPE_SECRET_KEY ? 'processing' : isCard ? 'pending_payment' : 'pending_payment'

  const payment = {
    id: paymentId,
    customerId: input.customerId,
    accountId: input.accountId || null,
    planCode: plan.code,
    planId: plan.id,
    period,
    method: isCard ? 'card' : method,
    amountTry: amount,
    currency: 'TRY',
    status,
    couponCode: coupon?.code || null,
    companyInvoice: Boolean(input.companyInvoice),
    billingName: input.billingName || '',
    taxNo: input.taxNo || '',
    ibanHint: process.env.BILLING_IBAN || 'TR00 0000 0000 0000 0000 0000 00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  b.payments.unshift(payment)

  // Pending subscription placeholder (not active until payment approved / stripe webhook)
  let sub = b.subscriptions.find((s) => s.customerId === input.customerId && !s.deletedAt)
  if (!sub) {
    sub = {
      id: newId('sub'),
      customerId: input.customerId,
      planId: plan.id,
      planCode: plan.code,
      status: 'pending_payment',
      period,
      periodStart: new Date().toISOString(),
      periodEnd: periodEndFrom(new Date(), period).toISOString(),
      graceUntil: null,
      autoRenew: Boolean(input.autoRenew),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    b.subscriptions.unshift(sub)
  } else if (!['active', 'trialing', 'grace'].includes(sub.status)) {
    sub.status = 'pending_payment'
    sub.pendingPlanId = plan.id
    sub.pendingPlanCode = plan.code
    sub.pendingPeriod = period
    sub.updatedAt = new Date().toISOString()
  } else {
    sub.pendingPlanId = plan.id
    sub.pendingPlanCode = plan.code
    sub.pendingPeriod = period
    sub.updatedAt = new Date().toISOString()
  }

  pushHistory(b, {
    customerId: input.customerId,
    subscriptionId: sub.id,
    action: 'checkout_created',
    meta: { paymentId, planCode: plan.code, method: payment.method, amount },
  })

  if (!Array.isArray(store.paymentRequests)) store.paymentRequests = []
  store.paymentRequests.unshift({
    id: paymentId,
    plan: plan.name,
    planCode: plan.code,
    customerId: input.customerId,
    email: input.email || '',
    companyName: input.companyName || '',
    phone: input.phone || '',
    status: payment.status,
    method: payment.method,
    amountTry: amount,
    period,
    createdAt: payment.createdAt,
    source: 'billing_checkout',
  })

  if (coupon) {
    coupon.usedCount = Number(coupon.usedCount || 0) + 1
  }

  return { payment, subscription: sub, plan, amountTry: amount }
}

export function activateFromPayment(store, paymentId, { provider = 'manual', raw = {} } = {}) {
  const b = seedBillingIfEmpty(store)
  const payment = b.payments.find((p) => p.id === paymentId)
  if (!payment) {
    const err = new Error('Ödeme bulunamadı')
    err.code = 'PAYMENT_NOT_FOUND'
    throw err
  }
  if (payment.status === 'succeeded') {
    return getSubscriptionSnapshot(store, payment.customerId)
  }

  const plan = b.plans.find((p) => p.id === payment.planId) || getPlanByCode(store, payment.planCode)
  const period = payment.period || 'month'
  const start = new Date()
  const end = periodEndFrom(start, period)

  let sub = b.subscriptions.find((s) => s.customerId === payment.customerId && !s.deletedAt)
  if (!sub) {
    sub = {
      id: newId('sub'),
      customerId: payment.customerId,
      createdAt: new Date().toISOString(),
    }
    b.subscriptions.unshift(sub)
  }

  const prevPlan = sub.planCode
  sub.planId = plan.id
  sub.planCode = plan.code
  sub.status = 'active'
  sub.period = period
  sub.periodStart = start.toISOString()
  sub.periodEnd = end.toISOString()
  sub.graceUntil = null
  sub.pendingPlanId = null
  sub.pendingPlanCode = null
  sub.pendingPeriod = null
  sub.updatedAt = new Date().toISOString()

  payment.status = 'succeeded'
  payment.provider = provider
  payment.paidAt = new Date().toISOString()
  payment.raw = raw
  payment.updatedAt = payment.paidAt

  const invoice = {
    id: newId('inv'),
    number: `BM-${Date.now().toString().slice(-8)}`,
    customerId: payment.customerId,
    paymentId: payment.id,
    amountTry: payment.amountTry,
    currency: 'TRY',
    issuedAt: new Date().toISOString(),
    planCode: plan.code,
    period,
  }
  b.invoices.unshift(invoice)

  const req = (store.paymentRequests || []).find((r) => r.id === payment.id)
  if (req) req.status = 'approved'

  const action =
    prevPlan && prevPlan !== plan.code
      ? priceForPlan(plan, period) >= priceForPlan(getPlanByCode(store, prevPlan), period)
        ? 'upgrade'
        : 'downgrade'
      : 'activate'

  pushHistory(b, {
    customerId: payment.customerId,
    subscriptionId: sub.id,
    action,
    meta: { paymentId: payment.id, planCode: plan.code, period },
  })
  pushHistory(b, {
    customerId: payment.customerId,
    subscriptionId: sub.id,
    action: 'payment',
    meta: { paymentId: payment.id, amountTry: payment.amountTry },
  })

  rebuildLicense(store, payment.customerId, sub)
  return getSubscriptionSnapshot(store, payment.customerId)
}

export function activatePlanDirect(store, customerId, planCode, period = 'month', meta = {}) {
  const b = seedBillingIfEmpty(store)
  const plan = getPlanByCode(store, planCode)
  if (!plan) throw Object.assign(new Error('Plan yok'), { code: 'PLAN_NOT_FOUND' })
  const start = new Date()
  let sub = b.subscriptions.find((s) => s.customerId === customerId && !s.deletedAt)
  if (!sub) {
    sub = { id: newId('sub'), customerId, createdAt: start.toISOString() }
    b.subscriptions.unshift(sub)
  }
  sub.planId = plan.id
  sub.planCode = plan.code
  sub.status = meta.status || 'active'
  sub.period = period
  sub.periodStart = start.toISOString()
  sub.periodEnd = periodEndFrom(start, period).toISOString()
  sub.graceUntil = null
  sub.updatedAt = start.toISOString()
  pushHistory(b, {
    customerId,
    subscriptionId: sub.id,
    action: meta.action || 'activate',
    meta: { planCode: plan.code, period, ...meta },
  })
  rebuildLicense(store, customerId, sub)
  return getSubscriptionSnapshot(store, customerId)
}

export function staffMutatePlan(store, planId, patch) {
  const b = seedBillingIfEmpty(store)
  const plan = b.plans.find((p) => p.id === planId)
  if (!plan) throw Object.assign(new Error('Paket bulunamadı'), { code: 'NOT_FOUND' })
  Object.assign(plan, patch, { updatedAt: new Date().toISOString() })
  return plan
}

export function staffCreatePlan(store, body) {
  const b = seedBillingIfEmpty(store)
  const code = normalizePlanCode(body.code || body.name)
  const plan = {
    id: newId('plan'),
    code,
    name: body.name || displayPlanName(code),
    description: body.description || '',
    prices: body.prices || { month: 0, year: 0 },
    maxUsers: body.maxUsers ?? 3,
    storageGb: body.storageGb ?? 2,
    modules: Array.isArray(body.modules) ? body.modules : [],
    sortOrder: body.sortOrder ?? b.plans.length + 1,
    active: body.active !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  b.plans.push(plan)
  return plan
}

export function staffMutateAddon(store, addonId, patch) {
  const b = seedBillingIfEmpty(store)
  const row = b.addons.find((a) => a.id === addonId)
  if (!row) throw Object.assign(new Error('Modül bulunamadı'), { code: 'NOT_FOUND' })
  Object.assign(row, patch, { updatedAt: new Date().toISOString() })
  return row
}

export function staffCreateAddon(store, body) {
  const b = seedBillingIfEmpty(store)
  const row = {
    id: newId('addon'),
    code: body.code,
    label: body.label || body.code,
    monthlyPrice: Number(body.monthlyPrice) || 0,
    yearlyPrice: Number(body.yearlyPrice) || 0,
    trialDays: Number(body.trialDays) || 0,
    active: body.active !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  b.addons.push(row)
  return row
}

export function listBillingAdmin(store) {
  const b = seedBillingIfEmpty(store)
  const subs = b.subscriptions.map((s) => {
    const cd = countdown(s.status === 'grace' ? s.graceUntil : s.periodEnd)
    const customer = (store.customers || []).find((c) => c.id === s.customerId)
    const plan = b.plans.find((p) => p.id === s.planId)
    return {
      ...s,
      company: customer?.company || customer?.companyName || '—',
      email: customer?.email || '—',
      planName: plan?.name || s.planCode,
      ...cd,
    }
  })
  return {
    plans: b.plans,
    addons: b.addons,
    subscriptions: subs,
    payments: b.payments.slice(0, 200),
    invoices: b.invoices.slice(0, 200),
    coupons: b.coupons,
    campaigns: b.campaigns,
    trialPeriods: b.trialPeriods,
    history: b.history.slice(0, 200),
    notificationLogs: b.notificationLogs.slice(0, 100),
    emailLogs: b.emailLogs.slice(0, 100),
    modules: MODULE_CATALOG,
    renewals: subs.filter((s) => s.autoRenew),
  }
}

export { ensureBilling, GRACE_DAYS, REMINDER_DAYS }

/** Ensure seed runs when store loads */
export async function bootstrapBillingStore() {
  return withStore((store) => {
    seedBillingIfEmpty(store)
    return store.billing
  })
}

export async function readCatalog() {
  const store = await loadStore()
  return getCatalog(store)
}
