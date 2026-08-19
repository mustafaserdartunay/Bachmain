import { APP_MODULES, emptyModulePermissions } from '../data/appModules'
import { deriveAccessLevelFromPermissions, ownerModulePermissions } from './moduleAccess'
import { persistSession, getStoredSession } from './platformAuth'
import { readCompanySettings } from './companySettings'

const STORE_KEY = 'bachmain_local_team_v1'

function nowIso() {
  return new Date().toISOString()
}

function newId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.invites)) return parsed
  } catch {
    /* ignore */
  }
  return { users: [], invites: [] }
}

function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function companyName() {
  return readCompanySettings()?.companyName || 'BachMain'
}

function publicTeamUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone || '',
    jobTitle: row.jobTitle || '',
    companyName: companyName(),
    tenantCode: 'LOCAL',
    customerId: 'local-dev',
    plan: 'pro',
    status: 'active',
    subscriptionStatus: 'active',
    licenseExpiry: '2099-12-31',
    onboardingCompleted: true,
    trialEnded: false,
    legal: { mustAccept: false, outstanding: [] },
    accountKind: 'team_member',
    accessLevel: row.accessLevel || 'viewer',
    role: row.accessLevel || 'viewer',
    inviteStatus: row.inviteStatus,
    modulePermissions: row.modulePermissions || emptyModulePermissions('none'),
    canManageUsers: false,
    emailVerifiedAt: row.acceptedAt || null,
  }
}

function listRow(row, invite) {
  return {
    accountId: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone || '',
    jobTitle: row.jobTitle || '',
    accessLevel: row.accessLevel || 'viewer',
    primary: false,
    accountKind: 'team_member',
    inviteStatus: row.inviteStatus,
    inviteStatusLabel:
      row.inviteStatus === 'accepted'
        ? 'Onaylandı'
        : row.inviteStatus === 'suspended'
          ? 'Askıda'
          : 'Davet gönderildi',
    approved: row.inviteStatus === 'accepted',
    invitedAt: invite?.createdAt || row.createdAt,
    acceptedAt: row.acceptedAt || null,
    lastLoginAt: row.lastLoginAt || null,
    modulePermissions: row.modulePermissions,
    inviteUrl: invite?.url || null,
  }
}

function ownerRow() {
  const session = getStoredSession()?.user
  return {
    accountId: session?.id || 'local-dev',
    email: session?.email || 'dev@bachmain.local',
    fullName: session?.fullName || 'Yönetici',
    phone: session?.phone || '',
    jobTitle: 'Yönetici',
    accessLevel: 'owner',
    primary: true,
    accountKind: 'owner',
    inviteStatus: 'accepted',
    inviteStatusLabel: 'Firma sahibi',
    approved: true,
    invitedAt: null,
    acceptedAt: session?.createdAt || null,
    lastLoginAt: nowIso(),
    modulePermissions: ownerModulePermissions(),
    inviteUrl: null,
  }
}

function inviteUrlFor(token) {
  if (typeof window === 'undefined') return `/davet?token=${encodeURIComponent(token)}`
  return `${window.location.origin}/davet?token=${encodeURIComponent(token)}`
}

export function listLocalTeamUsers() {
  const store = loadStore()
  const rows = store.users.map((user) => {
    const invite = store.invites.find((row) => row.accountId === user.id && !row.consumedAt)
    return listRow(user, invite || store.invites.find((row) => row.accountId === user.id))
  })
  return [ownerRow(), ...rows]
}

export async function inviteLocalTeamUser(payload) {
  const email = normalizeEmail(payload.email)
  if (!email.includes('@')) {
    throw new Error('Geçerli bir e-posta girin')
  }
  const fullName = String(payload.fullName || '').trim()
  if (!fullName) throw new Error('Ad soyad zorunlu')

  const store = loadStore()
  if (email === 'dev@bachmain.local') {
    throw new Error('Yönetici hesabı davet edilemez')
  }
  const existing = store.users.find((row) => row.email === email)
  if (existing && existing.inviteStatus !== 'suspended') {
    throw new Error('Bu e-posta ile zaten bir kullanıcı var')
  }

  const permissions = {
    ...emptyModulePermissions('none'),
    ...(payload.modulePermissions || {}),
    dashboard_basic: payload.modulePermissions?.dashboard_basic || 'view',
  }
  const accessLevel = deriveAccessLevelFromPermissions(permissions)
  const token = newId('inv')
  const user = existing || {
    id: newId('tm'),
    email,
    fullName,
    phone: String(payload.phone || '').trim(),
    jobTitle: String(payload.jobTitle || '').trim(),
    passwordHash: '',
    modulePermissions: permissions,
    accessLevel,
    inviteStatus: 'pending',
    createdAt: nowIso(),
    acceptedAt: null,
    lastLoginAt: null,
  }
  user.fullName = fullName
  user.phone = String(payload.phone || user.phone || '').trim()
  user.jobTitle = String(payload.jobTitle || user.jobTitle || '').trim()
  user.modulePermissions = permissions
  user.accessLevel = accessLevel
  user.inviteStatus = 'pending'
  user.acceptedAt = null

  store.users = existing
    ? store.users.map((row) => (row.id === user.id ? user : row))
    : [user, ...store.users]
  store.invites = store.invites.filter((row) => row.accountId !== user.id || row.consumedAt)
  const invite = {
    id: newId('tinv'),
    token,
    accountId: user.id,
    email,
    url: inviteUrlFor(token),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    consumedAt: null,
  }
  store.invites.unshift(invite)
  saveStore(store)
  return {
    users: listLocalTeamUsers(),
    inviteUrl: invite.url,
    mailStatus: 'local_link',
    message: 'Yerel ortamda e-posta gönderilmez. Davet bağlantısını kopyalayıp iletebilirsiniz.',
  }
}

