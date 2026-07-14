import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const value = String(stored || '')
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
