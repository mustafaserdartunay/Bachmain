import { randomUUID } from 'node:crypto'

export type BachmainInvoicePayload = {
  uuid?: string
  invoiceNo?: string
  invoiceType?: string
  invoiceProfile?: string
  issueDate?: string
  dueDate?: string
  currency?: string
  exchangeRate?: number | null
  notes?: string[] | string | null
  orderNo?: string | null
  shipmentNo?: string | null
  company: {
    taxNumber?: string
    name?: string
    taxOffice?: string
    address?: string
    district?: string
    city?: string
    country?: string
    postalCode?: string
    phone?: string
    email?: string
    website?: string
  }
  customer: {
    taxNumber?: string
    name?: string
    taxOffice?: string
    address?: string
    district?: string
    city?: string
    country?: string
    postalCode?: string
    phone?: string
    email?: string
  }
  lines: Array<{
    name: string
    description?: string
    quantity: number
    unitType?: string
    price: number
    allowanceTotal?: number
    kdvPercent: number
    kdvTotal?: number
    note?: string
  }>
}

function asIso(value?: string | null) {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function party(info: BachmainInvoicePayload['company'] | BachmainInvoicePayload['customer']) {
  return {
    TaxNumber: info.taxNumber || '',
    Name: info.name || '',
    TaxOffice: info.taxOffice || null,
    Address: info.address || 'Test Mahallesi',
    District: info.district || info.city || 'Kadıköy',
    City: info.city || 'İstanbul',
    Country: info.country || 'Türkiye',
    PostalCode: info.postalCode || null,
    Phone: info.phone || null,
    Fax: null,
    Mail: info.email || null,
    WebSite: 'website' in info ? info.website || null : null,
  }
}

function totals(lines: BachmainInvoicePayload['lines']) {
  const lineExtension = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0
    const price = Number(line.price) || 0
    const allowance = Number(line.allowanceTotal) || 0
    return sum + Math.max(0, qty * price - allowance)
  }, 0)
  const kdv = lines.reduce((sum, line) => {
    if (line.kdvTotal != null) return sum + Number(line.kdvTotal) || 0
    const qty = Number(line.quantity) || 0
    const price = Number(line.price) || 0
    const allowance = Number(line.allowanceTotal) || 0
    const net = Math.max(0, qty * price - allowance)
    return sum + net * ((Number(line.kdvPercent) || 0) / 100)
  }, 0)
  const byRate: Record<number, number> = { 1: 0, 8: 0, 10: 0, 18: 0, 20: 0 }
  for (const line of lines) {
    const qty = Number(line.quantity) || 0
    const price = Number(line.price) || 0
    const allowance = Number(line.allowanceTotal) || 0
    const net = Math.max(0, qty * price - allowance)
    const rate = Number(line.kdvPercent) || 0
    const amount = line.kdvTotal != null ? Number(line.kdvTotal) || 0 : net * (rate / 100)
    if (rate in byRate) byRate[rate] += amount
  }
  return {
    lineExtension: round2(lineExtension),
    kdv: round2(kdv),
    payable: round2(lineExtension + kdv),
    byRate,
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function toNilveraEInvoiceModel(
  payload: BachmainInvoicePayload,
  customerAlias?: string | null,
) {
  const uuid = payload.uuid || randomUUID()
  const t = totals(payload.lines)
  const notes = Array.isArray(payload.notes)
    ? payload.notes
    : payload.notes
      ? [String(payload.notes)]
      : []
  return {
    EInvoice: {
      InvoiceInfo: {
        UUID: uuid,
        InvoiceType: payload.invoiceType || 'SATIS',
        InvoiceSerieOrNumber: payload.invoiceNo || `GIB${new Date().getFullYear()}000000001`,
        IssueDate: asIso(payload.issueDate),
        CurrencyCode: payload.currency || 'TRY',
        ExchangeRate: payload.exchangeRate ?? null,
        InvoiceProfile: payload.invoiceProfile || 'TICARIFATURA',
        OrderReference: payload.orderNo
          ? { Value: payload.orderNo, IssueDate: asIso(payload.issueDate) }
          : null,
        ShipmentNumber: payload.shipmentNo || null,
        PaymentMeansInfo: payload.dueDate
          ? { DueDate: asIso(payload.dueDate), Code: null, ChannelCode: null }
          : null,
        LineExtensionAmount: t.lineExtension,
        GeneralKDV1Total: t.byRate[1],
        GeneralKDV8Total: t.byRate[8],
        GeneralKDV10Total: t.byRate[10],
        GeneralKDV18Total: t.byRate[18],
        GeneralKDV20Total: t.byRate[20],
        GeneralAllowanceTotal: 0,
        PayableAmount: t.payable,
        KdvTotal: t.kdv,
      },
      CompanyInfo: party(payload.company),
      CustomerInfo: party(payload.customer),
      InvoiceLines: payload.lines.map((line, index) => ({
        Index: String(index + 1),
        Name: line.name,
        Description: line.description || null,
        Quantity: Number(line.quantity) || 0,
        UnitType: line.unitType || 'C62',
        Price: Number(line.price) || 0,
        AllowanceTotal: Number(line.allowanceTotal) || 0,
        KDVPercent: Number(line.kdvPercent) || 0,
        KDVTotal: line.kdvTotal != null ? Number(line.kdvTotal) : undefined,
        Note: line.note || null,
      })),
      Notes: notes,
    },
    CustomerAlias: customerAlias || null,
  }
}

export function toNilveraEArchiveModel(payload: BachmainInvoicePayload) {
  const einvoice = toNilveraEInvoiceModel(payload)
  return {
    ArchiveInvoice: {
      ...einvoice.EInvoice,
      InvoiceInfo: {
        ...einvoice.EInvoice.InvoiceInfo,
        InvoiceProfile: 'EARSIVFATURA',
      },
    },
  }
}

export function validateInvoicePayload(payload: BachmainInvoicePayload) {
  const errors: string[] = []
  if (!payload.customer?.taxNumber) errors.push('Alıcı VKN/TCKN zorunludur.')
  if (!payload.customer?.name) errors.push('Alıcı unvanı zorunludur.')
  if (!payload.company?.taxNumber) errors.push('Gönderici vergi numarası zorunludur.')
  if (!payload.company?.name) errors.push('Gönderici unvanı zorunludur.')
  if (!payload.lines?.length) errors.push('En az bir fatura satırı gereklidir.')
  for (const line of payload.lines || []) {
    if (!line.name) errors.push('Satır açıklaması boş olamaz.')
    if (!(Number(line.quantity) > 0)) errors.push(`Geçersiz miktar: ${line.name || 'satır'}`)
  }
  return errors
}
