import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  commerceChannels,
  commerceListings,
  commerceOrdersInbox,
  commercePriceRules,
  commerceStockSyncJobs,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { ingestEvent } from '../workflow/workflowService.js'
import {
  COMMERCE_CURRENCIES,
  COMMERCE_LOCALES,
  MARKETPLACES,
  PAYMENT_PROVIDERS,
  SHIPPING_CARRIERS,
} from './catalog.js'

export function marketplaceCatalog() {
  return {
    marketplaces: MARKETPLACES,
    locales: COMMERCE_LOCALES,
    currencies: COMMERCE_CURRENCIES,
    shipping: SHIPPING_CARRIERS,
    payments: PAYMENT_PROVIDERS,
  }
}

async function ensureSeedChannels(companyId: string) {
  const existing = await db
    .select()
    .from(commerceChannels)
    .where(and(eq(commerceChannels.companyId, companyId), isNull(commerceChannels.deletedAt)))
  if (existing.length) return existing

  const seedKeys = ['trendyol', 'amazon', 'shopify', 'b2b', 'b2c', 'dealer']
  const rows = []
  for (const key of seedKeys) {
    const def = MARKETPLACES.find((m) => m.key === key)
    if (!def) continue
    const [row] = await db
      .insert(commerceChannels)
      .values({
        companyId,
        channelKey: def.key,
        name: def.name,
        status: key === 'b2b' || key === 'dealer' || key === 'b2c' ? 'connected' : 'disconnected',
        config: { kind: def.kind, region: def.region || null },
      })
      .returning()
    rows.push(row)
  }
  return rows
}

export async function overview(companyId: string) {
  const channels = await ensureSeedChannels(companyId)
  const [inboxCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commerceOrdersInbox)
    .where(and(eq(commerceOrdersInbox.companyId, companyId), isNull(commerceOrdersInbox.deletedAt)))
  const [received] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commerceOrdersInbox)
    .where(
      and(
        eq(commerceOrdersInbox.companyId, companyId),
        eq(commerceOrdersInbox.status, 'received'),
        isNull(commerceOrdersInbox.deletedAt),
      ),
    )
  const [listingsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commerceListings)
    .where(and(eq(commerceListings.companyId, companyId), isNull(commerceListings.deletedAt)))
  const [rulesCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commercePriceRules)
    .where(
      and(
        eq(commercePriceRules.companyId, companyId),
        eq(commercePriceRules.active, true),
        isNull(commercePriceRules.deletedAt),
      ),
    )
  const connected = channels.filter((c) => c.status === 'connected').length
  return {
    channelsTotal: channels.length,
    channelsConnected: connected,
    inboxTotal: inboxCount?.count ?? 0,
    inboxPending: received?.count ?? 0,
    listingsTotal: listingsCount?.count ?? 0,
    activePriceRules: rulesCount?.count ?? 0,
    productMaster: 'erp_mdm',
    eventDriven: true,
    phase: 'GC-0',
  }
}

export async function listChannels(companyId: string) {
  const rows = await ensureSeedChannels(companyId)
  return { channels: rows, catalog: MARKETPLACES }
}

export async function connectChannel(companyId: string, channelKey: string) {
  const def = MARKETPLACES.find((m) => m.key === channelKey)
  if (!def) throw new AppError('NOT_FOUND', 'Kanal bulunamadı', 404)

  await ensureSeedChannels(companyId)
  const [existing] = await db
    .select()
    .from(commerceChannels)
    .where(
      and(
        eq(commerceChannels.companyId, companyId),
        eq(commerceChannels.channelKey, channelKey),
        isNull(commerceChannels.deletedAt),
      ),
    )
    .limit(1)

  if (existing) {
    const [row] = await db
      .update(commerceChannels)
      .set({
        status: 'connected',
        lastSyncAt: new Date(),
        updatedAt: new Date(),
        config: { ...(existing.config || {}), stubConnected: true },
      })
      .where(eq(commerceChannels.id, existing.id))
      .returning()
    return row
  }

  const [row] = await db
    .insert(commerceChannels)
    .values({
      companyId,
      channelKey: def.key,
      name: def.name,
      status: 'connected',
      lastSyncAt: new Date(),
      config: { kind: def.kind, stubConnected: true },
    })
    .returning()
  return row
}

