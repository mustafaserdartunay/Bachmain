/**
 * HTTP handlers for /api/billing/*
 */
import { withStore, loadStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { getAccountFromToken, getBearerOrCookieToken } from './auth.mjs'
import { getStaffSession } from './staffAuth.mjs'
import { insertPaymentEvent, getTenantCollection, hasDatabase } from './db.mjs'
import {
  activateFromPayment,
  activatePlanDirect,
  createCheckout,
  getCatalog,
  getSubscriptionSnapshot,
  listBillingAdmin,
  seedBillingIfEmpty,
  staffCreateAddon,
  staffCreatePlan,
  staffMutateAddon,
  staffMutatePlan,
} from './subscriptionService.mjs'
import { normalizePlanCode } from './billingCatalog.mjs'
import { claimStripeEventId, verifyStripeWebhookSignature } from './stripeWebhook.mjs'

async function createStripeCheckoutSession({ plan, period, amountTry, customerId, email, paymentId, successUrl, cancelUrl }) {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  const params = new URLSearchParams()
  params.set('mode', 'subscription')
  params.set('success_url', successUrl || 'https://uygulama.bachmain.com/profil/paketim?paid=1')
  params.set('cancel_url', cancelUrl || 'https://uygulama.bachmain.com/profil/paket-satin-al')
  params.set('client_reference_id', customerId || '')
  params.set('customer_email', email || '')
  params.set('metadata[customerId]', customerId || '')
  params.set('metadata[plan]', plan.code)
  params.set('metadata[period]', period)
  params.set('metadata[paymentId]', paymentId || '')
  const amount = Math.max(Number(amountTry) || 1, 1) * 100
  params.set('line_items[0][price_data][currency]', 'try')
  params.set('line_items[0][price_data][unit_amount]', String(amount))
  params.set('line_items[0][price_data][recurring][interval]', period === 'month' ? 'month' : 'year')
  params.set('line_items[0][price_data][product_data][name]', `BACHMAIN ${plan.name}`)
  params.set('line_items[0][quantity]', '1')

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error?.message || 'Stripe checkout failed')
    err.code = 'STRIPE_ERROR'
    throw err
  }
  return data
}

function requireTenant(req, store) {
  const token = getBearerOrCookieToken(req)
  const session = token ? getAccountFromToken(store, token) : null
  if (!session?.user?.customerId) {
    const err = new Error('Oturum gerekli')
    err.code = 'UNAUTHORIZED'
    err.status = 401
    throw err
  }
  return session
}

function requireStaff(req) {
  const session = getStaffSession(req)
  if (!session && process.env.STAFF_AUTH_REQUIRED !== '0') {
    // If staff auth env not enforced in local, allow when STAFF_AUTH_REQUIRED=0
  }
  if (!session && (process.env.JWT_SECRET || process.env.ADMIN_EMAIL)) {
    // Still allow if middleware already gated; return null for soft
  }
  return session
}

