import { getCustomerProfiles } from '../data/customerProfiles'
import { createSupplierPurchaseInvoice } from './treasuryStore'

export const INCOMING_E_INVOICES_KEY = 'erlenbox-incoming-e-invoices'
export const INCOMING_E_INVOICES_EVENT = 'erlenbox:incoming-e-invoices-updated'

function notify() {
  window.dispatchEvent(new CustomEvent(INCOMING_E_INVOICES_EVENT))
}

function normalizeInvoice(raw) {
  if (!raw || typeof raw !== 'object') return null
  const amount = Number(raw.amount) || 0
  const net = Number(raw.net) || Math.round((amount / 1.2) * 100) / 100
  const vat = Number(raw.vat) || Math.round((amount - net) * 100) / 100
  return {
    id: raw.id || `IN-${Date.now()}`,
    supplier: raw.supplier || 'Tedarikçi',
    supplierTitle: raw.supplierTitle || raw.supplier || 'Tedarikçi',
    supplierAddress: raw.supplierAddress || '',
    supplierTaxOffice: raw.supplierTaxOffice || '',
    supplierTaxId: raw.supplierTaxId || '',
    buyer: raw.buyer || '',
    buyerAddress: raw.buyerAddress || '',
    buyerTaxOffice: raw.buyerTaxOffice || '',
    buyerTaxId: raw.buyerTaxId || '',
    invoiceNo: raw.invoiceNo || raw.id || '',
    date: raw.date || '',
    amount,
    net,
    vat,
    status: raw.status || 'Bekliyor',
    acceptanceLabel:
      raw.acceptanceLabel ||
      (raw.status === 'Onaylandı' || raw.status === 'Kabul Edildi'
        ? 'KABUL EDİLDİ(TEMEL)'
        : 'BEKLİYOR'),
    scenario: raw.scenario || 'TEMELFATURA',
    invoiceType: raw.invoiceType || 'SATIŞ',
    customizationNo: raw.customizationNo || 'TR1.2',
    paymentTerms: raw.paymentTerms || 'PEŞİN',
    ettn: raw.ettn || '',
    imported: Boolean(raw.imported),
    importedAt: raw.importedAt || '',
    treasuryMovementId: raw.treasuryMovementId || '',
    supplierId: raw.supplierId || '',
    note: raw.note || '',
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    lines: Array.isArray(raw.lines) ? raw.lines : [],
  }
}

export function readIncomingEInvoices() {
  try {
    const saved = JSON.parse(localStorage.getItem(INCOMING_E_INVOICES_KEY) || '[]')
    if (!Array.isArray(saved)) return []
    return saved.map((item) => normalizeInvoice(item)).filter(Boolean)
  } catch {
    return []
  }
}

export function saveIncomingEInvoices(items) {
  localStorage.setItem(INCOMING_E_INVOICES_KEY, JSON.stringify(items))
  notify()
  return items
}

export function getIncomingEInvoiceById(id) {
  return readIncomingEInvoices().find((item) => item.id === id) || null
}

export function updateIncomingEInvoice(id, patch) {
  const items = readIncomingEInvoices()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return null
  const next = { ...items[index], ...patch }
  items[index] = next
  saveIncomingEInvoices(items)
  return next
}

export function findSupplierForInvoice(invoice) {
  const name = String(invoice?.supplier || invoice?.supplierTitle || '')
    .toLocaleLowerCase('tr-TR')
    .trim()
  if (!name) return null
  return (
    getCustomerProfiles().find((profile) => {
      const company = String(profile.company || '').toLocaleLowerCase('tr-TR')
      const title = String(profile.companyTitle || '').toLocaleLowerCase('tr-TR')
      return (
        company.includes(name) ||
        name.includes(company) ||
        title.includes(name) ||
        name.includes(title)
      )
    }) || null
  )
}

/**
 * Gelen e-faturayı cariye işler: tedarikçi alacaklı (biz borçlu) olacak şekilde Alış Faturası hareketi.
 */
export function importIncomingEInvoiceToLedger(invoiceId, { supplierId, supplierName } = {}) {
  const invoice = getIncomingEInvoiceById(invoiceId)
  if (!invoice) return { ok: false, error: 'Fatura bulunamadı.' }
  if (invoice.imported) return { ok: false, error: 'Bu fatura zaten içeri alındı.', invoice }

  const matched = supplierId
    ? getCustomerProfiles().find((profile) => profile.id === supplierId)
    : findSupplierForInvoice(invoice)
  const partyName = supplierName || matched?.company || invoice.supplier
  const partyId = matched?.id || supplierId || ''

  const movement = createSupplierPurchaseInvoice({
    customerName: partyName,
    customerId: partyId,
    amount: invoice.amount,
    docNo: invoice.invoiceNo,
    date: invoice.date,
    description: `Gelen e-fatura ${invoice.invoiceNo} · ${partyName}`,
  })

  if (!movement) return { ok: false, error: 'Cari hareket oluşturulamadı.' }

  const updated = updateIncomingEInvoice(invoiceId, {
    imported: true,
    importedAt: new Date().toISOString(),
    treasuryMovementId: movement.id,
    supplierId: partyId,
    status: 'İçeri Alındı',
    acceptanceLabel: 'İÇERİ ALINDI',
  })

  return { ok: true, invoice: updated, movement, supplier: matched }
}

export function formatInvoiceDisplayDate(value) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}/.trim?.()) {
    /* noop for older engines */
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-')
    const months = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ]
    return `${Number(d)} ${months[Number(m) - 1]} ${y}`
  }
  return value
}

export function formatInvoiceDocDate(value) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-')
    return `${d}-${m}-${y}`
  }
  return value
}
