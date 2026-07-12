const USER_PROFILE_KEY = 'erlenbox-user-profile'
const TENANT_REGISTRY_KEY = 'erlenbox-tenant-registry'

function generateTenantCode() {
  return String(Math.floor(10000 + Math.random() * 90000))
}

function isValidTenantCode(code) {
  return /^\d{5}$/.test(String(code || ''))
}

function isCodeTaken(code, registry) {
  return registry.some((entry) => entry.tenantCode === code)
}

function createUniqueTenantCode(registry) {
  let code = generateTenantCode()
  let attempts = 0
  while (isCodeTaken(code, registry) && attempts < 50) {
    code = generateTenantCode()
    attempts += 1
  }
  return code
}

export const defaultUserProfile = {
  displayName: '',
  companyName: '',
  email: '',
  phone: '',
  title: '',
  avatarDataUrl: '',
  tenantCode: '',
  createdAt: '',
}

function readRegistry() {
  try {
    const saved = localStorage.getItem(TENANT_REGISTRY_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRegistry(registry) {
  localStorage.setItem(TENANT_REGISTRY_KEY, JSON.stringify(registry))
}

function registerTenant(profile) {
  if (!profile.tenantCode) return
  const registry = readRegistry()
  const existingIndex = registry.findIndex((entry) => entry.tenantCode === profile.tenantCode)
  const entry = {
    tenantCode: profile.tenantCode,
    displayName: profile.displayName,
    companyName: profile.companyName,
    email: profile.email,
    phone: profile.phone,
    registeredAt: profile.createdAt || new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  }
  if (existingIndex >= 0) {
    registry[existingIndex] = { ...registry[existingIndex], ...entry }
  } else {
    registry.unshift(entry)
  }
  writeRegistry(registry)
}

export function readUserProfile() {
  try {
    const saved = localStorage.getItem(USER_PROFILE_KEY)
    if (!saved) return null
    return JSON.parse(saved)
  } catch {
    return null
  }
}

export function saveUserProfile(profile) {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
  registerTenant(profile)
  window.dispatchEvent(new CustomEvent('erlenbox:user-profile-updated'))
  return profile
}

export function ensureUserProfile() {
  const existing = readUserProfile()
  if (existing?.tenantCode && isValidTenantCode(existing.tenantCode)) {
    registerTenant(existing)
    return existing
  }

  const registry = readRegistry()
  const tenantCode = createUniqueTenantCode(registry)
  const profile = {
    ...(existing || defaultUserProfile),
    tenantCode,
    createdAt: existing?.createdAt || new Date().toISOString(),
  }
  return saveUserProfile(profile)
}

export function readTenantRegistry() {
  return readRegistry()
}

export function updateUserProfile(partial) {
  const current = ensureUserProfile()
  return saveUserProfile({ ...current, ...partial })
}

export function getLoggedInUserDisplayName() {
  return ensureUserProfile().displayName?.trim() || 'Kullanıcı'
}
