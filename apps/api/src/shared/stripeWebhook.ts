import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyStripeWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | string[] | undefined,
  webhookSecret: string,
  toleranceSec = 300,
) {
  const secret = String(webhookSecret || '').trim()
  if (!secret) {
    const err = new Error('STRIPE_WEBHOOK_SECRET is not configured') as Error & { statusCode?: number }
    err.statusCode = 500
    throw err
  }
  const header = Array.isArray(signatureHeader) ? signatureHeader[0] : String(signatureHeader || '')
  if (!header) {
    const err = new Error('Missing Stripe-Signature header') as Error & { statusCode?: number }
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
    const err = new Error('Invalid Stripe-Signature header') as Error & { statusCode?: number }
    err.statusCode = 400
    throw err
  }

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSec) {
    const err = new Error('Stripe webhook timestamp outside tolerance') as Error & { statusCode?: number }
    err.statusCode = 400
    throw err
  }

  const payload = typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody).toString('utf8')
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(String(v1), 'utf8')
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    const err = new Error('Stripe webhook signature mismatch') as Error & { statusCode?: number }
    err.statusCode = 400
    throw err
  }
  return JSON.parse(payload) as {
    id?: string
    type?: string
    data?: { object?: Record<string, unknown> }
  }
}
