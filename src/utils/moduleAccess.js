import {
  APP_MODULE_CODES,
  emptyModulePermissions,
  PATH_MODULE_PREFIXES,
} from '../data/appModules'

const OPEN_PATHS = new Set([
  '/profil',
  '/profil/paketim',
  '/profil/paket-satin-al',
  '/profil/odeme',
  '/paketler',
  '/hesap/lisans',
  '/deneme-bitti',
  '/kurulum',
  '/giris',
  '/kayit',
  '/davet',
  '/sifremi-unuttum',
  '/sifre-sifirla',
  '/eposta-dogrula',
  '/surum',
  '/versiyon',
  '/duyurular',
  '/egitim',
])

export function isOwnerUser(user) {
  if (!user) return false
  if (user.canManageUsers === true) return true
  if (user.accountKind === 'team_member') return false
  const level = String(user.accessLevel || user.role || '').toLowerCase()
  return level === 'owner' || user.id === 'local-dev'
}

export function normalizeModuleLevel(value) {
  const level = String(value || '').toLowerCase()
  if (level === 'edit' || level === 'editor' || level === 'write' || level === 'admin') return 'edit'
  if (level === 'view' || level === 'viewer' || level === 'read') return 'view'
  return 'none'
}

export function readModulePermissions(user) {
  const raw = user?.modulePermissions
  if (!raw || typeof raw !== 'object') return null
  const out = emptyModulePermissions('none')
  for (const code of APP_MODULE_CODES) {
    out[code] = normalizeModuleLevel(raw[code])
  }
  return out
}

export function moduleCodeForPath(pathname) {
  const path = String(pathname || '/')
  if (OPEN_PATHS.has(path) || path.startsWith('/profil')) return null
  for (const [prefix, code] of PATH_MODULE_PREFIXES) {
    if (prefix === '/') {
      if (path === '/') return code
      continue
    }
    if (path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix)) return code
  }
  return null
}

export function moduleLevelFor(user, code) {
  if (!code) return 'edit'
  if (code === 'team_users') return isOwnerUser(user) ? 'edit' : 'none'
  if (isOwnerUser(user)) return 'edit'
  const map = readModulePermissions(user)
  if (!map) return 'edit'
  return map[code] || 'none'
}

export function canViewModule(user, code) {
  if (!code) return true
  return moduleLevelFor(user, code) !== 'none'
}

export function canEditModule(user, code) {
  if (!code) return true
  return moduleLevelFor(user, code) === 'edit'
}

export function canViewPath(user, pathname) {
  const path = String(pathname || '/')
  if (OPEN_PATHS.has(path) || path.startsWith('/profil')) return true
  const code = moduleCodeForPath(path)
  if (!code) return true
  return canViewModule(user, code)
}

export function canEditPath(user, pathname) {
  const path = String(pathname || '/')
  if (OPEN_PATHS.has(path) || path.startsWith('/profil')) return true
  const code = moduleCodeForPath(path)
  if (!code) return true
  return canEditModule(user, code)
}

export function filterByModuleAccess(items, user) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => {
    if (item.adminOnly) return isOwnerUser(user)
    if (item.moduleCode) return canViewModule(user, item.moduleCode)
    if (item.path) return canViewPath(user, item.path)
    if (item.to) return canViewPath(user, item.to)
    return true
  })
}

export function deriveAccessLevelFromPermissions(permissions) {
  const values = Object.values(permissions || {})
  if (values.some((level) => normalizeModuleLevel(level) === 'edit')) return 'editor'
  if (values.some((level) => normalizeModuleLevel(level) === 'view')) return 'viewer'
  return 'viewer'
}

export function ownerModulePermissions() {
  return emptyModulePermissions('edit')
}
