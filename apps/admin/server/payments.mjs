/**
 * Payment webhook + checkout session stubs (iyzico / Stripe ready).
 * Wire PROVIDER keys via env; until then returns setup instructions.
 */
import { withStore, newId } from './store.mjs'
import { insertPaymentEvent, hasDatabase } from './db.mjs'
import { sendJson } from './authRoutes.mjs'

function providerConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY ||
      process.env.IYZICO_API_KEY ||
      process.env.PAYTR_MERCHANT_ID,
  )
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
      database: hasDatabase(),
    })
    return true
  }

  if (method === 'POST' && path === 'payments/checkout') {
    if (!providerConfigured()) {
      sendJson(req, res, 503, {
        error: 'PAYMENT_NOT_CONFIGURED',
        message:
          'Ödeme sağlayıcı henüz bağlanmadı. Vercel env: STRIPE_SECRET_KEY veya IYZICO_API_KEY / PAYTR_MERCHANT_ID ekleyin.',
      })
      return true
    }
    // Placeholder — real provider session creation goes here
    sendJson(req, res, 501, {
      error: 'NOT_IMPLEMENTED',
      message: 'Checkout oturumu bir sonraki adımda provider SDK ile tamamlanacak',
      plan: body.plan || 'Pro',
    })
    return true
  }

  if (method === 'POST' && path === 'payments/webhook') {
    const eventId = newId('pay')
    const eventType = body.type || body.event || 'payment.received'
    const customerId = body.customerId || body.data?.object?.metadata?.customerId || null
    const plan = body.plan || body.data?.object?.metadata?.plan || 'Pro'
    const months = Number(body.months || 1)

    await insertPaymentEvent({
      id: eventId,
      provider: body.provider || 'manual',
      customerId,
      accountId: body.accountId || null,
      eventType,
      amountCents: body.amountCents ?? null,
      currency: body.currency || 'TRY',
      raw: body,
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
          customer.mrr = body.mrr ?? customer.mrr
        }
        return store
      })
    }

    sendJson(req, res, 200, { ok: true, eventId })
    return true
  }

  return false
}
