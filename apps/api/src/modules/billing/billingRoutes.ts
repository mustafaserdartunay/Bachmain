import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  companies,
  companyMemberships,
  invoices,
  payments,
  plans,
  subscriptions,
  webhookEvents,
} from '../../db/schema/index.js'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import { authenticate, requireTenant } from '../../shared/authGuard.js'
import { notifyUser } from '../notifications/notificationService.js'
import { logActivity } from '../audit/activityService.js'

export async function billingRoutes(app: FastifyInstance) {
  app.get('/v1/billing/plans', async () => {
    const rows = await db.select().from(plans).where(eq(plans.active, true))
    return { ok: true, plans: rows }
  })

  app.post('/v1/billing/checkout', { preHandler: authenticate }, async (req) => {
    const companyId = requireTenant(req)
    const body = z
      .object({
        plan: z.enum(['basic', 'pro', 'enterprise']),
        provider: z.enum(['stripe', 'iyzico']).default('stripe'),
      })
      .parse(req.body)

    const [plan] = await db.select().from(plans).where(eq(plans.code, body.plan)).limit(1)
    if (!plan) throw new AppError('PLAN_NOT_FOUND', 'Plan bulunamadı', 404)

    if (body.provider === 'stripe') {
      if (!env.STRIPE_SECRET_KEY) {
        // Manual fallback payment request
        const [payment] = await db
          .insert(payments)
          .values({
            companyId,
            amountCents: plan.monthlyPriceTry * 100,
            currency: 'TRY',
            provider: 'manual',
            status: 'pending',
            raw: { plan: body.plan, source: 'checkout' },
          })
          .returning()
        return {
          ok: true,
          provider: 'manual',
          paymentId: payment.id,
          message: 'Ödeme talebi oluşturuldu. Stripe anahtarı tanımlanınca Checkout aktif olur.',
        }
      }

      const params = new URLSearchParams()
      params.set('mode', 'subscription')
      params.set('success_url', `${env.APP_URL}/hesap/lisans?paid=1`)
      params.set('cancel_url', `${env.APP_URL}/hesap/lisans?canceled=1`)
      params.set('client_reference_id', companyId)
      params.set('metadata[companyId]', companyId)
      params.set('metadata[plan]', body.plan)
      if (plan.stripePriceId) {
        params.set('line_items[0][price]', plan.stripePriceId)
        params.set('line_items[0][quantity]', '1')
      } else {
        params.set('line_items[0][price_data][currency]', 'try')
        params.set(
          'line_items[0][price_data][unit_amount]',
          String(Math.max(plan.monthlyPriceTry, 1) * 100),
        )
        params.set('line_items[0][price_data][recurring][interval]', 'month')
        params.set('line_items[0][price_data][product_data][name]', `BACHMAIN ${plan.name}`)
        params.set('line_items[0][quantity]', '1')
      }

      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } }
      if (!res.ok) throw new AppError('STRIPE_ERROR', data.error?.message || 'Stripe hatası', 502)
      return { ok: true, provider: 'stripe', url: data.url, sessionId: data.id }
    }

    // iyzico placeholder checkout intent
    if (!env.IYZICO_API_KEY || !env.IYZICO_SECRET_KEY) {
      throw new AppError('IYZICO_NOT_CONFIGURED', 'iyzico anahtarları tanımlı değil', 503)
    }
    const [payment] = await db
      .insert(payments)
      .values({
        companyId,
        amountCents: plan.monthlyPriceTry * 100,
        currency: 'TRY',
        provider: 'iyzico',
        status: 'pending',
        raw: { plan: body.plan },
      })
      .returning()
    return {
      ok: true,
      provider: 'iyzico',
      paymentId: payment.id,
      message: 'iyzico ödeme formu bir sonraki adımda başlatılacak.',
      checkoutUrl: `${env.API_PUBLIC_URL}/v1/billing/iyzico/start?paymentId=${payment.id}`,
    }
  })

  app.post(
    '/v1/billing/webhooks/stripe',
    {
      config: { rawBody: true },
    },
    async (req, reply) => {
      const rawBody =
        (req as { rawBody?: string }).rawBody ||
        (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}))
      let event = req.body as {
        id?: string
        type?: string
        data?: { object?: Record<string, unknown> }
      }

      if (env.STRIPE_WEBHOOK_SECRET) {
        try {
          const { verifyStripeWebhookSignature } = await import('../../shared/stripeWebhook.js')
          event = verifyStripeWebhookSignature(
            rawBody,
            req.headers['stripe-signature'],
            env.STRIPE_WEBHOOK_SECRET,
          )
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode || 400
          throw new AppError('STRIPE_SIGNATURE', (error as Error).message, status)
        }
      } else if (env.NODE_ENV === 'production') {
        throw new AppError(
          'STRIPE_WEBHOOK_SECRET',
          'STRIPE_WEBHOOK_SECRET is required in production',
          500,
        )
      }

      if (!event?.id || !event.type) throw new AppError('INVALID_EVENT', 'Geçersiz Stripe event')

      const [dup] = await db
        .select()
        .from(webhookEvents)
        .where(and(eq(webhookEvents.provider, 'stripe'), eq(webhookEvents.eventId, event.id)))
        .limit(1)
      if (dup) return reply.send({ ok: true, duplicate: true })

      await db.insert(webhookEvents).values({
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        payload: event as Record<string, unknown>,
      })

      if (event.type === 'checkout.session.completed') {
        const obj = event.data?.object || {}
        const companyId = String(
          obj.client_reference_id || (obj.metadata as { companyId?: string })?.companyId || '',
        )
        const planCode = String((obj.metadata as { plan?: string })?.plan || 'pro') as
          'basic' | 'pro' | 'enterprise'
        if (companyId) await activatePlan(companyId, planCode, 'stripe', obj)
      }

      await db
        .update(webhookEvents)
        .set({ processedAt: new Date() })
        .where(and(eq(webhookEvents.provider, 'stripe'), eq(webhookEvents.eventId, event.id)))

      return { ok: true }
    },
  )

  app.post('/v1/billing/webhooks/iyzico', async (req, reply) => {
    const provided = String(
      req.headers['x-iyzico-signature'] ||
        req.headers['x-callback-secret'] ||
        req.headers['x-bach-iyzico-secret'] ||
        '',
    )
    if (env.NODE_ENV === 'production') {
      if (!env.IYZICO_WEBHOOK_SECRET) {
        return reply.code(503).send({ ok: false, error: 'IYZICO_WEBHOOK_SECRET_REQUIRED' })
      }
      if (!provided || provided !== env.IYZICO_WEBHOOK_SECRET) {
        return reply.code(401).send({ ok: false, error: 'INVALID_WEBHOOK_SIGNATURE' })
      }
    } else if (env.IYZICO_WEBHOOK_SECRET && provided !== env.IYZICO_WEBHOOK_SECRET) {
      return reply.code(401).send({ ok: false, error: 'INVALID_WEBHOOK_SIGNATURE' })
    }

    const event = req.body as Record<string, unknown>
    const eventId = String(event.paymentId || event.token || event.iyziEventId || Date.now())
    const [dup] = await db
      .select()
      .from(webhookEvents)
      .where(and(eq(webhookEvents.provider, 'iyzico'), eq(webhookEvents.eventId, eventId)))
      .limit(1)
    if (dup) return reply.send({ ok: true, duplicate: true })

    await db.insert(webhookEvents).values({
      provider: 'iyzico',
      eventId,
      eventType: String(event.status || 'payment'),
      payload: event,
    })

    const companyId = String(event.companyId || '')
    const planCode = String(event.plan || 'basic') as 'basic' | 'pro' | 'enterprise'
    if (companyId && String(event.status).toLowerCase() === 'success') {
      await activatePlan(companyId, planCode, 'iyzico', event)
    }

    await db
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(and(eq(webhookEvents.provider, 'iyzico'), eq(webhookEvents.eventId, eventId)))

    return { ok: true }
  })

  app.get('/v1/billing/payments', { preHandler: authenticate }, async (req) => {
    const companyId = requireTenant(req)
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.companyId, companyId))
      .limit(100)
    return { ok: true, rows }
  })

  app.get('/v1/billing/invoices', { preHandler: authenticate }, async (req) => {
    const companyId = requireTenant(req)
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.companyId, companyId))
      .limit(100)
    return { ok: true, rows }
  })
}

