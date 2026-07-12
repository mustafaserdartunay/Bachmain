import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  companies,
  companyMemberships,
  emailTokens,
  plans,
  refreshTokens,
  subscriptions,
  users,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { hashPassword, randomToken, sha256, slugify, verifyPassword } from '../../shared/crypto.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/jwt.js'
import { env } from '../../config/env.js'
import { logActivity } from '../audit/activityService.js'
import { notifyUser } from '../notifications/notificationService.js'

async function uniqueSlug(base: string) {
  const slug = slugify(base)
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`
    const [existing] = await db.select().from(companies).where(eq(companies.slug, candidate)).limit(1)
    if (!existing) return candidate
  }
  return `${slug}-${Date.now().toString(36)}`
}

export async function registerUser(input: {
  email: string
  password: string
  fullName: string
  phone?: string
  companyName: string
  plan?: 'free' | 'basic' | 'pro' | 'enterprise'
  ip?: string
  userAgent?: string
}) {
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) throw new AppError('INVALID_EMAIL', 'Geçerli e-posta girin')
  if (input.password.length < 6) throw new AppError('WEAK_PASSWORD', 'Şifre en az 6 karakter olmalı')
  if (!input.fullName.trim() || !input.companyName.trim()) {
    throw new AppError('MISSING_FIELDS', 'Ad soyad ve firma adı zorunlu')
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) throw new AppError('EMAIL_TAKEN', 'Bu e-posta ile zaten üyelik var', 409)

  const planCode = input.plan || 'free'
  const [plan] = await db.select().from(plans).where(eq(plans.code, planCode)).limit(1)
  if (!plan) throw new AppError('PLAN_MISSING', 'Plan tanımlı değil. Seed çalıştırın.', 500)

  const now = new Date()
  const trialEnds = new Date(now.getTime() + 7 * 86400000)

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(input.password),
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || null,
    })
    .returning()

  const [company] = await db
    .insert(companies)
    .values({
      name: input.companyName.trim(),
      slug: await uniqueSlug(input.companyName),
      planCode,
      status: 'trial',
    })
    .returning()

  await db.insert(companyMemberships).values({
    companyId: company.id,
    userId: user.id,
    role: 'owner',
    isDefault: true,
  })

  await db.insert(subscriptions).values({
    companyId: company.id,
    planId: plan.id,
    status: 'trialing',
    provider: 'manual',
    trialEndsAt: trialEnds,
    currentPeriodStart: now,
    currentPeriodEnd: trialEnds,
  })

  const verify = randomToken()
  await db.insert(emailTokens).values({
    userId: user.id,
    purpose: 'verify',
    tokenHash: sha256(verify),
    expiresAt: new Date(now.getTime() + 2 * 86400000),
  })

  const tokens = await issueSession(user.id, company.id, 'owner', 'none', input)
  await logActivity({
    companyId: company.id,
    userId: user.id,
    action: 'auth.register',
    resource: 'user',
    resourceId: user.id,
    ip: input.ip,
    userAgent: input.userAgent,
  })

  return {
    user: publicUser(user, company.id, 'owner'),
    company,
    tokens,
    emailVerificationToken: env.NODE_ENV === 'production' ? undefined : verify,
  }
}

export async function loginUser(input: {
  email: string
  password: string
  ip?: string
  userAgent?: string
}) {
  const email = input.email.trim().toLowerCase()
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1)
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new AppError('INVALID_CREDENTIALS', 'E-posta veya şifre hatalı', 401)
  }

  const [membership] = await db
    .select()
    .from(companyMemberships)
    .where(and(eq(companyMemberships.userId, user.id), eq(companyMemberships.isDefault, true)))
    .limit(1)

  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id))

  const tokens = await issueSession(
    user.id,
    membership?.companyId || null,
    membership?.role || 'viewer',
    user.platformRole,
    input,
  )

  await logActivity({
    companyId: membership?.companyId,
    userId: user.id,
    action: 'auth.login',
    resource: 'user',
    resourceId: user.id,
    ip: input.ip,
    userAgent: input.userAgent,
  })

  return {
    user: publicUser(user, membership?.companyId || null, membership?.role || 'viewer'),
    tokens,
  }
}

async function issueSession(
  userId: string,
  companyId: string | null | undefined,
  role: string,
  platformRole: string,
  meta: { ip?: string; userAgent?: string },
) {
  const kind = platformRole && platformRole !== 'none' ? 'staff' : 'tenant'
  const accessToken = await signAccessToken({
    sub: userId,
    cid: companyId || null,
    kind,
    role,
    platformRole,
  })
  const refreshToken = await signRefreshToken(userId)
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000),
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
  })
  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL_SECONDS }
}

export async function refreshSession(refreshToken: string) {
  let payload
  try {
    payload = await verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('INVALID_REFRESH', 'Oturum yenilenemedi', 401)
  }
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, sha256(refreshToken)), isNull(refreshTokens.revokedAt)))
    .limit(1)
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('INVALID_REFRESH', 'Oturum yenilenemedi', 401)
  }
  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1)
  if (!user) throw new AppError('USER_NOT_FOUND', 'Kullanıcı bulunamadı', 404)
  const [membership] = await db
    .select()
    .from(companyMemberships)
    .where(and(eq(companyMemberships.userId, user.id), eq(companyMemberships.isDefault, true)))
    .limit(1)
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, stored.id))
  return issueSession(user.id, membership?.companyId, membership?.role || 'viewer', user.platformRole, {})
}

export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) return { ok: true }
  const token = randomToken()
  await db.insert(emailTokens).values({
    userId: user.id,
    purpose: 'reset',
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + 3600_000),
  })
  return { ok: true, resetToken: env.NODE_ENV === 'production' ? undefined : token }
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 6) throw new AppError('WEAK_PASSWORD', 'Şifre en az 6 karakter olmalı')
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, sha256(token)), eq(emailTokens.purpose, 'reset')))
    .limit(1)
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new AppError('INVALID_TOKEN', 'Geçersiz veya süresi dolmuş token')
  }
  await db
    .update(users)
    .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, row.userId))
  await db.update(emailTokens).set({ usedAt: new Date() }).where(eq(emailTokens.id, row.id))
  return { ok: true }
}

export async function verifyEmail(token: string) {
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, sha256(token)), eq(emailTokens.purpose, 'verify')))
    .limit(1)
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new AppError('INVALID_TOKEN', 'Geçersiz veya süresi dolmuş token')
  }
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, row.userId))
  await db.update(emailTokens).set({ usedAt: new Date() }).where(eq(emailTokens.id, row.id))
  await notifyUser({
    userId: row.userId,
    type: 'system',
    title: 'E-posta doğrulandı',
    body: 'Hesabınız doğrulandı.',
  })
  return { ok: true }
}

export async function getMe(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new AppError('USER_NOT_FOUND', 'Kullanıcı bulunamadı', 404)
  const [membership] = await db
    .select()
    .from(companyMemberships)
    .where(and(eq(companyMemberships.userId, user.id), eq(companyMemberships.isDefault, true)))
    .limit(1)
  let company = null
  if (membership) {
    const [c] = await db.select().from(companies).where(eq(companies.id, membership.companyId)).limit(1)
    company = c || null
  }
  return {
    user: publicUser(user, membership?.companyId || null, membership?.role || 'viewer'),
    company,
  }
}

function publicUser(
  user: typeof users.$inferSelect,
  companyId: string | null,
  role: string,
) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    companyId,
    role,
    platformRole: user.platformRole,
    emailVerified: Boolean(user.emailVerifiedAt),
  }
}
