/** Genel stok vs müşteri stoğu */

export const STOCK_SCOPES = {
  general: {
    id: 'general',
    label: 'Genel Stok',
    short: 'Genel',
    description: 'Firmaya ait · tüm müşteriler · satılabilir',
  },
  customer: {
    id: 'customer',
    label: 'Müşteri Stoğu',
    short: 'Müşteri',
    description: 'Müşteriye özel · başka cariye kullanılamaz',
  },
}

export function resolveStockScope(record) {
  if (record?.stockScope === 'general' || record?.stockScope === 'customer') {
    return record.stockScope
  }
  const customer = record?.customer
  if (customer && String(typeof customer === 'object' ? customer.companyTitle || customer.name || '' : customer).trim()) {
    return 'customer'
  }
  return 'general'
}

export function stockScopeLabel(scope) {
  return STOCK_SCOPES[scope]?.label || STOCK_SCOPES.general.label
}

export function withStockScope(item) {
  const stockScope = resolveStockScope(item)
  return {
    ...item,
    stockScope,
    customerId: item.customerId || (typeof item.customer === 'object' ? item.customer?.id : '') || '',
  }
}
