export function safeNumber(value, min = 0, max = 999999999) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.min(Math.max(number, min), max)
}

export function sanitizeDocumentDiscountFields(document) {
  return {
    showDocumentDiscount: Boolean(document?.showDocumentDiscount),
    documentDiscountMode: document?.documentDiscountMode === 'amount' ? 'amount' : 'percent',
    documentDiscountRate: safeNumber(document?.documentDiscountRate, 0, 100),
    documentDiscountAmount: safeNumber(document?.documentDiscountAmount),
  }
}

function computeDocumentDiscountAmount(document, netBase) {
  if (!document?.showDocumentDiscount || netBase <= 0) return 0
  if (document.documentDiscountMode === 'amount') {
    return Math.min(safeNumber(document.documentDiscountAmount), netBase)
  }
  return netBase * (safeNumber(document.documentDiscountRate, 0, 100) / 100)
}

export function itemTotals(item) {
  const quantity = safeNumber(item.quantity)
  const unitPrice = safeNumber(item.unitPrice)
  const discountRate = item.showDiscount ? safeNumber(item.discountRate, 0, 100) : 0
  const exciseTaxRate = item.showExciseTax ? safeNumber(item.exciseTaxRate, 0, 100) : 0
  const accommodationTaxRate = item.showAccommodationTax
    ? safeNumber(item.accommodationTaxRate, 0, 100)
    : 0
  const vatRate = safeNumber(item.vatRate, 0, 100)

  const subtotal = quantity * unitPrice
  const discount = subtotal * (discountRate / 100)
  const net = subtotal - discount
  const exciseTax = net * (exciseTaxRate / 100)
  const accommodationTax = net * (accommodationTaxRate / 100)
  const vatBase = net + exciseTax + accommodationTax
  const vat = vatBase * (vatRate / 100)

  return {
    subtotal,
    discount,
    net,
    exciseTax,
    accommodationTax,
    vat,
    total: vatBase + vat,
  }
}

export function documentTotals(document) {
  const items = document.items || []
  const rows = items.map(itemTotals)
  const subtotal = rows.reduce((sum, row) => sum + row.subtotal, 0)
  const lineDiscount = rows.reduce((sum, row) => sum + row.discount, 0)
  const lineNet = rows.reduce((sum, row) => sum + row.net, 0)
  const lineExciseTax = rows.reduce((sum, row) => sum + row.exciseTax, 0)
  const lineAccommodationTax = rows.reduce((sum, row) => sum + row.accommodationTax, 0)
  const lineVat = rows.reduce((sum, row) => sum + row.vat, 0)

  const documentDiscount = computeDocumentDiscountAmount(document, lineNet)
  const netRatio = lineNet > 0 ? Math.max(0, (lineNet - documentDiscount) / lineNet) : 1

  const net = lineNet - documentDiscount
  const exciseTax = lineExciseTax * netRatio
  const accommodationTax = lineAccommodationTax * netRatio
  const vat = lineVat * netRatio
  const discountFields = sanitizeDocumentDiscountFields(document)

  return {
    subtotal,
    lineDiscount,
    documentDiscount,
    discount: lineDiscount + documentDiscount,
    net,
    exciseTax,
    accommodationTax,
    vat,
    grandTotal: net + exciseTax + accommodationTax + vat,
    showDiscount: true,
    ...discountFields,
    showExciseTax: items.some((item) => item.showExciseTax) || exciseTax > 0,
    showAccommodationTax: items.some((item) => item.showAccommodationTax) || accommodationTax > 0,
  }
}

/**
 * KDV hariç / KDV dahil tutarlar.
 * Kalemlerde KDV yoksa (vatRate 0) iki tutar eşit gelir.
 * items yoksa amountNet / vatAmount / amount alanlarından okur.
 */
export function documentMoneyParts(document) {
  const items = document?.items
  if (Array.isArray(items) && items.length > 0) {
    const totals = documentTotals(document)
    const exclVat = totals.net + totals.exciseTax + totals.accommodationTax
    return {
      exclVat,
      vat: totals.vat,
      inclVat: totals.grandTotal,
    }
  }

  const amount = Number(document?.amount)
  const amountNet = Number(document?.amountNet)
  const vatAmount = Number(document?.vatAmount)
  if (Number.isFinite(amountNet) && Number.isFinite(amount)) {
    return {
      exclVat: amountNet,
      vat: Number.isFinite(vatAmount) ? vatAmount : Math.max(0, amount - amountNet),
      inclVat: amount,
    }
  }
  if (Number.isFinite(amount)) {
    return { exclVat: amount, vat: 0, inclVat: amount }
  }
  return { exclVat: 0, vat: 0, inclVat: 0 }
}

export function sumMoneyParts(partsList = []) {
  return partsList.reduce(
    (acc, part) => ({
      exclVat: acc.exclVat + (Number(part?.exclVat) || 0),
      vat: acc.vat + (Number(part?.vat) || 0),
      inclVat: acc.inclVat + (Number(part?.inclVat) || 0),
    }),
    { exclVat: 0, vat: 0, inclVat: 0 },
  )
}
