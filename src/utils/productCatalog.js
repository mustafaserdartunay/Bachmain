import { emptyProduct, sampleProducts } from '../data/productsData'
import { filterByOrgScope, getActiveOrgScope, withOrgScope } from './orgScope'
import { normalizeProductCustomerIds } from './productCustomerCompatibility'

const PRODUCT_STORAGE_KEY = 'erlenbox-products'
const PRODUCT_DB_NAME = 'erlenbox-product-storage'
const PRODUCT_DB_STORE = 'products'
const PRODUCT_DB_KEY = 'all-products'

function openProductDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB kullanılamıyor'))
      return
    }
    const request = window.indexedDB.open(PRODUCT_DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PRODUCT_DB_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadProductsFromIndexedDb() {
  const db = await openProductDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCT_DB_STORE, 'readonly')
    const request = transaction.objectStore(PRODUCT_DB_STORE).get(PRODUCT_DB_KEY)
    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export function resolveProductImage(product) {
  const candidates = [
    product?.image,
    product?.gallery?.[0],
    product?.webImages?.[0],
    product?.instagramImages?.[0],
  ]
  return candidates.find((item) => typeof item === 'string' && item.length > 0) || null
}

function cloneProduct(product) {
  return {
    ...emptyProduct,
    ...product,
    storeSalesVisible: Boolean(product.storeSalesVisible),
    customerIds: normalizeProductCustomerIds(product),
    warehouses: [...(product.warehouses || emptyProduct.warehouses)],
  }
}

export function getCatalogProducts() {
  try {
    const saved = localStorage.getItem(PRODUCT_STORAGE_KEY)
    if (!saved)
      return filterByOrgScope(sampleProducts.map(cloneProduct), getActiveOrgScope(), {
        loose: true,
      })
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return filterByOrgScope(sampleProducts.map(cloneProduct), getActiveOrgScope(), {
        loose: true,
      })
    }
    return filterByOrgScope(parsed.map(cloneProduct), getActiveOrgScope(), { loose: true })
  } catch {
    return filterByOrgScope(sampleProducts.map(cloneProduct), getActiveOrgScope(), { loose: true })
  }
}

export async function getCatalogProductsWithMedia() {
  try {
    const fromDb = await loadProductsFromIndexedDb()
    if (Array.isArray(fromDb) && fromDb.length > 0) {
      return fromDb.map(cloneProduct)
    }
  } catch {
    // IndexedDB yoksa localStorage'a düş.
  }
  return getCatalogProducts()
}

export function getTotalStock(product) {
  return (product.warehouses || []).reduce(
    (sum, warehouse) => sum + Number(warehouse.stock || 0),
    0,
  )
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
  if (stock <= 0)
    return { label: 'Stok Yok', tone: 'text-red-300', badge: 'bg-red-500/15 text-red-300' }
  if (stock <= 100)
    return { label: 'Kritik', tone: 'text-amber-300', badge: 'bg-amber-500/15 text-amber-300' }
  return { label: 'Stokta', tone: 'text-emerald-300', badge: 'bg-emerald-500/15 text-emerald-300' }
}

export function getStoreSalesCategories(products = []) {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
  categories.sort((a, b) => a.localeCompare(b, 'tr-TR'))
  return [
    { value: 'All', label: 'Tümü' },
    ...categories.map((category) => ({ value: category, label: category })),
  ]
}

export function mapProductForStoreSales(product) {
  const stock = getTotalStock(product)
  const imageUrl = resolveProductImage(product)
  return {
    id: product.stockCode || product.id,
    productId: product.id,
    name: product.name || 'İsimsiz ürün',
    category: product.category || 'Diğer',
    description: product.notes || '',
    image: imageUrl || 'linear-gradient(135deg,#1e293b,#475569)',
    imageUrl,
    price: Number(product.salesPriceExcl) || 0,
    vatRate: Number(product.vatRate) || 0,
    stock,
    tag: product.tags?.[0] || 'Ürün',
  }
}

export function getStoreSalesProducts() {
  return getCatalogProducts()
    .filter((product) => product.storeSalesVisible)
    .map(mapProductForStoreSales)
}

export async function getStoreSalesProductsWithMedia() {
  const products = await getCatalogProductsWithMedia()
  return products.filter((product) => product.storeSalesVisible).map(mapProductForStoreSales)
}

export function stripCostFields(product) {
  const { purchasePriceExcl, costPrice, costRows, laborRows, costColumns, profitMargin, ...safe } =
    product
  return safe
}
