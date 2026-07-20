/** Supported marketplaces & commerce surfaces (GC-0 catalog). */

export type MarketplaceDef = {
  key: string
  name: string
  kind: 'marketplace' | 'store' | 'portal' | 'pos'
  region?: string
}

export const MARKETPLACES: MarketplaceDef[] = [
  { key: 'amazon', name: 'Amazon', kind: 'marketplace', region: 'global' },
  { key: 'shopify', name: 'Shopify', kind: 'store', region: 'global' },
  { key: 'woocommerce', name: 'WooCommerce', kind: 'store', region: 'global' },
  { key: 'trendyol', name: 'Trendyol', kind: 'marketplace', region: 'TR' },
  { key: 'hepsiburada', name: 'Hepsiburada', kind: 'marketplace', region: 'TR' },
  { key: 'n11', name: 'N11', kind: 'marketplace', region: 'TR' },
  { key: 'pazarama', name: 'Pazarama', kind: 'marketplace', region: 'TR' },
  { key: 'etsy', name: 'Etsy', kind: 'marketplace', region: 'global' },
  { key: 'alibaba', name: 'Alibaba', kind: 'marketplace', region: 'global' },
  { key: 'ebay', name: 'eBay', kind: 'marketplace', region: 'global' },
  { key: 'allegro', name: 'Allegro', kind: 'marketplace', region: 'EU' },
  { key: 'b2b', name: 'B2B Portal', kind: 'portal' },
  { key: 'b2c', name: 'B2C Store', kind: 'store' },
  { key: 'dealer', name: 'Dealer Portal', kind: 'portal' },
  { key: 'pos', name: 'POS', kind: 'pos' },
]

export const COMMERCE_LOCALES = ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'ru'] as const

export const COMMERCE_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'SAR', 'AED'] as const

export const SHIPPING_CARRIERS = [
  'UPS',
  'DHL',
  'FedEx',
  'Yurtiçi',
  'MNG',
  'Aras',
  'Sürat',
  'PTT',
] as const

export const PAYMENT_PROVIDERS = [
  'stripe',
  'iyzico',
  'paytr',
  'paypal',
  'wise',
  'bank_transfer',
] as const
