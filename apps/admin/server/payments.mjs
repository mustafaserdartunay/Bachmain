/**
 * Payment webhook + checkout (Stripe when configured; otherwise manual upgrade request).
 */
import { withStore, newId, loadStore } from './store.mjs'
import { insertPaymentEvent, hasDatabase } from './db.mjs'
import { sendJson } from './authRoutes.mjs'
import { getBearerOrCookieToken, getAccountFromToken } from './auth.mjs'
import { claimStripeEventId, verifyStripeWebhookSignature } from './stripeWebhook.mjs'

const PLANS = {
  Starter: { label: 'Başlangıç', mrr: 990, stripePriceEnv: 'STRIPE_PRICE_STARTER' },
  Pro: { label: 'Profesyonel', mrr: 2490, stripePriceEnv: 'STRIPE_PRICE_PRO' },
  Enterprise: { label: 'Kurumsal', mrr: 0, stripePriceEnv: 'STRIPE_PRICE_ENTERPRISE' },
}

function providerConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY ||
      process.env.IYZICO_API_KEY ||
      process.env.PAYTR_MERCHANT_ID,
  )
}

function normalizePlan(plan) {
  const raw = String(plan || 'Pro')
  if (/starter|başlangıç|baslangic/i.test(raw)) return 'Starter'
  if (/enter|kurum/i.test(raw)) return 'Enterprise'
  return 'Pro'
}

async function createStripeCheckout({ planKey, customerId, email, successUrl, cancelUrl }) {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  const plan = PLANS[planKey] || PLANS.Pro
  const priceId = process.env[plan.stripePriceEnv]
  const params = new URLSearchParams()
  params.set('mode', 'subscription')
  params.set('success_url', successUrl || 'https://uygulama.bachmain.com/?paid=1')
  params.set('cancel_url', cancelUrl || 'https://bachmain.com/fiyatlandirma.html')
  params.set('client_reference_id', customerId || '')
  params.set('customer_email', email || '')
  params.set('metadata[customerId]', customerId || '')
  params.set('metadata[plan]', planKey)
  if (priceId) {
    params.set('line_items[0][price]', priceId)
    params.set('line_items[0][quantity]', '1')
  } else {
    // Fallback: ad-hoc price in TRY (minor units = kuruş)
    const amount = Math.max(plan.mrr, 1) * 100
    params.set('line_items[0][price_data][currency]', 'try')
    params.set('line_items[0][price_data][unit_amount]', String(amount))
    params.set('line_items[0][price_data][recurring][interval]', 'month')
    params.set('line_items[0][price_data][product_data][name]', `BACHMAIN ${plan.label}`)
    params.set('line_items[0][quantity]', '1')
  }

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
    err.details = data
    throw err
  }
  return data
}

