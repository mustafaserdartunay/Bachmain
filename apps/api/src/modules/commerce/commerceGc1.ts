import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  commerceCoupons,
  commerceOrderAnalyses,
  commerceOrdersInbox,
  commercePaymentIntents,
  commerceProductI18n,
  commerceReturns,
  commerceShipments,
  commerceSubscriptions,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { ingestEvent } from '../workflow/workflowService.js'
import { COMMERCE_LOCALES } from './catalog.js'

/** GC-1 Product AI — stub content pack (AG/AIOS live later) */
export async function generateProductAi(
  companyId: string,
  input: { productId: string; productName?: string; locale?: string },
) {
  const locale = input.locale || 'tr'
  const name = input.productName || `Ürün ${input.productId}`
  const pack = {
    title: name,
    description: `${name} — ERP Product Master’dan üretilmiş açıklama (GC-1 AI stub).`,
    seoTitle: `${name} | BachMain`,
    seoDescription: `${name} için SEO meta. Anahtar kelime ve dönüşüm odaklı.`,
    keywords: [name.toLowerCase(), 'bachmain', locale, 'satın al'],
    altText: `${name} ürün görseli`,
    techSpecs: 'Boyut / ağırlık / malzeme — Product Master’dan doldurulacak.',
    marketingCopy: `${name} ile operasyonunuzu hızlandırın. Kurumsal ve bayi kanallarına hazır.`,
    socialCopy: `Yeni: ${name} 🚀 #BachMain #Commerce`,
    merchantFeed: `${name} | Uygun fiyat | Hızlı kargo`,
  }

  const existing = await db
    .select()
    .from(commerceProductI18n)
    .where(
      and(
        eq(commerceProductI18n.companyId, companyId),
        eq(commerceProductI18n.productId, input.productId),
        eq(commerceProductI18n.locale, locale),
        isNull(commerceProductI18n.deletedAt),
      ),
    )
    .limit(1)

  let row
  if (existing[0]) {
    ;[row] = await db
      .update(commerceProductI18n)
      .set({ ...pack, updatedAt: new Date() })
      .where(eq(commerceProductI18n.id, existing[0].id))
      .returning()
  } else {
    ;[row] = await db
      .insert(commerceProductI18n)
      .values({
        companyId,
        productId: input.productId,
        locale,
        ...pack,
      })
      .returning()
  }

  await ingestEvent(companyId, 'trigger.commerce.product.ai', {
    productId: input.productId,
    locale,
    i18nId: row.id,
  })
  return row
}

export async function expandProductI18n(companyId: string, productId: string) {
  const [base] = await db
    .select()
    .from(commerceProductI18n)
    .where(
      and(
        eq(commerceProductI18n.companyId, companyId),
        eq(commerceProductI18n.productId, productId),
        eq(commerceProductI18n.locale, 'tr'),
        isNull(commerceProductI18n.deletedAt),
      ),
    )
    .limit(1)

  const seed =
    base ||
    (await generateProductAi(companyId, {
      productId,
      productName: `Product ${productId}`,
      locale: 'tr',
    }))

  const created = []
  for (const locale of COMMERCE_LOCALES) {
    if (locale === 'tr') continue
    const [exist] = await db
      .select()
      .from(commerceProductI18n)
      .where(
        and(
          eq(commerceProductI18n.companyId, companyId),
          eq(commerceProductI18n.productId, productId),
          eq(commerceProductI18n.locale, locale),
          isNull(commerceProductI18n.deletedAt),
        ),
      )
      .limit(1)
    if (exist) {
      created.push(exist)
      continue
    }
    const [row] = await db
      .insert(commerceProductI18n)
      .values({
        companyId,
        productId,
        locale,
        title: `[${locale.toUpperCase()}] ${seed.title || productId}`,
        description: `(${locale}) ${seed.description || ''}`,
        seoTitle: seed.seoTitle,
        seoDescription: seed.seoDescription,
        keywords: seed.keywords || [],
        altText: seed.altText,
        techSpecs: seed.techSpecs,
        marketingCopy: seed.marketingCopy,
        socialCopy: seed.socialCopy,
        merchantFeed: seed.merchantFeed,
      })
      .returning()
    created.push(row)
  }

  await ingestEvent(companyId, 'trigger.commerce.product.i18n', {
    productId,
    locales: COMMERCE_LOCALES.length,
  })
  return { base: seed, translations: created }
}

