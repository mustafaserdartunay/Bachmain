export const COMMERCE_BASE = '/ticaret'

export const commerceSubMenus = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'brands', label: 'Brands' },
  { id: 'collections', label: 'Collections' },
  { id: 'experience', label: 'Product Experience' },
  { id: 'configurator', label: 'Configurator' },
  { id: 'cpq', label: 'CPQ' },
  { id: 'b2b', label: 'B2B Portal' },
  { id: 'b2c', label: 'B2C Store' },
  { id: 'dealer', label: 'Dealer Portal' },
  { id: 'customer', label: 'Customer Portal' },
  { id: 'supplier', label: 'Supplier Portal' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'orders', label: 'Orders' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'giftCards', label: 'Gift Cards' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'price', label: 'Pricing Engine' },
  { id: 'productAi', label: 'Product AI' },
  { id: 'aiCommerce', label: 'AI Commerce' },
  { id: 'stock', label: 'Stock Sync' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payments', label: 'Payments' },
  { id: 'returns', label: 'Returns' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'global', label: 'Global' },
  { id: 'showroom', label: 'Showroom' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
]

export function isCommerceRoute(pathname) {
  return (
    pathname === COMMERCE_BASE ||
    pathname === '/commerce' ||
    pathname.startsWith(`${COMMERCE_BASE}/`)
  )
}
