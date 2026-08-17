import { readUserProfile } from './userProfile'

const COMPANY_SETTINGS_KEY = 'erlenbox-company-settings'

export const defaultCompanySettings = {
  companyName: '',
  legalTitle: '',
  taxOffice: '',
  taxNumber: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logoDataUrl: '',
  bankAccounts: [],
}

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return { ...fallback, ...parsed, bankAccounts: parsed.bankAccounts?.length ? parsed.bankAccounts : fallback.bankAccounts }
  } catch {
    return fallback
  }
}

export function readCompanySettings() {
  return readJson(COMPANY_SETTINGS_KEY, defaultCompanySettings)
}

/** Teklif / belge şablonları: logo PNG-JPG data URL, firma detayı. Profil görseli yedek. */
export function resolveCompanyBrand() {
  const company = readCompanySettings()
  const profile = readUserProfile() || {}
  const logo = String(company.logoDataUrl || profile.avatarDataUrl || '').trim()
  return {
    ...company,
    companyName: company.companyName || profile.companyName || '',
    legalTitle: company.legalTitle || company.companyName || profile.companyName || '',
    phone: company.phone || profile.phone || '',
    email: company.email || profile.email || '',
    logoDataUrl: logo,
  }
}

export function saveCompanySettings(settings) {
  localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent('erlenbox:company-settings-updated'))
}

export function updateCompanySettings(partial) {
  const next = { ...readCompanySettings(), ...partial }
  saveCompanySettings(next)
  return next
}

export function createBankAccount(partial = {}) {
  return {
    id: `bank-${Date.now()}`,
    bankName: '',
    branch: '',
    iban: '',
    label: 'Yeni Hesap',
    ...partial,
  }
}
