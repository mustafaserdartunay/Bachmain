export type BillingPeriod = 'month' | 'year'

export type StoreCategory = {
  id: string
  label: string
}

export type StoreModule = {
  id: string
  code: string
  slug: string
  name: string
  description: string
  longDescription: string
  category: string
  icon: string
  iconColor: string
  features: string[]
  audience: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  trialDays: number
  sortOrder: number
  active: boolean
  isOwned?: boolean
}

export type ModuleStoreCatalog = {
  categories: StoreCategory[]
  modules: StoreModule[]
  yearlyDiscountPercent: number
  vatRate: number
  currency: string
}

export type CartItem = {
  code: string
  addedAt: number
}

export const MODULE_STORE_CART_KEY = 'bachmain_module_store_cart_v1'
export const MODULE_STORE_PERIOD_KEY = 'bachmain_module_store_period_v1'
