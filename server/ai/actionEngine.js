/**
 * Bach AI V2 — Intent parser (Luna) + Action Engine tools.
 * AI returns intent/slots only; tools run with auth/tenant checks.
 */

import { createOpenAiCompletion } from '../openaiModels.js'
import { requireOpenAiApiKey, resolveRequestApiKey } from '../env.js'
import { resolveTaskModel } from './config.js'

const INTENT_SYSTEM = `Sen Bach AI Intent Engine'sin. Kullanıcı Türkçe konuşur.
Yanıtını SADECE JSON ver:
{
  "intent": "create_offer|search_customer|get_account_balance|search_product|get_stock|create_order|create_task|unknown",
  "slots": { "customer": "", "product": "", "quantity": null, "unitPrice": null, "amount": null, "note": "" },
  "needsConfirmation": false,
  "message": "Kullanıcıya kısa Türkçe yanıt"
}
Kurallar:
- Database veya SQL önerme.
- Eksik kritik slot varsa needsConfirmation false, message ile sor.
- create_offer / create_order / finans yazımlarında needsConfirmation true olabilir.
- Sadece geçerli JSON döndür.`

const RISK_INTENTS = new Set(['create_offer', 'create_order', 'create_invoice', 'send_offer', 'confirm_order'])

/** @type {Map<string, object>} */
const idempotencyCache = new Map()

function authFromHeaders(reqHeaders = {}, reqBody = {}) {
  const auth = reqBody.auth || {}
  return {
    userId: String(auth.userId || reqHeaders['x-user-id'] || '').trim() || null,
    companyId: String(auth.companyId || reqHeaders['x-company-id'] || '').trim() || null,
    branchId: String(auth.branchId || reqHeaders['x-branch-id'] || '').trim() || null,
    permissions: Array.isArray(auth.permissions) ? auth.permissions : [],
    planCode: auth.planCode || null,
  }
}

function assertAuth(ctx) {
  // Soft gate for CRM proxy era: if company/user provided, require both.
  // Full JWT enforcement lands when CRM voice is fully on apps/api.
  if (ctx.companyId && !ctx.userId) {
    const err = new Error('Yetkisiz: kullanıcı gerekli.')
    err.statusCode = 401
    throw err
  }
}

function audit({ ctx, action, success, errorCode = null, durationMs = 0, source = 'ai_v2' }) {
  return {
    timestamp: new Date().toISOString(),
    userId: ctx.userId,
    companyId: ctx.companyId,
    source,
    module: 'bach_ai_v2',
    action,
    success: Boolean(success),
    durationMs,
    errorCode,
  }
}

export async function parseIntent({ text, apiKey, context = {} }) {
  const model = resolveTaskModel('intent')
  const result = await createOpenAiCompletion({
    apiKey,
    model,
    json: true,
    temperature: 0.1,
    reasoningEffort: 'medium',
    maxCompletionTokens: 1200,
    messages: [
      { role: 'system', content: INTENT_SYSTEM },
      {
        role: 'user',
        content: JSON.stringify({
          utterance: text,
          activeCustomer: context.activeCustomer || null,
          path: context.currentPath || null,
        }),
      },
    ],
  })

  try {
    return JSON.parse(result.content || '{}')
  } catch {
    return {
      intent: 'unknown',
      slots: {},
      needsConfirmation: false,
      message: result.content || 'Anlaşılamadı.',
    }
  }
}