export async function handlePaymentsApi(req, res, path, body = {}) {
  const method = req.method

  if (method === 'GET' && path === 'payments/status') {
    sendJson(req, res, 200, {
      ok: true,
      configured: providerConfigured(),
      providers: {
        stripe: Boolean(process.env.STRIPE_SECRET_KEY),
        iyzico: Boolean(process.env.IYZICO_API_KEY),
        paytr: Boolean(process.env.PAYTR_MERCHANT_ID),
      },
      plans: Object.fromEntries(
        Object.entries(PLANS).map(([k, v]) => [k, { label: v.label, mrr: v.mrr }]),
      ),
      database: hasDatabase(),
    })
    return true
  }

  if (method === 'GET' && path === 'payments/plans') {
    sendJson(req, res, 200, {
      ok: true,
      plans: Object.entries(PLANS).map(([id, v]) => ({
        id,
        label: v.label,
        mrr: v.mrr,
        currency: 'TRY',
      })),
    })
    return true
  }

  if (method === 'POST' && path === 'payments/checkout') {
    const planKey = normalizePlan(body.plan)
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    const session = token ? getAccountFromToken(store, token) : null
    const customerId = body.customerId || session?.user?.customerId || null
    const email = body.email || session?.user?.email || ''

    // Stripe path
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const sessionCheckout = await createStripeCheckout({
          planKey,
          customerId,
          email,
          successUrl: body.successUrl,
          cancelUrl: body.cancelUrl,
        })
        sendJson(req, res, 200, {
          ok: true,
          provider: 'stripe',
          url: sessionCheckout.url,
          sessionId: sessionCheckout.id,
        })
        return true
      } catch (error) {
        sendJson(req, res, 502, {
          error: error.code || 'CHECKOUT_FAILED',
          message: error.message,
        })
        return true
      }
    }

    // Manual / sales-assisted checkout request (no provider keys yet)
    const requestId = newId('payreq')
    await withStore((s) => {
      if (!Array.isArray(s.paymentRequests)) s.paymentRequests = []
      s.paymentRequests.unshift({
        id: requestId,
        plan: planKey,
        customerId,
        email,
        companyName: body.companyName || session?.user?.companyName || '',
        phone: body.phone || session?.user?.phone || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: body.source || 'checkout',
      })
      s.paymentRequests = s.paymentRequests.slice(0, 500)
      if (!Array.isArray(s.notifications)) s.notifications = []
      s.notifications.unshift({
        id: newId('ntf'),
        title: `Yeni ödeme talebi: ${planKey}`,
        body: `${email || 'Anonim'} — ${planKey} planı`,
        type: 'payment_request',
        createdAt: new Date().toISOString(),
      })
      return s
    })

    sendJson(req, res, 200, {
      ok: true,
      provider: 'manual',
      requestId,
      message:
        'Ödeme talebiniz alındı. Sağlayıcı bağlanana kadar satış ekibi sizinle iletişime geçecek.',
      nextUrl:
        customerId
          ? 'https://uygulama.bachmain.com/hesap/lisans'
          : `https://uygulama.bachmain.com/kayit?plan=${encodeURIComponent(planKey)}`,
    })
    return true
  }

  if (method === 'POST' && path === 'payments/webhook') {
    let bodyEvent = body
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const signature = req.headers['stripe-signature']
    if (webhookSecret) {
      try {
        bodyEvent = verifyStripeWebhookSignature(
          req.rawBody || JSON.stringify(body),
          signature,
          webhookSecret,
        )
      } catch (error) {
        sendJson(req, res, error.statusCode || 400, { ok: false, error: error.message })
        return true
      }
    } else if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
      sendJson(req, res, 500, { ok: false, error: 'STRIPE_WEBHOOK_SECRET is required in production' })
      return true
    }

    if (bodyEvent?.id && !claimStripeEventId(bodyEvent.id)) {
      sendJson(req, res, 200, { ok: true, duplicate: true })
      return true
    }

    const eventId = newId('pay')
    const eventType = bodyEvent.type || bodyEvent.event || 'payment.received'
    const customerId =
      bodyEvent.customerId ||
      bodyEvent.data?.object?.metadata?.customerId ||
      bodyEvent.data?.object?.client_reference_id ||
      null
    const plan = normalizePlan(bodyEvent.plan || bodyEvent.data?.object?.metadata?.plan || 'Pro')
    const months = Number(bodyEvent.months || 1)

    // Stripe checkout.session.completed
    const stripeType = bodyEvent.type
    const stripeObj = bodyEvent.data?.object
    if (stripeType === 'checkout.session.completed' && stripeObj) {
      // fall through with extracted fields
    }

    await insertPaymentEvent({
      id: eventId,
      provider: bodyEvent.provider || (stripeType ? 'stripe' : 'manual'),
      customerId,
      accountId: bodyEvent.accountId || null,
      eventType: stripeType || eventType,
      amountCents: bodyEvent.amountCents ?? stripeObj?.amount_total ?? null,
      currency: bodyEvent.currency || stripeObj?.currency || 'TRY',
      raw: bodyEvent,
    })

    if (customerId) {
      await withStore((store) => {
        const customer = (store.customers || []).find((c) => c.id === customerId)
        if (customer) {
          const base = customer.licenseExpiry ? new Date(customer.licenseExpiry) : new Date()
          const start = base.getTime() > Date.now() ? base : new Date()
          start.setMonth(start.getMonth() + months)
          customer.licenseExpiry = start.toISOString().slice(0, 10)
          customer.status = 'active'
          customer.plan = plan
          const planMeta = PLANS[plan]
          if (planMeta?.mrr) customer.mrr = planMeta.mrr
          if (bodyEvent.mrr != null) customer.mrr = bodyEvent.mrr
        }
        return store
      })
    }

    sendJson(req, res, 200, { ok: true, eventId })
    return true
  }

  return false
}
