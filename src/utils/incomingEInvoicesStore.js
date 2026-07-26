import { getCustomerProfiles } from '../data/customerProfiles'
import { createSupplierPurchaseInvoice } from './treasuryStore'

export const INCOMING_E_INVOICES_KEY = 'erlenbox-incoming-e-invoices'
export const INCOMING_E_INVOICES_EVENT = 'erlenbox:incoming-e-invoices-updated'

const SEED = [
  {
    id: 'IN-1',
    supplier: 'Kağıt Ambalaj Ltd.',
    supplierTitle: 'KAĞIT AMBALAJ SAN. VE TİC. LTD. ŞTİ.',
    supplierAddress: 'Organize Sanayi Bölgesi 12. Cad. No:8 İstanbul',
    supplierTaxOffice: 'İstanbul',
    supplierTaxId: '1234567890',
    buyer: 'WAGON AMBALAJ GIDA TEKSTİL İNŞ. SAN. VE TİCARET LTD. ŞTİ.',
    buyerAddress: 'Merkez Mah. Ambalaj Cad. No:15 İstanbul',
    buyerTaxOffice: 'İstanbul',
    buyerTaxId: '9876543210',
    invoiceNo: 'GB0202600000012',
    date: '2026-06-10',
    amount: 12450,
    net: 10375,
    vat: 2075,
    status: 'Kabul Edildi',
    acceptanceLabel: 'KABUL EDİLDİ(TEMEL)',
    scenario: 'TEMELFATURA',
    invoiceType: 'SATIŞ',
    customizationNo: 'TR1.2',
    paymentTerms: 'PEŞİN',
    ettn: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    imported: false,
    importedAt: '',
    treasuryMovementId: '',
    supplierId: '',
    note: '',
    notes: [],
    lines: [
      {
        id: 'L1',
        code: 'KRAFT-01',
        description: 'Kraft kutu 30x20x15',
        quantity: 500,
        unit: 'Adet',
        unitPrice: 18.5,
        vatRate: 20,
        amount: 9250,
      },
      {
        id: 'L2',
        code: 'BANT-02',
        description: 'Koli bandı 48mm',
        quantity: 50,
        unit: 'Adet',
        unitPrice: 22.5,
        vatRate: 20,
        amount: 1125,
      },
    ],
  },
  {
    id: 'IN-2',
    supplier: 'Baskı Mürekkep A.Ş.',
    supplierTitle: 'BASKI MÜREKKEP A.Ş.',
    supplierAddress: 'Kimya Sanayi Sit. A Blok No:4 İzmir',
    supplierTaxOffice: 'İzmir',
    supplierTaxId: '5554443332',
    buyer: 'WAGON AMBALAJ GIDA TEKSTİL İNŞ. SAN. VE TİCARET LTD. ŞTİ.',
    buyerAddress: 'Merkez Mah. Ambalaj Cad. No:15 İstanbul',
    buyerTaxOffice: 'İstanbul',
    buyerTaxId: '9876543210',
    invoiceNo: 'GB0202600000008',
    date: '2026-06-05',
    amount: 3200,
    net: 2666.67,
    vat: 533.33,
    status: 'Bekliyor',
    acceptanceLabel: 'BEKLİYOR',
    scenario: 'TEMELFATURA',
    invoiceType: 'SATIŞ',
    customizationNo: 'TR1.2',
    paymentTerms: '30 GÜN',
    ettn: 'B2C3D4E5-F6A7-8901-BCDE-F12345678901',
    imported: false,
    importedAt: '',
    treasuryMovementId: '',
    supplierId: '',
    note: '',
    notes: [],
    lines: [
      {
        id: 'L1',
        code: 'INK-CMYK',
        description: 'CMYK baskı mürekkebi seti',
        quantity: 4,
        unit: 'Takım',
        unitPrice: 666.67,
        vatRate: 20,
        amount: 2666.68,
      },
    ],
  },
]

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
    if (!Array.isArray(saved) || saved.length === 0) {
      localStorage.setItem(INCOMING_E_INVOICES_KEY, JSON.stringify(SEED))
      return SEED.map(normalizeInvoice)
    }
    const byId = new Map(SEED.map((item) => [item.id, item]))
    return saved
      .map((item) => {
        const seed = byId.get(item.id)
        return normalizeInvoice(
          seed ? { ...seed, ...item, lines: item.lines?.length ? item.lines : seed.lines } : item,
        )
      })
      .filter(Boolean)
  } catch {
    return SEED.map(normalizeInvoice)
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
