const STORAGE_KEY = 'bach-doc-print-settings'
export const DOC_PRINT_SETTINGS_EVENT = 'bach:doc-print-settings-updated'

export const defaultQuotePrintSettings = {
  showCompany: true,
  showLogo: true,
  showCustomer: true,
  showDates: true,
  showProductImages: true,
  productImageSize: 140,
  showTerms: true,
  showBanks: true,
  showTotals: true,
  showRepresentative: true,
}

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(DOC_PRINT_SETTINGS_EVENT))
  return next
}

export function readQuotePrintSettings() {
  const saved = readAll().quote || {}
  return { ...defaultQuotePrintSettings, ...saved }
}

export function saveQuotePrintSettings(partial = {}) {
  const next = writeAll({
    ...readAll(),
    quote: { ...readQuotePrintSettings(), ...partial },
  })
  return next.quote
}
