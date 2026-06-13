import { findCustomerProfileByReference } from '../data/customerProfiles'
import { resolveLineProductCode, resolveLinePricingFromOrder } from './depoStore'
import { getQuantityRowOrdered } from './productionQuantityMetrics'
import { createQuantityRowTimestamp } from './productionLineItems'

function draftDateInput(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (trMatch) {
    return `${trMatch[3]}-${trMatch[2]}-${trMatch[1]}`
  }
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }
  return ''
}

export function buildProductionInvoiceDraft(job, lineItem, row) {
  const deliveredQuantity = Math.max(0, Number(row?.deliveredQuantity) || 0)
  const quantity = deliveredQuantity || Math.max(
    0,
    Number(row?.producedQuantity) || getQuantityRowOrdered(row, lineItem),
  )
  const customerProfile = findCustomerProfileByReference(job?.customer)
  const customerName = customerProfile?.company || job?.customer || ''
  const productName = lineItem?.product || 'Ürün'
  const productCode = resolveLineProductCode(job, lineItem)
  const invoiceAt = row?.invoiceAt || createQuantityRowTimestamp()
  const pricing = resolveLinePricingFromOrder(job, lineItem)
  const codePrefix = productCode ? `${productCode} · ` : ''

  return {
    description: [
      customerName,
      productName,
      productCode,
      `${quantity} adet`,
      invoiceAt,
    ].filter(Boolean).join(' · '),
    customerName,
    productName,
    productCode,
    deliveredQuantity: quantity,
    invoiceAt,
    date: draftDateInput(invoiceAt),
    lines: [{
      description: `${codePrefix}${productName}`,
      quantity: quantity || 1,
      unitPrice: pricing.unitPrice,
      vat: pricing.vatRate,
    }],
    invoiceNo: row?.invoiceNo || '',
    productionJobId: job?.id || '',
    lineItemId: lineItem?.id || '',
    quantityRowId: row?.id || '',
    depoItemId: row?.depoItemId || '',
  }
}

export const PRODUCTION_DOCUMENT_DRAFT_KEY = 'erlenbox-production-document-draft'

export function saveProductionInvoiceDraft(draft) {
  const payload = JSON.stringify(draft)
  sessionStorage.setItem(PRODUCTION_DOCUMENT_DRAFT_KEY, payload)
  sessionStorage.setItem('erlenbox-depo-document-draft', payload)
}
