/**
 * e-Fatura / GİB bağlantı ayarları.
 * Gerçek entegrasyon FS-2’de; şimdilik “bağlı” demo durumu.
 */

export const E_INVOICE_CONNECTION_KEY = 'bach-einvoice-connection'
export const E_INVOICE_CONNECTION_EVENT = 'bach:einvoice-connection-updated'

const DEFAULT_CONNECTION = {
  connected: true,
  demoMode: true,
  provider: 'GİB',
  channel: 'Entegratör (demo)',
  gibAlias: 'urn:mail:defaultpk@efatura.gov.tr',
  vkn: '9876543210',
  title: 'WAGON AMBALAJ GIDA TEKSTİL İNŞ. SAN. VE TİCARET LTD. ŞTİ.',
  inboxEnabled: true,
  lastSyncAt: '2026-07-26T08:15:00.000Z',
  statusLabel: 'Bağlantı aktif',
}

function readRaw() {
  try {
    const raw = JSON.parse(localStorage.getItem(E_INVOICE_CONNECTION_KEY) || 'null')
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONNECTION }
    return { ...DEFAULT_CONNECTION, ...raw }
  } catch {
    return { ...DEFAULT_CONNECTION }
  }
}

export function getEInvoiceConnection() {
  const current = readRaw()
  if (!localStorage.getItem(E_INVOICE_CONNECTION_KEY)) {
    localStorage.setItem(E_INVOICE_CONNECTION_KEY, JSON.stringify(current))
  }
  return current
}

export function saveEInvoiceConnection(patch) {
  const next = { ...getEInvoiceConnection(), ...patch, updatedAt: new Date().toISOString() }
  localStorage.setItem(E_INVOICE_CONNECTION_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(E_INVOICE_CONNECTION_EVENT))
  return next
}

export function formatEInvoiceSyncLabel(iso = getEInvoiceConnection().lastSyncAt) {
  if (!iso) return '—'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}
