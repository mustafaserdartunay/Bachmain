export const COMMERCE_BASE = '/ticaret'

export const commerceSubMenus = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'b2b', label: 'B2B Portal' },
  { id: 'b2c', label: 'B2C Store' },
  { id: 'dealer', label: 'Dealer Portal' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'productAi', label: 'Product AI' },
  { id: 'price', label: 'Price Management' },
  { id: 'stock', label: 'Stock Sync' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payments', label: 'Payments' },
  { id: 'returns', label: 'Returns' },
  { id: 'accounts', label: 'Customer Accounts' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'analytics', label: 'Analytics' },
]

export function isCommerceRoute(pathname) {
  return pathname === COMMERCE_BASE || pathname.startsWith(`${COMMERCE_BASE}/`)
}