export async function listProductI18n(companyId: string, productId?: string) {
  if (productId) {
    return db
      .select()
      .from(commerceProductI18n)
      .where(
        and(
          eq(commerceProductI18n.companyId, companyId),
          eq(commerceProductI18n.productId, productId),
          isNull(commerceProductI18n.deletedAt),
        ),
      )
      .orderBy(desc(commerceProductI18n.updatedAt))
      .limit(200)
  }
  return db
    .select()
    .from(commerceProductI18n)
    .where(and(eq(commerceProductI18n.companyId, companyId), isNull(commerceProductI18n.deletedAt)))
    .orderBy(desc(commerceProductI18n.updatedAt))
    .limit(200)
}

export async function analyzeInboxOrder(companyId: string, inboxId: string) {
  const [order] = await db
    .select()
    .from(commerceOrdersInbox)
    .where(
      and(
        eq(commerceOrdersInbox.id, inboxId),
        eq(commerceOrdersInbox.companyId, companyId),
        isNull(commerceOrdersInbox.deletedAt),
      ),
    )
    .limit(1)
  if (!order) throw new AppError('NOT_FOUND', 'Inbox siparişi yok', 404)

  const amount = Number(order.totalAmount || 0)
  const flags: string[] = []
  let fraudScore = order.riskScore || 0
  let stockRisk = 10
  let deliveryRisk = 15
  const repeatOrder = String(order.customerEmail || '').includes('repeat')

  if (amount > 50000) {
    fraudScore += 20
    flags.push('high_value')
  }
  if (order.customerEmail?.includes('temp') || order.customerEmail?.includes('mailinator')) {
    fraudScore += 35
    flags.push('suspicious_email')
  }
  if ((order.lines || []).length === 0) {
    stockRisk += 40
    flags.push('empty_lines')
  }
  if (order.channelKey === 'amazon' || order.channelKey === 'trendyol') deliveryRisk += 5
  if (repeatOrder) flags.push('repeat_customer')

  const riskScore = Math.min(100, Math.round((fraudScore + stockRisk + deliveryRisk) / 3))
  const recommendation = riskScore >= 70 ? 'hold' : riskScore >= 45 ? 'review' : 'promote'

  const [row] = await db
    .insert(commerceOrderAnalyses)
    .values({
      companyId,
      inboxId: order.id,
      orderRef: order.externalOrderId,
      riskScore,
      fraudScore: Math.min(100, fraudScore),
      stockRisk: Math.min(100, stockRisk),
      deliveryRisk: Math.min(100, deliveryRisk),
      repeatOrder,
      flags,
      summary: `Kanal ${order.channelKey} · tutar ${order.totalAmount} ${order.currency}`,
      recommendation,
      meta: { phase: 'GC-1' },
    })
    .returning()

  await db
    .update(commerceOrdersInbox)
    .set({
      riskScore,
      status: recommendation === 'hold' ? 'risk_review' : order.status,
      updatedAt: new Date(),
    })
    .where(eq(commerceOrdersInbox.id, order.id))

  await ingestEvent(companyId, 'trigger.commerce.order.analyzed', {
    inboxId: order.id,
    riskScore,
    recommendation,
  })
  return row
}

export async function listOrderAnalyses(companyId: string) {
  return db
    .select()
    .from(commerceOrderAnalyses)
    .where(
      and(eq(commerceOrderAnalyses.companyId, companyId), isNull(commerceOrderAnalyses.deletedAt)),
    )
    .orderBy(desc(commerceOrderAnalyses.createdAt))
    .limit(100)
}

export async function createReturn(
  companyId: string,
  input: { orderRef: string; kind?: string; reason?: string; channelKey?: string },
) {
  const [row] = await db
    .insert(commerceReturns)
    .values({
      companyId,
      orderRef: input.orderRef,
      kind: input.kind || 'return',
      reason: input.reason,
      channelKey: input.channelKey,
      status: 'open',
    })
    .returning()
  await ingestEvent(companyId, 'trigger.commerce.return.opened', { returnId: row.id })
  return row
}

export async function listReturns(companyId: string) {
  return db
    .select()
    .from(commerceReturns)
    .where(and(eq(commerceReturns.companyId, companyId), isNull(commerceReturns.deletedAt)))
    .orderBy(desc(commerceReturns.createdAt))
}