/** Tool registry — minimum viable set (offer / customer / stock / balance). */
export const TOOLS = {
  search_customer: {
    risk: false,
    async run({ slots }, _ctx) {
      const q = String(slots.customer || '').trim()
      if (!q) return { ok: false, error: 'customer_required', message: 'Müşteri adı gerekli.' }
      return {
        ok: true,
        data: { query: q, hint: 'Client should resolve customer from local/CRM list.' },
        message: `"${q}" için müşteri aranıyor.`,
        clientAction: { type: 'search_customer', payload: { query: q } },
      }
    },
  },
  get_account_balance: {
    risk: false,
    async run({ slots }, _ctx) {
      const customer = String(slots.customer || '').trim()
      if (!customer) return { ok: false, error: 'customer_required', message: 'Müşteri gerekli.' }
      return {
        ok: true,
        data: { customer },
        message: `${customer} cari bakiyesi sorgulanıyor.`,
        clientAction: { type: 'get_account_balance', payload: { customer } },
      }
    },
  },
  search_product: {
    risk: false,
    async run({ slots }, _ctx) {
      const product = String(slots.product || '').trim()
      if (!product) return { ok: false, error: 'product_required', message: 'Ürün gerekli.' }
      return {
        ok: true,
        data: { product },
        message: `"${product}" stok/katalogda aranıyor.`,
        clientAction: { type: 'search_product', payload: { query: product } },
      }
    },
  },
  get_stock: {
    risk: false,
    async run({ slots }, _ctx) {
      const product = String(slots.product || '').trim()
      if (!product) return { ok: false, error: 'product_required', message: 'Ürün gerekli.' }
      return {
        ok: true,
        data: { product },
        message: `${product} stok durumu sorgulanıyor.`,
        clientAction: { type: 'get_stock', payload: { product } },
      }
    },
  },
  create_offer_draft: {
    risk: true,
    async run({ slots, confirmed }, ctx) {
      if (!confirmed) {
        return {
          ok: false,
          needsConfirmation: true,
          message: `${slots.customer || 'Müşteri'} için teklif oluşturacağım. Onaylıyor musun?`,
          pending: {
            intent: 'create_offer',
            slots,
          },
        }
      }
      const idem = String(slots.idempotencyKey || `${ctx.userId}:${ctx.companyId}:offer:${slots.customer}:${slots.product}:${slots.quantity}:${slots.unitPrice}`)
      if (idempotencyCache.has(idem)) {
        return { ok: true, data: idempotencyCache.get(idem), message: 'Teklif zaten oluşturulmuş.', duplicate: true }
      }
      const draft = {
        customer: slots.customer || '',
        product: slots.product || '',
        quantity: Number(slots.quantity) || 0,
        unitPrice: Number(slots.unitPrice) || 0,
      }
      idempotencyCache.set(idem, draft)
      return {
        ok: true,
        data: draft,
        message: 'Teklif taslağı hazırlanıyor.',
        clientAction: {
          type: 'create_quote',
          payload: {
            title: `${draft.customer} teklifi`,
            customer: draft.customer,
            items: draft.product
              ? [{ product: draft.product, quantity: draft.quantity, unitPrice: draft.unitPrice, vatRate: 20 }]
              : [],
          },
        },
      }
    },
  },
}

function intentToTool(intent) {
  if (intent === 'create_offer') return 'create_offer_draft'
  if (intent === 'search_customer') return 'search_customer'
  if (intent === 'get_account_balance') return 'get_account_balance'
  if (intent === 'search_product') return 'search_product'
  if (intent === 'get_stock') return 'get_stock'
  return null
}

export async function handleIntentRequest(reqBody = {}, reqHeaders = {}) {
  const started = Date.now()
  const ctx = authFromHeaders(reqHeaders, reqBody)
  assertAuth(ctx)

  const text = String(reqBody.text || reqBody.utterance || '').trim()
  if (!text) {
    const err = new Error('Metin gerekli.')
    err.statusCode = 400
    throw err
  }

  const apiKey = requireOpenAiApiKey(resolveRequestApiKey(reqBody, reqHeaders))
  const parsed = await parseIntent({ text, apiKey, context: reqBody.context || {} })
  const intent = String(parsed.intent || 'unknown')
  const slots = parsed.slots || {}
  const confirmed = Boolean(reqBody.confirmed)
  const toolName = intentToTool(intent)
  const needsConfirmation = Boolean(parsed.needsConfirmation) || (RISK_INTENTS.has(intent) && !confirmed)

  if (!toolName) {
    return {
      message: parsed.message || 'Bu komutu henüz işleyemiyorum.',
      intent,
      slots,
      actions: [],
      audit: audit({ ctx, action: intent, success: false, errorCode: 'unknown_intent', durationMs: Date.now() - started }),
    }
  }

  if (needsConfirmation && !confirmed) {
    return {
      message: parsed.message || 'Onayınızı bekliyorum.',
      intent,
      slots,
      needsConfirmation: true,
      pending: { intent, slots },
      actions: [],
      audit: audit({ ctx, action: intent, success: true, durationMs: Date.now() - started }),
    }
  }

  const tool = TOOLS[toolName]
  const result = await tool.run({ slots, confirmed: confirmed || !tool.risk }, ctx)
  const actions = result.clientAction ? [result.clientAction] : []

  return {
    message: result.message || parsed.message || 'Tamam.',
    intent,
    slots,
    needsConfirmation: Boolean(result.needsConfirmation),
    pending: result.pending || null,
    data: result.data || null,
    actions,
    audit: audit({
      ctx,
      action: toolName,
      success: Boolean(result.ok),
      errorCode: result.error || null,
      durationMs: Date.now() - started,
    }),
  }
}

export async function handleToolCallRequest(reqBody = {}, reqHeaders = {}) {
  const started = Date.now()
  const ctx = authFromHeaders(reqHeaders, reqBody)
  assertAuth(ctx)
  const name = String(reqBody.tool || reqBody.name || '').trim()
  const tool = TOOLS[name]
  if (!tool) {
    const err = new Error(`Bilinmeyen tool: ${name}`)
    err.statusCode = 404
    throw err
  }
  const result = await tool.run(
    { slots: reqBody.slots || reqBody.arguments || {}, confirmed: Boolean(reqBody.confirmed) },
    ctx,
  )
  return {
    ...result,
    actions: result.clientAction ? [result.clientAction] : [],
    audit: audit({
      ctx,
      action: name,
      success: Boolean(result.ok),
      errorCode: result.error || null,
      durationMs: Date.now() - started,
    }),
  }
}
