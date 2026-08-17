import { readUserProfile } from './userProfile'

const COMPANY_SETTINGS_KEY = 'erlenbox-company-settings'

/** Teklif / yazdırma çıktısı firma logosu — önceki 96px ölçüsünün 4 katı */
export const QUOTE_PRINT_LOGO_SIZE_PX = 384
export const QUOTE_PRINT_LOGO_SIZE_LABEL = `${QUOTE_PRINT_LOGO_SIZE_PX} × ${QUOTE_PRINT_LOGO_SIZE_PX} px`

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

/** Yüklenen görseli teklif yazdırma logosu ölçüsüne (contain) sığdırır. */
export function readImageFileAsPrintLogoDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Dosya seçilmedi'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Görsel okunamadı'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Görsel yüklenemedi'))
      img.onload = () => {
        const size = QUOTE_PRINT_LOGO_SIZE_PX
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(String(reader.result || ''))
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        const scale = Math.min(size / img.width, size / img.height)
        const width = img.width * scale
        const height = img.height * scale
        ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
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
