const META_KEY = 'bach_smc_meta_app_v1'
const ACCOUNTS_KEY = 'bach_smc_ig_accounts_v1'

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('bach:smc-meta'))
}

export function readLocalMetaApp() {
  return read(META_KEY, null)
}

export function saveLocalMetaApp({ appId, appSecret, redirectUri }) {
  const next = {
    appId: String(appId || '').trim(),
    appSecret: String(appSecret || '').trim(),
    redirectUri: String(redirectUri || '').trim(),
    savedAt: new Date().toISOString(),
  }
  write(META_KEY, next)
  return next
}

export function clearLocalMetaApp() {
  localStorage.removeItem(META_KEY)
  window.dispatchEvent(new CustomEvent('bach:smc-meta'))
}

export function readLocalIgAccounts() {
  return read(ACCOUNTS_KEY, { items: [] }).items || []
}

export function saveLocalIgAccount(account) {
  const items = [account, ...readLocalIgAccounts().filter((a) => a.id !== account.id)]
  write(ACCOUNTS_KEY, { items })
  return account
}

export function clearLocalIgAccounts() {
  write(ACCOUNTS_KEY, { items: [] })
}

export function defaultCrmRedirectUri() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/api/social/oauth/callback`
}
