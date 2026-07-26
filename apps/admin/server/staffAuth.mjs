/**
 * Staff (admin panel) auth + API gate helpers.
 */
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  buildSessionCookie,
} from './auth.mjs'
import { newId } from './store.mjs'
import { findStaffByEmail, upsertStaffUser, hasDatabase } from './db.mjs'

const STAFF_COOKIE = 'bachmain_staff'

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

function staffFromEnv() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@bachmain.com')
  const password = process.env.ADMIN_PASSWORD || ''
  const fullName = process.env.ADMIN_NAME || 'BACHMAIN Admin'
  if (!password) return null
  return { email, password, fullName, role: 'super_admin' }
}

export async function ensureBootstrapStaff() {
  const envStaff = staffFromEnv()
  if (!envStaff || !hasDatabase()) return null
  const existing = await findStaffByEmail(envStaff.email)
  if (existing) return existing
  const user = {
    id: newId('staff'),
    email: envStaff.email,
    fullName: envStaff.fullName,
    passwordHash: hashPassword(envStaff.password),
    role: envStaff.role,
  }
  await upsertStaffUser(user)
  return user
}

export async function loginStaff(body) {
  await ensureBootstrapStaff()
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')
  const envStaff = staffFromEnv()

  let staff = hasDatabase() ? await findStaffByEmail(email) : null

  let ok = false
  if (staff && verifyPassword(password, staff.passwordHash)) ok = true
  if (!ok && envStaff && email === envStaff.email && password === envStaff.password) {
    ok = true
    staff = staff || {
      id: 'staff_env',
      email: envStaff.email,
      fullName: envStaff.fullName,
      role: envStaff.role,
    }
  }

  if (!ok || !staff) {
    const err = new Error('E-posta veya şifre hatalı')
    err.code = 'INVALID_CREDENTIALS'
    throw err
  }

  const token = signToken({
    sub: staff.id,
    email: staff.email,
    role: staff.role || 'admin',
    kind: 'staff',
  })

  return {
    token,
    user: {
      id: staff.id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role || 'admin',
      kind: 'staff',
    },
  }
}

export function getStaffSession(req) {
  const auth = req.headers?.authorization || ''
  let token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null
  if (!token) {
    const header = req.headers?.cookie || ''
    const match = String(header).match(/(?:^|;\s*)bachmain_staff=([^;]+)/)
    if (match) {
      try {
        token = decodeURIComponent(match[1])
      } catch {
        token = match[1]
      }
    }
  }
  const payload = verifyToken(token)
  if (!payload?.sub || payload.kind !== 'staff') return null
  return {
    user: {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'admin',
      kind: 'staff',
    },
    token,
    payload,
  }
}

export function buildStaffCookie(token, { clear = false } = {}) {
  // Reuse session cookie builder shape but with staff cookie name
  const base = buildSessionCookie(token, { clear })
  return base.replace(/^bachmain_session=/, `${STAFF_COOKIE}=`)
}

/** Public paths that do not require staff auth. */
export function isPublicApiPath(path, method) {
  if (!path || path === 'health' || path === '') return true
  if (path.startsWith('auth/')) return true
  if (path.startsWith('staff/')) return true
  if (path.startsWith('payments/')) return true
  if (path.startsWith('tenant/')) return true
  if (path.startsWith('leads/')) return true
  if (path === 'demo-requests') return true
  // Public legal reads + consent/cookie writes (admin under legal/admin/* still gated)
  if (path === 'legal' || path === 'legal/documents' || path.startsWith('legal/documents/'))
    return true
  if (path === 'legal/pack' || path === 'legal/required' || path === 'legal/consents/me')
    return true
  if (path === 'legal/consents' || path === 'legal/cookies') return true
  return false
}

export function staffAuthEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD)
}

export function requireStaffOrReject(req, path, method) {
  if (isPublicApiPath(path, method)) return { ok: true }
  // Transitional: do not lock the panel until ADMIN_PASSWORD is configured.
  if (!staffAuthEnabled()) return { ok: true, transitional: true }
  const session = getStaffSession(req)
  if (session) return { ok: true, session }
  return {
    ok: false,
    status: 401,
    body: {
      error: 'STAFF_UNAUTHORIZED',
      message: 'Yönetim paneli için personel girişi gerekli',
    },
  }
}

export { STAFF_COOKIE }
