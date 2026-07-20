import crypto from 'crypto'

/**
 * Verify Stripe-Signature header (webhook signing secret).
 * @param {string|Buffer} rawBody
 * @param {string} signatureHeader
 * @param {string} webhookSecret
 * @param {{ toleranceSec?: number }} [opts]
 */
export function verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret, opts = {}) {
  const secret = String(webhookSecret || '').trim()
  if (!secret) {
    const err = new Error('STRIPE_WEBHOOK_SECRET is not configured')
    err.statusCode = 500
    throw err
  }
  const header = String(signatureHeader || '')
  if (!header) {
    const err = new Error('Missing Stripe-Signature header')
    err.statusCode = 400
    throw err
  }

  const parts = Object.fromEntries(
    header.split(',').map((piece) => {
      const [k, ...rest] = piece.trim().split('=')
      return [k, rest.join('=')]
    }),
  )
  const timestamp = Number(parts.t)
  const v1 = parts.v1
  if (!timestamp || !v1) {
    const err = new Error('Invalid Stripe-Signature header')
    err.statusCode = 400
    throw err
  }

  const tolerance = Number(opts.toleranceSec ?? 300)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > tolerance) {
    const err = new Error('Stripe webhook timestamp outside tolerance')
    err.statusCode = 400
    throw err
  }

  const payload = typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody).toString('utf8')
  const signed = `${timestamp}.${payload}`
  const expected = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(String(v1), 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const err = new Error('Stripe webhook signature mismatch')
    err.statusCode = 400
    throw err
  }

  return JSON.parse(payload)
}

/** In-memory idempotency for admin JSON store path (process lifetime). */
const seenEvents = new Map()

export function claimStripeEventId(eventId, ttlMs = 86_400_000) {
  const id = String(eventId || '')
  if (!id) return true
  const now = Date.now()
  for (const [key, exp] of seenEvents) {
    if (exp < now) seenEvents.delete(key)
  }
  if (seenEvents.has(id)) return false
  seenEvents.set(id, now + ttlMs)
  return true
}