export async function createSubscription(
  companyId: string,
  input: {
    customerRef: string
    productId: string
    interval?: string
    amount?: string
    currency?: string
  },
) {
  const next = new Date()
  next.setMonth(next.getMonth() + 1)
  const [row] = await db
    .insert(commerceSubscriptions)
    .values({
      companyId,
      customerRef: input.customerRef,
      productId: input.productId,
      interval: input.interval || 'month',
      amount: input.amount || '0',
      currency: input.currency || 'TRY',
      status: 'active',
      nextRenewalAt: next,
    })
    .returning()
  await ingestEvent(companyId, 'trigger.commerce.subscription.created', { subscriptionId: row.id })
  return row
}

export async function listSubscriptions(companyId: string) {
  return db
    .select()
    .from(commerceSubscriptions)
    .where(
      and(eq(commerceSubscriptions.companyId, companyId), isNull(commerceSubscriptions.deletedAt)),
    )
    .orderBy(desc(commerceSubscriptions.createdAt))
}

export async function createShipment(
  companyId: string,
  input: { orderRef: string; carrier: string },
) {
  const [row] = await db
    .insert(commerceShipments)
    .values({
      companyId,
      orderRef: input.orderRef,
      carrier: input.carrier,
      trackingNo: `TRK${Date.now().toString().slice(-8)}`,
      status: 'labeled',
      meta: { stub: true },
    })
    .returning()
  await ingestEvent(companyId, 'trigger.commerce.shipment.created', {
    shipmentId: row.id,
    carrier: row.carrier,
  })
  return row
}

export async function listShipments(companyId: string) {
  return db
    .select()
    .from(commerceShipments)
    .where(and(eq(commerceShipments.companyId, companyId), isNull(commerceShipments.deletedAt)))
    .orderBy(desc(commerceShipments.createdAt))
}

export async function createPaymentIntent(
  companyId: string,
  input: { provider: string; amount: string; currency?: string; orderRef?: string },
) {
  const [row] = await db
    .insert(commercePaymentIntents)
    .values({
      companyId,
      provider: input.provider,
      amount: input.amount,
      currency: input.currency || 'TRY',
      orderRef: input.orderRef,
      status: 'pending',
      externalId: `pay_stub_${Date.now()}`,
      meta: { stub: true },
    })
    .returning()
  await ingestEvent(companyId, 'trigger.commerce.payment.created', {
    paymentId: row.id,
    provider: row.provider,
  })
  return row
}

export async function listPayments(companyId: string) {
  return db
    .select()
    .from(commercePaymentIntents)
    .where(
      and(
        eq(commercePaymentIntents.companyId, companyId),
        isNull(commercePaymentIntents.deletedAt),
      ),
    )
    .orderBy(desc(commercePaymentIntents.createdAt))
}

export async function createCoupon(
  companyId: string,
  input: { code: string; discountType?: string; discountValue: string },
) {
  const [row] = await db
    .insert(commerceCoupons)
    .values({
      companyId,
      code: input.code.toUpperCase(),
      discountType: input.discountType || 'percent',
      discountValue: input.discountValue,
      active: true,
    })
    .returning()
  return row
}

export async function listCoupons(companyId: string) {
  return db
    .select()
    .from(commerceCoupons)
    .where(and(eq(commerceCoupons.companyId, companyId), isNull(commerceCoupons.deletedAt)))
}

/** AI Sales forecast stub */
export function aiSalesForecast(input?: { productId?: string; country?: string }) {
  return {
    productId: input?.productId || 'prd_demo',
    country: input?.country || 'DE',
    suggestedPrice: 129.9,
    currency: 'EUR',
    suggestedChannel: 'amazon',
    suggestedAd: 'Google Shopping + Meta retarget',
    upliftPct: 18,
    confidence: 0.62,
    phase: 'GC-1-stub',
  }
}

export function analyticsOverview() {
  return {
    sales: 186400,
    byChannel: [
      { channel: 'trendyol', revenue: 62000 },
      { channel: 'b2b', revenue: 54000 },
      { channel: 'amazon', revenue: 38400 },
      { channel: 'b2c', revenue: 32000 },
    ],
    byCountry: [
      { country: 'TR', revenue: 98000 },
      { country: 'DE', revenue: 42000 },
      { country: 'AE', revenue: 26400 },
    ],
    roi: 1.8,
    roas: 2.4,
    profit: 41200,
    phase: 'GC-1-demo',
  }
}
