const COMPANY_SETTINGS_KEY = 'erlenbox-company-settings'

export const defaultCompanySettings = {
  companyName: 'Erlenbox',
  legalTitle: 'Erlenbox Ambalaj San. ve Tic. Ltd. Şti.',
  taxOffice: 'Kadıköy',
  taxNumber: '1234567890',
  address: 'Bağdat Cad. No: 120, Kadıköy / İstanbul',
  phone: '+90 212 555 00 00',
  email: 'info@erlenbox.com',
  website: 'www.erlenbox.com',
  logoDataUrl: '',
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'İş Bankası',
      branch: 'Kadıköy',
      iban: 'TR64 0006 4000 0011 2345 6789 01',
      label: 'Ticari Hesap',
    },
    {
      id: 'bank-2',
      bankName: 'Garanti BBVA',
      branch: 'Merkez',
      iban: 'TR12 0006 2000 1234 0006 7890 12',
      label: 'Tahsilat Hesabı',
    },
  ],
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
