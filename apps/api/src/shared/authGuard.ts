import type { FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from './errors.js'
import { verifyAccessToken, type AccessClaims } from './jwt.js'

export type AuthUser = AccessClaims

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthUser
  }
}

export async function authenticate(req: FastifyRequest, _reply: FastifyReply) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Oturum gerekli', 401)
  }
  try {
    req.auth = await verifyAccessToken(header.slice(7))
  } catch {
    throw new AppError('UNAUTHORIZED', 'Geçersiz veya süresi dolmuş token', 401)
  }
}

export function requireStaff(...roles: string[]) {
  return async (req: FastifyRequest) => {
    await authenticate(req, {} as FastifyReply)
    const role = req.auth?.platformRole || 'none'
    if (role === 'none' || (roles.length && !roles.includes(role) && role !== 'superadmin')) {
      throw new AppError('FORBIDDEN', 'Yetkisiz', 403)
    }
  }
}

export function requireTenant(req: FastifyRequest) {
  if (!req.auth?.cid) throw new AppError('TENANT_REQUIRED', 'Firma bağlamı gerekli', 403)
  return req.auth.cid
}

/** Least Privilege: require permission codes on JWT `perms` claim (or staff bypass).
 * Legacy tokens without `perms` remain allowed (backward compatible).
 */
export function requirePermission(...codes: string[]) {
  return async (req: FastifyRequest) => {
    await authenticate(req, {} as FastifyReply)
    if (req.auth?.platformRole && req.auth.platformRole !== 'none') return
    const perms = Array.isArray(req.auth?.perms) ? req.auth.perms : null
    if (!perms || perms.length === 0) return
    const ok = codes.every((code) => perms.includes(code) || perms.includes('*'))
    if (!ok) throw new AppError('FORBIDDEN', `İzin gerekli: ${codes.join(', ')}`, 403)
  }
}
