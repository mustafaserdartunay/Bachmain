const PRODUCT_SEARCH_FIELDS = ['name', 'stockCode', 'barcode', 'productCode', 'category']

function normalizeReference(value) {
  return String(value || '').trim()
}

export function normalizeProductCustomerIds(productOrIds) {
  const values = Array.isArray(productOrIds)
    ? productOrIds
    : Array.isArray(productOrIds?.customerIds)
      ? productOrIds.customerIds
      : []

  return [...new Set(values.map(normalizeReference).filter(Boolean))]
}

export function getProductCustomerCompatibility(product, customerId) {
  const customerIds = normalizeProductCustomerIds(product)
  const normalizedCustomerId = normalizeReference(customerId)

  if (customerIds.length === 0) {
    return { status: 'general', compatible: true, customerIds }
  }
  if (!normalizedCustomerId) {
    return { status: 'unknown', compatible: true, customerIds }
  }
  if (customerIds.includes(normalizedCustomerId)) {
    return { status: 'linked', compatible: true, customerIds }
  }
  return { status: 'mismatch', compatible: false, customerIds }
}

export function isProductCompatibleWithCustomer(product, customerId) {
  return getProductCustomerCompatibility(product, customerId).compatible
}

export function rankCatalogProductsForCustomer(products, customerId, query = '') {
  const normalizedQuery = String(query || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
  const statusRank = { linked: 0, general: 1, unknown: 2, mismatch: 3 }

  return (Array.isArray(products) ? products : [])
    .map((product, index) => ({
      product,
      index,
      compatibility: getProductCustomerCompatibility(product, customerId),
    }))
    .filter(({ product }) => {
      if (!normalizedQuery) return true
      return PRODUCT_SEARCH_FIELDS.some((field) =>
        String(product?.[field] || '')
          .toLocaleLowerCase('tr-TR')
          .includes(normalizedQuery),
      )
    })
    .sort((left, right) => {
      const rankDelta =
        statusRank[left.compatibility.status] - statusRank[right.compatibility.status]
      return rankDelta || left.index - right.index
    })
}

export function getProductCustomerMismatchMessage(product, customerLabel = 'seçili müşteri') {
  return `"${product?.name || 'Bu ürün'}" ${customerLabel} ile ilişkilendirilmemiş. Ürünü yine de belgeye eklemek istiyor musunuz?`
}
