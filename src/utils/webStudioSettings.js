const PROFILE_KEY = 'bach-web-store-profile'
const PAYMENT_KEY = 'bach-web-payment-settings'
const PROFILE_EVENT = 'bach:web-store-profile-updated'
const PAYMENT_EVENT = 'bach:web-payment-updated'

const DEFAULT_PROFILE = {
  name: '',
  slogan: 'More Than a Gift',
  logoUrl: '',
  email: '',
  phone: '',
  address: '',
  about: '',
  legalTerms: '',
  legalPrivacy: '',
  instagramUrl: '',
}

const DEFAULT_PAYMENT = {
  iyzicoEnabled: false,
  iyzicoSandbox: true,
  iyzicoApiKey: '',
  iyzicoSecret: '',
  havaleEnabled: true,
  bankName: '',
  iban: '',
  accountHolder: '',
  transferNoteTemplate: 'BM-{number}',
}

function readObject(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { ...fallback }
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : { ...fallback }
  } catch {
    return { ...fallback }
  }
}

function writeObject(key, value, eventName) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(eventName))
}

export function getWebStoreProfile() {
  return readObject(PROFILE_KEY, DEFAULT_PROFILE)
}

export function saveWebStoreProfile(patch) {
  const next = {
    ...getWebStoreProfile(),
    ...patch,
    name: String(patch.name ?? getWebStoreProfile().name).trim(),
    slogan: String(patch.slogan ?? getWebStoreProfile().slogan).trim(),
    updatedAt: new Date().toISOString(),
  }
  writeObject(PROFILE_KEY, next, PROFILE_EVENT)
  return next
}

export function getWebPaymentSettings() {
  return readObject(PAYMENT_KEY, DEFAULT_PAYMENT)
}

export function saveWebPaymentSettings(patch) {
  const current = getWebPaymentSettings()
  const next = {
    ...current,
    ...patch,
    iyzicoApiKey: String(patch.iyzicoApiKey ?? current.iyzicoApiKey).trim(),
    iyzicoSecret: String(patch.iyzicoSecret ?? current.iyzicoSecret).trim(),
    bankName: String(patch.bankName ?? current.bankName).trim(),
    iban: String(patch.iban ?? current.iban).replace(/\s+/g, '').toUpperCase(),
    accountHolder: String(patch.accountHolder ?? current.accountHolder).trim(),
    transferNoteTemplate: String(patch.transferNoteTemplate ?? current.transferNoteTemplate).trim() || 'BM-{number}',
    updatedAt: new Date().toISOString(),
  }
  writeObject(PAYMENT_KEY, next, PAYMENT_EVENT)
  return next
}

export function isIyzicoReady(settings = getWebPaymentSettings()) {
  return Boolean(settings.iyzicoEnabled && settings.iyzicoApiKey && settings.iyzicoSecret)
}

export function isHavaleReady(settings = getWebPaymentSettings()) {
  return Boolean(settings.havaleEnabled && settings.iban)
}

export { PROFILE_EVENT as WEB_STORE_PROFILE_EVENT, PAYMENT_EVENT as WEB_PAYMENT_EVENT }