export function previewLocalInvite(token) {
  const store = loadStore()
  const invite = store.invites.find((row) => row.token === token)
  if (!invite) {
    const err = new Error('Davet bulunamadı veya süresi doldu')
    err.code = 'INVALID_TOKEN'
    throw err
  }
  if (invite.consumedAt) {
    const err = new Error('Bu davet zaten kullanıldı')
    err.code = 'INVITE_USED'
    throw err
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    const err = new Error('Davet bağlantısının süresi doldu')
    err.code = 'EXPIRED'
    throw err
  }
  const user = store.users.find((row) => row.id === invite.accountId)
  return {
    email: invite.email,
    fullName: user?.fullName || '',
    companyName: companyName(),
    jobTitle: user?.jobTitle || '',
    requiresPassword: !user?.passwordHash,
    modules: APP_MODULES.filter((mod) => (user?.modulePermissions?.[mod.code] || 'none') !== 'none').map(
      (mod) => ({
        ...mod,
        level: user.modulePermissions[mod.code],
      }),
    ),
  }
}

export async function acceptLocalInvite({ token, password, fullName }) {
  const store = loadStore()
  const invite = store.invites.find((row) => row.token === token)
  if (!invite || invite.consumedAt || new Date(invite.expiresAt).getTime() < Date.now()) {
    throw new Error('Geçersiz veya süresi dolmuş davet')
  }
  const user = store.users.find((row) => row.id === invite.accountId)
  if (!user) throw new Error('Kullanıcı bulunamadı')
  if (!user.passwordHash) {
    if (String(password || '').length < 8) throw new Error('Şifre en az 8 karakter olmalı')
    user.passwordHash = await sha256(password)
  }
  if (fullName) user.fullName = String(fullName).trim()
  user.inviteStatus = 'accepted'
  user.acceptedAt = nowIso()
  invite.consumedAt = nowIso()
  saveStore(store)
  const publicUser = publicTeamUser(user)
  const sessionToken = `local-team:${user.id}`
  persistSession({ token: sessionToken, user: publicUser })
  return { ok: true, user: publicUser, token: sessionToken }
}

export async function loginLocalTeam({ email, password }) {
  const store = loadStore()
  const user = store.users.find((row) => row.email === normalizeEmail(email))
  if (!user || !user.passwordHash) {
    const err = new Error('E-posta veya şifre hatalı')
    err.code = 'INVALID_CREDENTIALS'
    throw err
  }
  if (user.inviteStatus === 'pending') {
    throw new Error('Daveti henüz onaylamadınız. E-postanızdaki bağlantıyı kullanın.')
  }
  if (user.inviteStatus === 'suspended') {
    throw new Error('Hesabınız askıya alındı. Yönetici ile iletişime geçin.')
  }
  const hash = await sha256(password)
  if (hash !== user.passwordHash) {
    const err = new Error('E-posta veya şifre hatalı')
    err.code = 'INVALID_CREDENTIALS'
    throw err
  }
  user.lastLoginAt = nowIso()
  saveStore(store)
  const publicUser = publicTeamUser(user)
  const sessionToken = `local-team:${user.id}`
  persistSession({ token: sessionToken, user: publicUser })
  return { user: publicUser, token: sessionToken }
}

export function updateLocalTeamUser({ accountId, modulePermissions, inviteStatus, fullName, phone, jobTitle }) {
  const store = loadStore()
  const user = store.users.find((row) => row.id === accountId)
  if (!user) throw new Error('Kullanıcı bulunamadı')
  if (modulePermissions) {
    user.modulePermissions = { ...emptyModulePermissions('none'), ...modulePermissions }
    user.accessLevel = deriveAccessLevelFromPermissions(user.modulePermissions)
  }
  if (inviteStatus === 'suspended' || inviteStatus === 'accepted' || inviteStatus === 'pending') {
    user.inviteStatus = inviteStatus
  }
  if (fullName) user.fullName = String(fullName).trim()
  if (phone !== undefined) user.phone = String(phone || '').trim()
  if (jobTitle !== undefined) user.jobTitle = String(jobTitle || '').trim()
  saveStore(store)
  return listLocalTeamUsers()
}

export function resendLocalTeamInvite(accountId) {
  const store = loadStore()
  const user = store.users.find((row) => row.id === accountId)
  if (!user) throw new Error('Kullanıcı bulunamadı')
  const token = newId('inv')
  store.invites = store.invites.filter((row) => row.accountId !== accountId || row.consumedAt)
  const invite = {
    id: newId('tinv'),
    token,
    accountId,
    email: user.email,
    url: inviteUrlFor(token),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    consumedAt: null,
  }
  store.invites.unshift(invite)
  user.inviteStatus = 'pending'
  user.acceptedAt = null
  saveStore(store)
  return { users: listLocalTeamUsers(), inviteUrl: invite.url, mailStatus: 'local_link' }
}

export function removeLocalTeamUser(accountId) {
  const store = loadStore()
  store.users = store.users.filter((row) => row.id !== accountId)
  store.invites = store.invites.filter((row) => row.accountId !== accountId)
  saveStore(store)
  return listLocalTeamUsers()
}

export function getLocalTeamUserByToken(sessionToken) {
  if (!String(sessionToken || '').startsWith('local-team:')) return null
  const id = String(sessionToken).slice('local-team:'.length)
  const store = loadStore()
  const user = store.users.find((row) => row.id === id)
  if (!user || user.inviteStatus !== 'accepted') return null
  return publicTeamUser(user)
}