export async function listListings(companyId: string) {
  const rows = await db
    .select()
    .from(commerceListings)
    .where(and(eq(commerceListings.companyId, companyId), isNull(commerceListings.deletedAt)))
    .orderBy(desc(commerceListings.createdAt))
    .limit(200)
  return rows
}

export async function publishListing(
  companyId: string,
  input: {
    channelKey: string
    productId: string
    sku?: string
    title?: string
    price?: string
    currency?: string
  },
) {
  const channels = await ensureSeedChannels(companyId)
  let channel = channels.find((c) => c.channelKey === input.channelKey)
  if (!channel) {
    channel = await connectChannel(companyId, input.channelKey)
  }
  const [existing] = await db
    .select()
    .from(commerceListings)
    .where(
      and(
        eq(commerceListings.channelId, channel.id),
        eq(commerceListings.productId, input.productId),
        isNull(commerceListings.deletedAt),
      ),
    )
    .limit(1)
  if (existing) {
    const [row] = await db
      .update(commerceListings)
      .set({
        status: 'published',
        title: input.title || existing.title,
        price: input.price || existing.price,
        currency: input.currency || existing.currency,
        sku: input.sku || existing.sku,
        updatedAt: new Date(),
      })
      .where(eq(commerceListings.id, existing.id))
      .returning()
    return row
  }
  const [row] = await db
    .insert(commerceListings)
    .values({
      companyId,
      channelId: channel.id,
      productId: input.productId,
      sku: input.sku,
      title: input.title || `Product ${input.productId}`,
      price: input.price || '0',
      currency: input.currency || 'TRY',
      status: 'published',
      externalId: `stub_${input.channelKey}_${input.productId}`,
      meta: { source: 'gc-0-stub' },
    })
    .returning()
  return row
}

export async function listPriceRules(companyId: string) {
  return db
    .select()
    .from(commercePriceRules)
    .where(and(eq(commercePriceRules.companyId, companyId), isNull(commercePriceRules.deletedAt)))
    .orderBy(asc(commercePriceRules.priority))
}

export async function createPriceRule(
  companyId: string,
  input: {
    name: string
    priority?: number
    scope?: string
    customerId?: string
    dealerId?: string
    countryCode?: string
    currency?: string
    productId?: string
    minQty?: number
    adjustmentType?: string
    adjustmentValue: string
  },
) {
  const [row] = await db
    .insert(commercePriceRules)
    .values({
      companyId,
      name: input.name,
      priority: input.priority ?? 100,
      scope: input.scope || 'global',
      customerId: input.customerId,
      dealerId: input.dealerId,
      countryCode: input.countryCode,
      currency: input.currency,
      productId: input.productId,
      minQty: input.minQty,
      adjustmentType: input.adjustmentType || 'percent',
      adjustmentValue: input.adjustmentValue,
    })
    .returning()
  return row
}

export async function resolvePrice(
  companyId: string,
  input: {
    productId: string
    basePrice: number
    customerId?: string
    dealerId?: string
    countryCode?: string
    currency?: string
    qty?: number
  },
) {
  const rules = await listPriceRules(companyId)
  const active = rules.filter((r) => r.active)
  let price = input.basePrice
  const applied: string[] = []

  for (const rule of active) {
    if (rule.productId && rule.productId !== input.productId) continue
    if (rule.customerId && rule.customerId !== input.customerId) continue
    if (rule.dealerId && rule.dealerId !== input.dealerId) continue
    if (rule.countryCode && rule.countryCode !== input.countryCode) continue
    if (rule.currency && rule.currency !== input.currency) continue
    if (rule.minQty != null && (input.qty ?? 1) < rule.minQty) continue

    const value = Number(rule.adjustmentValue)
    if (rule.adjustmentType === 'override') price = value
    else if (rule.adjustmentType === 'fixed') price = price + value
    else price = price * (1 + value / 100)
    applied.push(rule.name)
  }

  return {
    productId: input.productId,
    basePrice: input.basePrice,
    resolvedPrice: Math.round(price * 10000) / 10000,
    currency: input.currency || 'TRY',
    appliedRules: applied,
  }
}

