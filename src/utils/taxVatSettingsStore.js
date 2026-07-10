const STORAGE_KEY = 'bach-tax-vat-settings'
export const TAX_VAT_SETTINGS_EVENT = 'bach:tax-vat-settings-updated'

export const defaultTaxVatSettings = {
  defaultVatRate: 20,
  incomeTaxRate: 25,
  vatRates: [1, 10, 20],
  incomeTaxBrackets: [
    { id: 'bracket-default', upTo: null, rate: 25 },
  ],
}

function normalizeBrackets(brackets, fallbackRate) {
  const source = Array.isArray(brackets) && brackets.length
    ? brackets
    : [{ upTo: null, rate: fallbackRate }]

  return source
    .map((bracket, index) => ({
      id: bracket.id || `bracket-${index}`,
      upTo: bracket.upTo === '' || bracket.upTo == null ? null : Number(bracket.upTo),
      rate: Number(bracket.rate) || 0,
    }))
    .filter((bracket) => bracket.rate >= 0)
}

function readJson() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { ...defaultTaxVatSettings }
    const parsed = JSON.parse(saved)
    const incomeTaxRate = Number(parsed.incomeTaxRate)
    return {
      ...defaultTaxVatSettings,
      ...parsed,
      defaultVatRate: Number(parsed.defaultVatRate) || defaultTaxVatSettings.defaultVatRate,
      incomeTaxRate: Number.isFinite(incomeTaxRate) ? incomeTaxRate : defaultTaxVatSettings.incomeTaxRate,
      vatRates: Array.isArray(parsed.vatRates) && parsed.vatRates.length
        ? parsed.vatRates.map((rate) => Number(rate)).filter((rate) => rate >= 0)
        : [...defaultTaxVatSettings.vatRates],
      incomeTaxBrackets: normalizeBrackets(parsed.incomeTaxBrackets, incomeTaxRate || defaultTaxVatSettings.incomeTaxRate),
    }
  } catch {
    return { ...defaultTaxVatSettings }
  }
}

export function readTaxVatSettings() {
  return readJson()
}

export function saveTaxVatSettings(settings) {
  const next = {
    ...defaultTaxVatSettings,
    ...settings,
    defaultVatRate: Number(settings.defaultVatRate) || defaultTaxVatSettings.defaultVatRate,
    incomeTaxRate: Number(settings.incomeTaxRate) || defaultTaxVatSettings.incomeTaxRate,
    vatRates: (settings.vatRates || defaultTaxVatSettings.vatRates)
      .map((rate) => Number(rate))
      .filter((rate) => rate >= 0),
    incomeTaxBrackets: normalizeBrackets(settings.incomeTaxBrackets, settings.incomeTaxRate),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(TAX_VAT_SETTINGS_EVENT))
  return next
}

export function splitGrossAmount(gross, vatRatePercent = defaultTaxVatSettings.defaultVatRate) {
  const total = Number(gross) || 0
  if (total <= 0) return { net: 0, vat: 0, total: 0 }
  const rate = Math.max(0, Number(vatRatePercent) || 0) / 100
  const net = rate > 0 ? total / (1 + rate) : total
  const vat = total - net
  return { net, vat, total }
}

export function calculateIncomeTax(taxableBase, settings = readTaxVatSettings()) {
  const base = Math.max(0, Number(taxableBase) || 0)
  if (base <= 0) return 0

  const brackets = settings.incomeTaxBrackets?.length
    ? settings.incomeTaxBrackets
    : [{ upTo: null, rate: settings.incomeTaxRate }]

  let remaining = base
  let tax = 0
  let previousLimit = 0

  brackets.forEach((bracket) => {
    if (remaining <= 0) return
    const upper = bracket.upTo == null ? Infinity : Number(bracket.upTo)
    const sliceLimit = Math.max(0, upper - previousLimit)
    const slice = Math.min(remaining, sliceLimit)
    tax += slice * ((Number(bracket.rate) || 0) / 100)
    remaining -= slice
    previousLimit = upper
  })

  return tax
}

export function buildTaxDashboardSummary(issued, supplier, settings = readTaxVatSettings()) {
  const issuedVat = Number(issued?.vat) || 0
  const supplierVat = Number(supplier?.vat) || 0
  const issuedNet = Number(issued?.net) || 0
  const supplierNet = Number(supplier?.net) || 0
  const taxableBase = Math.max(0, issuedNet - supplierNet)

  return {
    payableVat: Math.max(0, issuedVat - supplierVat),
    incomeTax: calculateIncomeTax(taxableBase, settings),
    taxableBase,
  }
}

export function createIncomeTaxBracket(partial = {}) {
  return {
    id: `bracket-${Date.now()}`,
    upTo: partial.upTo ?? null,
    rate: partial.rate ?? 25,
  }
}
