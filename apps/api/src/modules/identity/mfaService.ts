import { and, eq, isNull } from 'drizzle-orm'
import { generateSecret, generateURI, verify } from 'otplib'
import QRCode from 'qrcode'
import { UAParser } from 'ua-parser-js'
import { db } from '../../db/client.js'
import { mfaChallenges, trustedDevices, users } from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import {
  decryptSecret,
  deviceFingerprint,
  encryptSecret,
  randomToken,
  sha256,
} from '../../shared/crypto.js'
import { logActivity } from '../audit/activityService.js'

const TRUST_DAYS = 30

function parseDeviceLabel(userAgent?: string) {
  try {
    const parser = new UAParser(userAgent || '')
    const browser = parser.getBrowser()
    const os = parser.getOS()
    const parts = [browser.name, os.name].filter(Boolean)
    return parts.join(' · ') || 'Bilinmeyen cihaz'
  } catch {
    return 'Bilinmeyen cihaz'
  }
}

export async function beginMfaSetup(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new AppError('USER_NOT_FOUND', 'Kullanıcı bulunamadı', 404)
  if (user.mfaEnabled) throw new AppError('MFA_ALREADY_ON', 'MFA zaten açık')

  const secret = generateSecret()
  await db
    .update(users)
    .set({ mfaSecretEnc: encryptSecret(secret), updatedAt: new Date() })
    .where(eq(users.id, userId))

  const otpauth = generateURI({
    issuer: 'BACHMAIN',
    label: user.email,
    secret,
  })
  const qrDataUrl = await QRCode.toDataURL(otpauth)
  return { secret, otpauth, qrDataUrl }
}

export async function enableMfa(userId: string, code: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user?.mfaSecretEnc) throw new AppError('MFA_SETUP_REQUIRED', 'Önce MFA kurulumu başlatın')
  const secret = decryptSecret(user.mfaSecretEnc)
  const result = await verify({ token: code, secret })
  if (!result.valid) throw new AppError('INVALID_MFA_CODE', 'Doğrulama kodu hatalı', 401)

  const backupCodes = Array.from({ length: 8 }, () => randomToken(5).slice(0, 10).toUpperCase())
  await db
    .update(users)
    .set({
      mfaEnabled: true,
      mfaBackupCodesHash: backupCodes.map((c) => sha256(c)),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  await logActivity({
    userId,
    action: 'auth.mfa.enable',
    resource: 'user',
    resourceId: userId,
  })

  return { ok: true, backupCodes }
}

export async function disableMfa(userId: string, code: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user?.mfaEnabled || !user.mfaSecretEnc) {
    throw new AppError('MFA_NOT_ENABLED', 'MFA kapalı')
  }
  const secret = decryptSecret(user.mfaSecretEnc)
  const result = await verify({ token: code, secret })
  if (!result.valid) throw new AppError('INVALID_MFA_CODE', 'Doğrulama kodu hatalı', 401)

  await db
    .update(users)
    .set({
      mfaEnabled: false,
      mfaSecretEnc: null,
      mfaBackupCodesHash: [],
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  await logActivity({
    userId,
    action: 'auth.mfa.disable',
    resource: 'user',
    resourceId: userId,
  })

  return { ok: true }
}

export async function createMfaChallenge(userId: string) {
  const challenge = randomToken()
  await db.insert(mfaChallenges).values({
    userId,
    challengeHash: sha256(challenge),
    purpose: 'login',
    expiresAt: new Date(Date.now() + 5 * 60_000),
  })
  return challenge
}

export async function isTrustedDevice(userId: string, meta: { userAgent?: string; ip?: string; deviceId?: string }) {
  const hash = deviceFingerprint(meta)
  const [row] = await db
    .select()
    .from(trustedDevices)
    .where(
      and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.deviceHash, hash),
        isNull(trustedDevices.revokedAt),
      ),
    )
    .limit(1)
  if (!row) return false
  if (row.expiresAt < new Date()) return false
  await db
    .update(trustedDevices)
    .set({ lastSeenAt: new Date(), updatedAt: new Date() })
    .where(eq(trustedDevices.id, row.id))
  return true
}

