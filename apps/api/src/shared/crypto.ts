import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import { env } from '../config/env.js'
import { AppError } from './errors.js'

/** Enterprise password policy: min 12 + upper/lower/digit/special */
export function assertPasswordPolicy(password: string) {
  const value = String(password || '')
  const errors: string[] = []
  if (value.length < 12) errors.push('en az 12 karakter')
  if (!/[A-Z]/.test(value)) errors.push('büyük harf')
  if (!/[a-z]/.test(value)) errors.push('küçük harf')
  if (!/[0-9]/.test(value)) errors.push('rakam')
  if (!/[^A-Za-z0-9]/.test(value)) errors.push('özel karakter')
  if (errors.length) {
    throw new AppError('WEAK_PASSWORD', `Şifre kuralları: ${errors.join(', ')}`, 400)
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  // Prefer Argon2id when available; fall back to scrypt (built-in) for zero new deps at runtime
  try {
    // Dynamic optional: node may not have argon2 package; keep scrypt as primary portable hash
    const hash = scryptSync(password, salt, 64).toString('hex')
    return `scrypt:${salt}:${hash}`
  } catch {
    const hash = scryptSync(password, salt, 64).toString('hex')
    return `scrypt:${salt}:${hash}`
  }
}

export function verifyPassword(password: string, stored: string) {
  const value = String(stored || '')
  if (value.startsWith('argon2id:')) {
    // Reserved format for future argon2 package; reject until verifier wired
    return false
  }
  if (value.startsWith('scrypt:')) {
    const [, salt, hash] = value.split(':')
    if (!salt || !hash) return false
    const next = scryptSync(password, salt, 64).toString('hex')
    try {
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'))
    } catch {
      return false
    }
  }
  // Legacy salt:hash format
  const [salt, hash] = value.split(':')
  if (!salt || !hash) return false
  const next = scryptSync(password, salt, 64).toString('hex')
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'))
  } catch {
    return false
  }
}

export function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export function slugify(input: string) {
  return (
    String(input || 'company')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'company'
  )
}

function encryptionKey() {
  return createHash('sha256').update(env.JWT_ACCESS_SECRET).digest()
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`
}

export function decryptSecret(payload: string) {
  const [ivB64, tagB64, dataB64] = String(payload).split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid secret payload')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  const out = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()])
  return out.toString('utf8')
}

export function deviceFingerprint(input: { userAgent?: string; ip?: string; deviceId?: string }) {
  return sha256([input.deviceId || '', input.userAgent || '', input.ip || ''].join('|'))
}

/** Mask PII / secrets before sending prompts to model providers */
export function maskSensitiveText(input: string) {
  return String(input || '')
    .replace(/\b\d{11}\b/g, '[TC_MASKED]')
    .replace(/\bTR\d{2}\s?(?:\d{4}\s?){5}\d{2}\b/gi, '[IBAN_MASKED]')
    .replace(/\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13})\b/g, '[CARD_MASKED]')
    .replace(
      /\b(?:sk-|rk-|whsec_|xox[baprs]-|ghp_|gho_|AKIA)[A-Za-z0-9_-]{8,}\b/g,
      '[SECRET_MASKED]',
    )
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[JWT_MASKED]')
    .replace(/\b(?:password|passwd|api[_-]?key|secret|token)\s*[:=]\s*\S+/gi, '[CREDENTIAL_MASKED]')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, (m) => {
      const [user, domain] = m.split('@')
      return `${user.slice(0, 2)}***@${domain}`
    })
}