export async function listInbox(companyId: string) {
  return db
    .select()
    .from(commerceOrdersInbox)
    .where(and(eq(commerceOrdersInbox.companyId, companyId), isNull(commerceOrdersInbox.deletedAt)))
    .orderBy(desc(commerceOrdersInbox.createdAt))
    .limit(200)
}

export async function ingestChannelOrder(
  companyId: string,
  input: {
    channelKey: string
    externalOrderId: string
    currency?: string
    totalAmount?: string
    customerName?: string
    customerEmail?: string
    lines?: Record<string, unknown>[]
    rawPayload?: Record<string, unknown>
  },
) {
  const channels = await ensureSeedChannels(companyId)
  const channel = channels.find((c) => c.channelKey === input.channelKey)
  const riskScore = Math.min(
    100,
    (input.customerEmail?.includes('temp') ? 40 : 5) +
      (Number(input.totalAmount || 0) > 50000 ? 25 : 0),
  )

  const [existing] = await db
    .select()
    .from(commerceOrdersInbox)
    .where(
      and(
        eq(commerceOrdersInbox.companyId, companyId),
        eq(commerceOrdersInbox.channelKey, input.channelKey),
        eq(commerceOrdersInbox.externalOrderId, input.externalOrderId),
      ),
    )
    .limit(1)
  if (existing) return existing

  const [row] = await db
    .insert(commerceOrdersInbox)
    .values({
      companyId,
      channelId: channel?.id,
      channelKey: input.channelKey,
      externalOrderId: input.externalOrderId,
      status: riskScore >= 50 ? 'risk_review' : 'received',
      currency: input.currency || 'TRY',
      totalAmount: input.totalAmount || '0',
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      lines: input.lines || [],
      rawPayload: input.rawPayload || {},
      riskScore,
    })
    .returning()

  await ingestEvent(companyId, 'trigger.commerce.order.received', {
    inboxId: row.id,
    channelKey: row.channelKey,
    externalOrderId: row.externalOrderId,
    riskScore: row.riskScore,
  })
  return row
}

export async function promoteInboxOrder(companyId: string, inboxId: string) {
  const [row] = await db
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
  if (!row) throw new AppError('NOT_FOUND', 'Inbox siparişi bulunamadı', 404)
  if (row.status === 'promoted') return row

  const erpOrderId = `erp_stub_${row.externalOrderId}`
  const [updated] = await db
    .update(commerceOrdersInbox)
    .set({
      status: 'promoted',
      erpOrderId,
      promotedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(commerceOrdersInbox.id, row.id))
    .returning()

  await ingestEvent(companyId, 'trigger.order.created', {
    source: 'commerce',
    inboxId: row.id,
    channelKey: row.channelKey,
    externalOrderId: row.externalOrderId,
    erpOrderId,
  })
  await ingestEvent(companyId, 'trigger.commerce.order.promoted', {
    inboxId: row.id,
    erpOrderId,
  })

  return updated
}

export async function enqueueStockSync(companyId: string, channelKey?: string) {
  const [job] = await db
    .insert(commerceStockSyncJobs)
    .values({
      companyId,
      channelKey: channelKey || null,
      status: 'queued',
      meta: { source: 'gc-0' },
    })
    .returning()

  // GC-0 stub: immediately mark done
  const [done] = await db
    .update(commerceStockSyncJobs)
    .set({
      status: 'done',
      productsTouched: 12,
      startedAt: new Date(),
      finishedAt: new Date(),
      updatedAt: new Date(),
      meta: { source: 'gc-0', note: 'stub sync ERP → channels' },
    })
    .where(eq(commerceStockSyncJobs.id, job.id))
    .returning()

  await ingestEvent(companyId, 'trigger.commerce.stock.synced', {
    jobId: done.id,
    channelKey: channelKey || 'all',
    productsTouched: done.productsTouched,
  })

  return done
}

export async function listStockJobs(companyId: string) {
  return db
    .select()
    .from(commerceStockSyncJobs)
    .where(
      and(eq(commerceStockSyncJobs.companyId, companyId), isNull(commerceStockSyncJobs.deletedAt)),
    )
    .orderBy(desc(commerceStockSyncJobs.createdAt))
    .limit(50)
}