async function activatePlan(
  companyId: string,
  planCode: 'basic' | 'pro' | 'enterprise',
  provider: string,
  raw: Record<string, unknown>,
) {
  const [plan] = await db.select().from(plans).where(eq(plans.code, planCode)).limit(1)
  if (!plan) return

  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 86400000)

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.companyId, companyId))
    .limit(1)
  if (sub) {
    await db
      .update(subscriptions)
      .set({
        planId: plan.id,
        status: 'active',
        provider,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, sub.id))
  } else {
    await db.insert(subscriptions).values({
      companyId,
      planId: plan.id,
      status: 'active',
      provider,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    })
  }

  await db
    .update(companies)
    .set({ planCode, status: 'active', updatedAt: now })
    .where(eq(companies.id, companyId))

  const [payment] = await db
    .insert(payments)
    .values({
      companyId,
      amountCents: plan.monthlyPriceTry * 100,
      currency: 'TRY',
      provider,
      status: 'succeeded',
      providerPaymentId: String(raw.id || raw.paymentId || ''),
      raw,
    })
    .returning()

  const number = `INV-${now.getFullYear()}-${String(Date.now()).slice(-6)}`
  await db.insert(invoices).values({
    companyId,
    paymentId: payment.id,
    number,
    amountCents: payment.amountCents,
    currency: 'TRY',
  })

  const members = await db
    .select()
    .from(companyMemberships)
    .where(eq(companyMemberships.companyId, companyId))
  for (const m of members) {
    await notifyUser({
      userId: m.userId,
      companyId,
      type: 'plan',
      title: 'Plan yükseltildi',
      body: `${plan.name} planınız aktif.`,
      link: '/hesap/lisans',
    })
  }

  await logActivity({
    companyId,
    action: 'billing.plan_activated',
    resource: 'subscription',
    meta: { plan: planCode, provider },
  })
}
