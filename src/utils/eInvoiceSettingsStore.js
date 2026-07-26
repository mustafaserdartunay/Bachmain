const STORAGE_KEY = 'bach-einvoice-settings'
export const EINVOICE_SETTINGS_EVENT = 'bach:einvoice-settings-updated'

export const defaultEInvoiceSettings = {
  enabled: true,
  /** GİB entegratör / API */
  gibApiMode: 'demo', // demo | live
  gibEndpoint: 'https://efatura.gib.gov.tr',
  gibUsername: '',
  gibPassword: '',
  gibAlias: '',
  senderVkn: '',
  senderTitle: '',
  /** Varsayılan belge türü (müşteride kayıt yoksa) */
  defaultInvoiceKind: 'e-fatura', // e-fatura | e-arsiv
  eFaturaSeries: 'ABC',
  eArsivSeries: 'EAR',
  /** Müşteri e-posta takip */
  emailTrackingEnabled: true,
  emailFrom: '',
  emailSubjectTemplate: 'Faturanız — {invoiceNo}',
  simulateLivePipeline: true,
  /** Demo pipeline süreleri (ms) */
  gibSendingMs: 800,
  gibPendingMs: 2200,
  gibSentMs: 3800,
  emailQueuedMs: 4200,
  emailInTransitMs: 5600,
  emailDeliveredMs: 7200,
  emailOpenedMs: 9800,
}

function readJson() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { ...defaultEInvoiceSettings }
    const parsed = JSON.parse(saved)
    return { ...defaultEInvoiceSettings, ...parsed }
  } catch {
    return { ...defaultEInvoiceSettings }
  }
}

export function readEInvoiceSettings() {
  return readJson()
}

export function saveEInvoiceSettings(settings) {
  const next = {
    ...defaultEInvoiceSettings,
    ...settings,
    gibSendingMs: Number(settings.gibSendingMs) || defaultEInvoiceSettings.gibSendingMs,
    gibPendingMs: Number(settings.gibPendingMs) || defaultEInvoiceSettings.gibPendingMs,
    gibSentMs: Number(settings.gibSentMs) || defaultEInvoiceSettings.gibSentMs,
    emailQueuedMs: Number(settings.emailQueuedMs) || defaultEInvoiceSettings.emailQueuedMs,
    emailInTransitMs: Number(settings.emailInTransitMs) || defaultEInvoiceSettings.emailInTransitMs,
    emailDeliveredMs: Number(settings.emailDeliveredMs) || defaultEInvoiceSettings.emailDeliveredMs,
    emailOpenedMs: Number(settings.emailOpenedMs) || defaultEInvoiceSettings.emailOpenedMs,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EINVOICE_SETTINGS_EVENT))
  return next
}

export function updateEInvoiceSettings(partial) {
  return saveEInvoiceSettings({ ...readEInvoiceSettings(), ...partial })
}

/** Müşteri kaydındaki e-fatura / e-arşiv türünü çözümler */
export function resolveCustomerInvoiceKind(customer, settings = readEInvoiceSettings()) {
  const recorded = String(customer?.eInvoiceType || customer?.invoiceKind || '').toLowerCase()
  if (recorded === 'e-arsiv' || recorded === 'earsiv' || recorded === 'e_arsiv') return 'e-arsiv'
  if (recorded === 'e-fatura' || recorded === 'efatura' || recorded === 'e_fatura')
    return 'e-fatura'
  return settings.defaultInvoiceKind === 'e-arsiv' ? 'e-arsiv' : 'e-fatura'
}

export function invoiceKindIssueLabel(kind) {
  return kind === 'e-arsiv' ? 'e-Arşiv Kes' : 'e-Fatura Kes'
}

export function invoiceKindTitle(kind) {
  return kind === 'e-arsiv' ? 'e-Arşiv' : 'e-Fatura'
}
