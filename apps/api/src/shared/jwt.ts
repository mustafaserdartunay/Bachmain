import * as jose from 'jose'
import { env } from '../config/env.js'

export type AccessClaims = {
  sub: string
  cid?: string | null
  kind: 'tenant' | 'staff'
  role?: string
  platformRole?: string
  /** Permission codes for Least Privilege checks */
  perms?: string[]
}

const accessSecret = () => new TextEncoder().encode(env.JWT_ACCESS_SECRET)
const refreshSecret = () => new TextEncoder().encode(env.JWT_REFRESH_SECRET)

export async function signAccessToken(claims: AccessClaims) {
  return new jose.SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
    .sign(accessSecret())
}

export async function signRefreshToken(userId: string) {
  return new jose.SignJWT({ sub: userId, typ: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_REFRESH_TTL_SECONDS}s`)
    .sign(refreshSecret())
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jose.jwtVerify(token, accessSecret())
  return payload as unknown as AccessClaims & jose.JWTPayload
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jose.jwtVerify(token, refreshSecret())
  return payload as jose.JWTPayload & { sub: string; typ?: string }
}