export async function trustDevice(
  userId: string,
  meta: { userAgent?: string; ip?: string; deviceId?: string },
) {
  const hash = deviceFingerprint(meta)
  const expiresAt = new Date(Date.now() + TRUST_DAYS * 86400_000)
  const label = parseDeviceLabel(meta.userAgent)
  const [existing] = await db
    .select()
    .from(trustedDevices)
    .where(and(eq(trustedDevices.userId, userId), eq(trustedDevices.deviceHash, hash)))
    .limit(1)

  if (existing) {
    await db
      .update(trustedDevices)
      .set({
        revokedAt: null,
        expiresAt,
        lastSeenAt: new Date(),
        label,
        userAgent: meta.userAgent || null,
        ip: meta.ip || null,
        updatedAt: new Date(),
      })
      .where(eq(trustedDevices.id, existing.id))
    return existing.id
  }

  const [row] = await db
    .insert(trustedDevices)
    .values({
      userId,
      deviceHash: hash,
      label,
      userAgent: meta.userAgent || null,
      ip: meta.ip || null,
      expiresAt,
    })
    .returning()
  return row.id
}

export async function verifyMfaChallenge(input: {
  mfaToken: string
  code: string
  trustDevice?: boolean
  ip?: string
  userAgent?: string
  deviceId?: string
}) {
  const [challenge] = await db
    .select()
    .from(mfaChallenges)
    .where(and(eq(mfaChallenges.challengeHash, sha256(input.mfaToken)), isNull(mfaChallenges.usedAt)))
    .limit(1)
  if (!challenge || challenge.expiresAt < new Date()) {
    throw new AppError('INVALID_MFA_TOKEN', 'MFA oturumu geçersiz veya süresi dolmuş', 401)
  }

  const [user] = await db.select().from(users).where(eq(users.id, challenge.userId)).limit(1)
  if (!user?.mfaEnabled || !user.mfaSecretEnc) {
    throw new AppError('MFA_NOT_ENABLED', 'MFA kapalı', 400)
  }

  const secret = decryptSecret(user.mfaSecretEnc)
  let ok = (await verify({ token: input.code, secret })).valid
  if (!ok && user.mfaBackupCodesHash?.length) {
    const codeHash = sha256(input.code.trim().toUpperCase())
    const idx = user.mfaBackupCodesHash.indexOf(codeHash)
    if (idx >= 0) {
      ok = true
      const next = [...user.mfaBackupCodesHash]
      next.splice(idx, 1)
      await db.update(users).set({ mfaBackupCodesHash: next, updatedAt: new Date() }).where(eq(users.id, user.id))
    }
  }
  if (!ok) throw new AppError('INVALID_MFA_CODE', 'Doğrulama kodu hatalı', 401)

  await db.update(mfaChallenges).set({ usedAt: new Date() }).where(eq(mfaChallenges.id, challenge.id))

  if (input.trustDevice) {
    await trustDevice(user.id, {
      userAgent: input.userAgent,
      ip: input.ip,
      deviceId: input.deviceId,
    })
  }

  return { userId: user.id }
}

export async function listTrustedDevices(userId: string) {
  const rows = await db
    .select()
    .from(trustedDevices)
    .where(and(eq(trustedDevices.userId, userId), isNull(trustedDevices.revokedAt)))
  return rows
    .filter((r) => r.expiresAt >= new Date())
    .map((r) => ({
      id: r.id,
      label: r.label,
      userAgent: r.userAgent,
      ip: r.ip,
      lastSeenAt: r.lastSeenAt,
      expiresAt: r.expiresAt,
    }))
}

export async function revokeTrustedDevice(userId: string, deviceId: string) {
  await db
    .update(trustedDevices)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(trustedDevices.id, deviceId), eq(trustedDevices.userId, userId)))
  return { ok: true }
}

export async function markOnboardingComplete(userId: string) {
  await db
    .update(users)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(users.id, userId))
  return { ok: true }
}
