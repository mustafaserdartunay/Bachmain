import { emptyProduct, sampleProducts } from '../data/productsData'

const PRODUCT_STORAGE_KEY = 'erlenbox-products'

function cloneProduct(product) {
  return {
    ...emptyProduct,
    ...product,
    warehouses: [...(product.warehouses || emptyProduct.warehouses)],
  }
}

export function getCatalogProducts() {
  try {
    const saved = localStorage.getItem(PRODUCT_STORAGE_KEY)
    if (!saved) return sampleProducts.map(cloneProduct)
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed) || parsed.length === 0) return sampleProducts.map(cloneProduct)
    return parsed.map(cloneProduct)
  } catch {
    return sampleProducts.map(cloneProduct)
  }
}

export function getTotalStock(product) {
  return (product.warehouses || []).reduce((sum, warehouse) => sum + Number(warehouse.stock || 0), 0)
}

export function getSalesPrice(product) {
  const base = Number(product.salesPriceExcl || 0)
  const vat = Number(product.vatRate || 0)
  return base * (1 + vat / 100)
}

export function getDealerPrice(product) {
  const sales = getSalesPrice(product)
  const discount = Number(product.dealerDiscount || 0)
  return sales * (1 - discount / 100)
}

export function getCustomerProductPrice(product, { isDealer, customPrice }) {
  if (customPrice != null && customPrice > 0) return customPrice
  return isDealer ? getDealerPrice(product) : getSalesPrice(product)
}

export function getProductCategories(products = getCatalogProducts()) {
  const fromData = [...new Set(products.map((product) => product.category).filter(Boolean))]
  return fromData.sort((a, b) => a.localeCompare(b, 'tr-TR'))
}

export function getStockStatus(stock) {
  if (stock <= 0) return { label: 'Stok Yok', tone: 'text-red-300', badge: 'bg-red-500/15 text-red-300' }
  if (stock <= 100) return { label: 'Kritik', tone: 'text-amber-300', badge: 'bg-amber-500/15 text-amber-300' }
  return { label: 'Stokta', tone: 'text-emerald-300', badge: 'bg-emerald-500/15 text-emerald-300' }
}

export function stripCostFields(product) {
  const {
    purchasePriceExcl,
    costPrice,
    costRows,
    laborRows,
    costColumns,
    profitMargin,
    ...safe
  } = product
  return safe
}