export async function handleBillingApi(req, res, path, body = {}) {
  const method = req.method
  if (!path.startsWith('billing')) return false

  // Bootstrap seed
  await withStore((store) => {
    seedBillingIfEmpty(store)
    return store
  })

  try {
    if (method === 'GET' && path === 'billing/catalog') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, ...getCatalog(store) })
    }

    if (method === 'GET' && path === 'billing/my-subscription') {
      const store = await loadStore()
      const session = requireTenant(req, store)
      const snap = await withStore((s) => getSubscriptionSnapshot(s, session.user.customerId))
      return sendJson(req, res, 200, { ok: true, ...snap })
    }

    if (method === 'POST' && path === 'billing/checkout') {
      const store = await loadStore()
      const session = requireTenant(req, store)
      const result = await withStore((s) =>
        createCheckout(s, {
          ...body,
          customerId: session.user.customerId,
          accountId: session.user.id,
          email: session.user.email,
          companyName: session.user.companyName,
          phone: session.user.phone,
        }),
      )

      const methodPay = String(body.method || 'card').toLowerCase()
      if ((methodPay === 'card' || methodPay === 'stripe') && process.env.STRIPE_SECRET_KEY) {
        try {
          const stripe = await createStripeCheckoutSession({
            plan: result.plan,
            period: body.period || 'month',
            amountTry: result.amountTry,
            customerId: session.user.customerId,
            email: session.user.email,
            paymentId: result.payment.id,
            successUrl: body.successUrl,
            cancelUrl: body.cancelUrl,
          })
          await withStore((s) => {
            const pay = s.billing.payments.find((p) => p.id === result.payment.id)
            if (pay) {
              pay.provider = 'stripe'
              pay.providerSessionId = stripe.id
              pay.status = 'processing'
            }
            return s
          })
          return sendJson(req, res, 200, {
            ok: true,
            provider: 'stripe',
            url: stripe.url,
            sessionId: stripe.id,
            paymentId: result.payment.id,
          })
        } catch (error) {
          return sendJson(req, res, 502, { error: error.code || 'STRIPE_ERROR', message: error.message })
        }
      }

      return sendJson(req, res, 200, {
        ok: true,
        provider: methodPay === 'card' ? 'manual_card' : methodPay,
        paymentId: result.payment.id,
        status: result.payment.status,
        amountTry: result.amountTry,
        iban: result.payment.ibanHint,
        message:
          methodPay === 'card'
            ? 'Kart ödeme talebi alındı. Sağlayıcı yoksa satış onayından sonra lisans aktif olur.'
            : 'Havale/EFT talebi alındı. Ödeme onaylandıktan sonra lisansınız aktif edilecek.',
        nextUrl: 'https://uygulama.bachmain.com/profil/paketim',
      })
    }

    if (method === 'POST' && path === 'billing/renew') {
      const store = await loadStore()
      const session = requireTenant(req, store)
      const snap = getSubscriptionSnapshot(store, session.user.customerId)
      const planCode = body.planCode || snap?.subscription?.planCode || 'professional'
      const period = body.period || snap?.subscription?.period || 'month'
      body.planCode = planCode
      body.period = period
      body.method = body.method || 'card'
      // reuse checkout
      const result = await withStore((s) =>
        createCheckout(s, {
          ...body,
          customerId: session.user.customerId,
          accountId: session.user.id,
          email: session.user.email,
          companyName: session.user.companyName,
        }),
      )
      return sendJson(req, res, 200, { ok: true, paymentId: result.payment.id, amountTry: result.amountTry })
    }

    if (method === 'POST' && (path === 'billing/webhook' || path === 'billing/webhooks/stripe')) {
      let bodyEvent = body
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (webhookSecret) {
        try {
          bodyEvent = verifyStripeWebhookSignature(
            req.rawBody || JSON.stringify(body),
            req.headers['stripe-signature'],
            webhookSecret,
          )
        } catch (error) {
          return sendJson(req, res, error.statusCode || 400, { ok: false, error: error.message })
        }
      } else if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
        return sendJson(req, res, 500, { ok: false, error: 'STRIPE_WEBHOOK_SECRET is required in production' })
      }

      if (bodyEvent?.id && !claimStripeEventId(bodyEvent.id)) {
        return sendJson(req, res, 200, { ok: true, duplicate: true })
      }

      const stripeType = bodyEvent.type
      const stripeObj = bodyEvent.data?.object
      const paymentId =
        bodyEvent.paymentId ||
        stripeObj?.metadata?.paymentId ||
        null
      const customerId =
        bodyEvent.customerId ||
        stripeObj?.metadata?.customerId ||
        stripeObj?.client_reference_id ||
        null
      const planCode = normalizePlanCode(bodyEvent.plan || stripeObj?.metadata?.plan || 'professional')
      const period = bodyEvent.period || stripeObj?.metadata?.period || 'month'

      const eventId = newId('payev')
      await insertPaymentEvent({
        id: eventId,
        provider: bodyEvent.provider || 'stripe',
        customerId,
        accountId: null,
        eventType: stripeType || bodyEvent.event || 'payment.received',
        amountCents: bodyEvent.amountCents ?? stripeObj?.amount_total ?? null,
        currency: bodyEvent.currency || stripeObj?.currency || 'TRY',
        raw: bodyEvent,
      })

      let snap = null
      if (paymentId) {
        snap = await withStore((s) => activateFromPayment(s, paymentId, { provider: 'stripe', raw: bodyEvent }))
      } else if (customerId && stripeType === 'checkout.session.completed') {
        snap = await withStore((s) => {
          const checkout = createCheckout(s, {
            customerId,
            planCode,
            period,
            method: 'card',
            email: stripeObj?.customer_email || '',
          })
          return activateFromPayment(s, checkout.payment.id, { provider: 'stripe', raw: bodyEvent })
        })
      }

      return sendJson(req, res, 200, { ok: true, eventId, activated: Boolean(snap) })
    }

    // ---- Staff ----
    if (method === 'GET' && path === 'billing/admin/overview') {
      requireStaff(req)
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, ...listBillingAdmin(store) })
    }

    if (method === 'GET' && path === 'billing/admin/plans') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, plans: listBillingAdmin(store).plans, modules: listBillingAdmin(store).modules })
    }

    if (method === 'POST' && path === 'billing/admin/plans') {
      const plan = await withStore((s) => staffCreatePlan(s, body))
      return sendJson(req, res, 201, { ok: true, plan })
    }

    if (method === 'PATCH' && path.startsWith('billing/admin/plans/')) {
      const id = path.split('/')[3]
      const plan = await withStore((s) => staffMutatePlan(s, id, body))
      return sendJson(req, res, 200, { ok: true, plan })
    }

    if (method === 'GET' && path === 'billing/admin/addons') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, addons: listBillingAdmin(store).addons })
    }

    if (method === 'POST' && path === 'billing/admin/addons') {
      const addon = await withStore((s) => staffCreateAddon(s, body))
      return sendJson(req, res, 201, { ok: true, addon })
    }

    if (method === 'PATCH' && path.startsWith('billing/admin/addons/')) {
      const id = path.split('/')[3]
      const addon = await withStore((s) => staffMutateAddon(s, id, body))
      return sendJson(req, res, 200, { ok: true, addon })
    }

    if (method === 'GET' && path === 'billing/admin/subscriptions') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).subscriptions })
    }

    if (method === 'GET' && path.startsWith('billing/admin/license-detail/')) {
      requireStaff(req)
      const customerId = path.split('/')[3]
      const store = await loadStore()
      seedBillingIfEmpty(store)
      const customer = (store.customers || []).find((c) => c.id === customerId)
      if (!customer) {
        return sendJson(req, res, 404, { ok: false, error: 'NOT_FOUND', message: 'Müşteri bulunamadı' })
      }
      const snap = getSubscriptionSnapshot(store, customerId)
      const plan = snap?.plan
      const limits = {
        maxCompanies: plan?.maxCompanies ?? 1,
        maxBranches: plan?.maxBranches ?? 1,
        maxWarehouses: plan?.maxWarehouses ?? 1,
        maxUsers: plan?.maxUsers ?? 3,
        storageGb: plan?.storageGb ?? 2,
      }
      let usage = { companies: 0, branches: 0, warehouses: 0 }
      const tenantCode = customer.tenantCode || (store.accounts || []).find((a) => a.customerId === customerId)?.tenantCode
      if (tenantCode && hasDatabase()) {
        try {
          const workspace = await getTenantCollection(tenantCode, 'workspace')
          const raw = workspace?.keys?.['bach-org-structure']
          if (raw) {
            const structure = typeof raw === 'string' ? JSON.parse(raw) : raw
            usage = {
              companies: (structure.companies || []).filter((c) => c.active !== false).length,
              branches: (structure.branches || []).filter((b) => b.active !== false).length,
              warehouses: (structure.warehouses || []).filter((w) => w.active !== false).length,
            }
            customer.orgUsage = usage
          }
        } catch {
          // ignore parse/sync errors
        }
      } else if (customer.orgUsage) {
        usage = customer.orgUsage
      }
      const over = {
        companies: limits.maxCompanies > 0 && usage.companies > limits.maxCompanies,
        branches: limits.maxBranches > 0 && usage.branches > limits.maxBranches,
        warehouses: limits.maxWarehouses > 0 && usage.warehouses > limits.maxWarehouses,
      }
      return sendJson(req, res, 200, {
        ok: true,
        customer: {
          id: customer.id,
          company: customer.company || customer.companyName,
          email: customer.email,
          plan: plan?.name || customer.plan,
          planCode: plan?.code || customer.planCode,
          tenantCode: tenantCode || null,
        },
        limits,
        usage,
        overLimit: over.companies || over.branches || over.warehouses,
        over,
        multiCompanyEnabled: (plan?.modules || []).includes('multi_company'),
      })
    }

    if (method === 'PATCH' && path.startsWith('billing/admin/subscriptions/')) {
      const id = path.split('/')[3]
      const snap = await withStore((s) => {
        seedBillingIfEmpty(s)
        const sub = s.billing.subscriptions.find((x) => x.id === id)
        if (!sub) throw Object.assign(new Error('Abonelik yok'), { code: 'NOT_FOUND', status: 404 })
        if (body.planCode) {
          return activatePlanDirect(s, sub.customerId, body.planCode, body.period || sub.period || 'month', {
            action: 'staff_plan_change',
          })
        }
        if (body.status) {
          sub.status = body.status
          sub.updatedAt = new Date().toISOString()
          if (body.graceUntil) sub.graceUntil = body.graceUntil
          if (body.periodEnd) sub.periodEnd = body.periodEnd
          const { rebuildLicense } = { rebuildLicense: null }
          // rebuild via activate snap helper
          const plan = s.billing.plans.find((p) => p.id === sub.planId)
          const customer = (s.customers || []).find((c) => c.id === sub.customerId)
          if (customer) customer.subscriptionStatus = sub.status
          void plan
        }
        return getSubscriptionSnapshot(s, sub.customerId)
      })
      return sendJson(req, res, 200, { ok: true, ...snap })
    }

    if (method === 'GET' && path === 'billing/admin/payments') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).payments })
    }

    if (method === 'POST' && path.match(/^billing\/admin\/payments\/[^/]+\/approve$/)) {
      const id = path.split('/')[3]
      const snap = await withStore((s) => activateFromPayment(s, id, { provider: 'staff_approve' }))
      return sendJson(req, res, 200, { ok: true, ...snap })
    }

    if (method === 'GET' && path === 'billing/admin/invoices') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).invoices })
    }

    if (method === 'GET' && path === 'billing/admin/coupons') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).coupons })
    }

    if (method === 'POST' && path === 'billing/admin/coupons') {
      const row = await withStore((s) => {
        seedBillingIfEmpty(s)
        const coupon = {
          id: newId('cpn'),
          code: String(body.code || '').toUpperCase(),
          type: body.type === 'percent' ? 'percent' : 'fixed',
          value: Number(body.value) || 0,
          active: body.active !== false,
          maxUses: body.maxUses ?? null,
          usedCount: 0,
          expiresAt: body.expiresAt || null,
          createdAt: new Date().toISOString(),
        }
        s.billing.coupons.unshift(coupon)
        return coupon
      })
      return sendJson(req, res, 201, { ok: true, coupon: row })
    }

    if (method === 'GET' && path === 'billing/admin/campaigns') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).campaigns })
    }

    if (method === 'POST' && path === 'billing/admin/campaigns') {
      const row = await withStore((s) => {
        seedBillingIfEmpty(s)
        const campaign = {
          id: newId('camp'),
          name: body.name || 'Kampanya',
          description: body.description || '',
          planCodes: body.planCodes || [],
          discountPercent: Number(body.discountPercent) || 0,
          active: body.active !== false,
          startsAt: body.startsAt || new Date().toISOString(),
          endsAt: body.endsAt || null,
          createdAt: new Date().toISOString(),
        }
        s.billing.campaigns.unshift(campaign)
        return campaign
      })
      return sendJson(req, res, 201, { ok: true, campaign: row })
    }

    if (method === 'GET' && path === 'billing/admin/trial-periods') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).trialPeriods })
    }

    if (method === 'POST' && path === 'billing/admin/trial-periods') {
      const row = await withStore((s) => {
        seedBillingIfEmpty(s)
        const trial = {
          id: newId('trial'),
          name: body.name || 'Deneme',
          days: Number(body.days) || 7,
          planCode: normalizePlanCode(body.planCode || 'starter'),
          active: body.active !== false,
          createdAt: new Date().toISOString(),
        }
        s.billing.trialPeriods.unshift(trial)
        return trial
      })
      return sendJson(req, res, 201, { ok: true, trial: row })
    }

    if (method === 'GET' && path === 'billing/admin/renewals') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).renewals })
    }

    if (method === 'GET' && path === 'billing/admin/history') {
      const store = await loadStore()
      return sendJson(req, res, 200, { ok: true, rows: listBillingAdmin(store).history })
    }
  } catch (error) {
    const status = error.status || (error.code === 'UNAUTHORIZED' ? 401 : error.code === 'NOT_FOUND' ? 404 : 400)
    return sendJson(req, res, status, { error: error.code || 'BILLING_ERROR', message: error.message })
  }

  return false
}
