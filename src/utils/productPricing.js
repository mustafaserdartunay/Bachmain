export function calcInclPrice(excl, vatRate) {
  const base = Number(excl) || 0
  const vat = Number(vatRate) || 0
  return base * (1 + vat / 100)
}

export function calcExclFromIncl(incl, vatRate) {
  const base = Number(incl) || 0
  const vat = Number(vatRate) || 0
  if (vat === 0) return base
  return base / (1 + vat / 100)
}

export function calcSalesFromMargin(cost, margin) {
  const c = Number(cost) || 0
  const m = Number(margin) || 0
  return c * (1 + m / 100)
}

export function calcMarginFromPrices(cost, salesExcl) {
  const c = Number(cost) || 0
  const s = Number(salesExcl) || 0
  if (c === 0) return 0
  return ((s - c) / c) * 100
}

export function applyFinalRounding(price, roundUp) {
  const p = Number(price) || 0
  return roundUp ? Math.ceil(p) : p
}

export function calcDealerPriceIncl(finalPriceIncl, discountPercent) {
  const p = Number(finalPriceIncl) || 0
  const d = Number(discountPercent) || 0
  return p * (1 - d / 100)
}

export function formatPrice(value) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

// Türk Lirası tutarı: "1.100.100,50₺" (sembol sağda).
export function formatTL(value) {
  return `${formatPrice(value)}₺`
}

export function formatFx(value, currency) {
  const locales = { USD: 'en-US', EUR: 'de-DE' }
  return new Intl.NumberFormat(locales[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

export function tryToForeign(tryAmount, tryPerUnit) {
  if (!tryPerUnit || tryPerUnit <= 0) return 0
  return (Number(tryAmount) || 0) / tryPerUnit
}

export function getProductPricing(product) {
  const purchaseIncl = calcInclPrice(product.purchasePriceExcl, product.vatRate)
  const salesExcl = product.useMarginPricing
    ? calcSalesFromMargin(product.costPrice, product.profitMargin)
    : product.salesPriceExcl
  const salesIncl = calcInclPrice(salesExcl, product.vatRate)
  const finalSalesPriceIncl = applyFinalRounding(salesIncl, product.roundUpFinalPrice)
  const finalSalesPriceExcl = calcExclFromIncl(finalSalesPriceIncl, product.vatRate)
  const dealerSalesPriceIncl = calcDealerPriceIncl(finalSalesPriceIncl, product.dealerDiscount)
  const dealerSalesPriceExcl = calcExclFromIncl(dealerSalesPriceIncl, product.vatRate)

  return {
    purchaseIncl,
    salesExcl,
    salesIncl,
    finalSalesPriceIncl,
    finalSalesPriceExcl,
    dealerSalesPriceIncl,
    dealerSalesPriceExcl,
    profitMargin: product.useMarginPricing
      ? product.profitMargin
      : calcMarginFromPrices(product.costPrice, salesExcl),
  }
}
