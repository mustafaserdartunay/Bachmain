import { getCustomerProfiles } from '../data/customerProfiles'
import { CASH_BASE_PATH } from '../data/treasuryMenu'
import { getCustomerDisplay } from './customerDisplay'
import { getCatalogProducts } from './productCatalog'
import { loadOrders } from './ordersStore'
import { loadQuotes } from './quotesStore'
import {
  getTreasuryAccounts,
  getTreasuryMovements,
} from './treasuryStore'

const MODULE_HINTS = [
  { label: 'Müşteriler', to: '/musteriler', keys: ['müşteri', 'musteri', 'cari', 'customer'] },
  { label: 'Tedarikçiler', to: '/musteriler?kind=supplier', keys: ['tedarikçi', 'tedarikci', 'supplier'] },
  { label: 'Teklifler', to: '/teklifler', keys: ['teklif', 'quote'] },
  { label: 'Siparişler', to: '/siparisler', keys: ['sipariş', 'siparis', 'order'] },
  { label: 'Ürünler', to: '/stok/urunler', keys: ['ürün', 'urun', 'stok', 'product'] },
  { label: 'Depolar', to: '/stok/depolar', keys: ['depo', 'warehouse'] },
  { label: 'Kasa / Bankalar', to: CASH_BASE_PATH, keys: ['kasa', 'banka', 'nakit', 'cash'] },
  { label: 'Finans', to: '/finans', keys: ['finans', 'finance'] },
  { label: 'E-Fatura', to: '/finans?tab=einvoice', keys: ['e-fatura', 'efatura', 'fatura'] },
  { label: 'Personel / İK', to: '/ik', keys: ['personel', 'ik', 'hr', 'çalışan', 'calisan'] },
  { label: 'Sevkiyat', to: '/sevkiyat', keys: ['sevkiyat', 'lojistik', 'kargo'] },
  { label: 'Üretim', to: '/uretim', keys: ['üretim', 'uretim', 'production'] },
  { label: 'POS', to: '/shopping', keys: ['pos', 'shopping', 'mağaza', 'magaza'] },
  { label: 'AIOS', to: '/aios', keys: ['aios', 'ai', 'agent'] },
  { label: 'Otomasyon', to: '/otomasyon', keys: ['otomasyon', 'workflow'] },
  { label: 'Belge Merkezi', to: '/belge-merkezi', keys: ['belge', 'document', 'pdf'] },
  { label: 'Analitik', to: '/analitik', keys: ['analitik', 'analytics', 'rapor'] },
  { label: 'Ayarlar', to: '/ayarlar', keys: ['ayar', 'settings', 'yönetici', 'yonetici'] },
  { label: 'Profil', to: '/profil', keys: ['profil', 'profile'] },
]

function norm(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .trim()
}

function includesQuery(haystack, q) {
  const text = norm(haystack)
  return Boolean(text) && text.includes(q)
}

function pushHit(hits, hit, limit) {
  if (hits.length >= limit) return false
  hits.push(hit)
  return hits.length < limit
}

function scoreMatch(label, q) {
  const text = norm(label)
  if (!text) return 0
  if (text === q) return 100
  if (text.startsWith(q)) return 80
  if (text.includes(` ${q}`)) return 60
  if (text.includes(q)) return 40
  return 0
}

/**
 * Sistem geneli arama — tek harften sonuç döner.
 * @param {string} query
 * @param {{ limit?: number, minLength?: number }} [options]
 */
export function runOmniSearch(query, options = {}) {
  const minLength = options.minLength ?? 1
  const limit = options.limit ?? 24
  const q = norm(query)
  if (q.length < minLength) return []

  const hits = []
  const perType = {
    customer: 8,
    product: 6,
    order: 5,
    quote: 5,
    movement: 4,
    account: 3,
    module: 6,
  }

  const customers = getCustomerProfiles()
  let customerCount = 0
  for (const customer of customers) {
    if (customerCount >= perType.customer || hits.length >= limit) break
    const display = getCustomerDisplay(customer)
    const contact = customer.primaryContact || {}
    const fields = [
      display.companyTitle,
      display.brandShortName,
      customer.company,
      customer.companyTitle,
      customer.phone,
      customer.telefon,
      customer.email,
      customer.taxNumber,
      customer.vkn,
      contact.phone,
      contact.email,
      contact.name,
    ]
    if (!fields.some((field) => includesQuery(field, q))) continue
    const label = display.brandShortName || display.companyTitle || customer.company || customer.id
    const meta = [customer.phone || contact.phone, customer.email || contact.email]
      .filter(Boolean)
      .join(' · ')
    if (
      pushHit(
        hits,
        {
          id: `customer-${customer.id}`,
          type: 'Müşteri',
          label: String(label),
          meta,
          to: `/musteriler/${customer.id}`,
          score: scoreMatch(label, q),
        },
        limit,
      )
    ) {
      customerCount += 1
    }
  }

  const products = getCatalogProducts()
  let productCount = 0
  for (const product of products) {
    if (productCount >= perType.product || hits.length >= limit) break
    const fields = [product.name, product.sku, product.code, product.barcode, product.category]
    if (!fields.some((field) => includesQuery(field, q))) continue
    const label = product.name || product.sku || product.id
    const meta = [product.sku || product.code, product.barcode].filter(Boolean).join(' · ')
    if (
      pushHit(
        hits,
        {
          id: `product-${product.id}`,
          type: 'Ürün',
          label: String(label),
          meta,
          to: `/stok/urunler?q=${encodeURIComponent(q)}`,
          score: scoreMatch(label, q),
        },
        limit,
      )
    ) {
      productCount += 1
    }
  }

  const orders = loadOrders()
  let orderCount = 0
  for (const order of orders) {
    if (orderCount >= perType.order || hits.length >= limit) break
    const label = order.orderNo || order.docNo || order.id || 'Sipariş'
    const fields = [label, order.customerName, order.customerCompany]
    if (!fields.some((field) => includesQuery(field, q))) continue
    if (
      pushHit(
        hits,
        {
          id: `order-${order.id}`,
          type: 'Sipariş',
          label: String(label),
          meta: order.customerName || '',
          to: '/siparisler',
          score: scoreMatch(label, q),
        },
        limit,
      )
    ) {
      orderCount += 1
    }
  }

  const quotes = loadQuotes()
  let quoteCount = 0
  for (const quote of quotes) {
    if (quoteCount >= perType.quote || hits.length >= limit) break
    const label = quote.quoteNo || quote.docNo || quote.id || 'Teklif'
    const fields = [label, quote.customerName, quote.customerCompany]
    if (!fields.some((field) => includesQuery(field, q))) continue
    if (
      pushHit(
        hits,
        {
          id: `quote-${quote.id}`,
          type: 'Teklif',
          label: String(label),
          meta: quote.customerName || '',
          to: '/teklifler',
          score: scoreMatch(label, q),
        },
        limit,
      )
    ) {
      quoteCount += 1
    }
  }

  const movements = getTreasuryMovements()
  let movementCount = 0
  for (const movement of movements) {
    if (movementCount >= perType.movement || hits.length >= limit) break
    const fields = [
      movement.description,
      movement.docNo,
      movement.customerName,
      movement.type,
      movement.accountName,
    ]
    if (!fields.some((field) => includesQuery(field, q))) continue
    const customer = customers.find(
      (row) =>
        row.company === movement.customerName ||
        getCustomerDisplay(row).companyTitle === movement.customerName,
    )
    const to = customer?.id
      ? `/musteriler/${customer.id}/hareket/${movement.id}`
      : '/musteriler'
    const label = movement.description || movement.docNo || movement.type || 'Hareket'
    if (
      pushHit(
        hits,
        {
          id: `movement-${movement.id}`,
          type: 'Hareket',
          label: String(label),
          meta: [movement.customerName, movement.type].filter(Boolean).join(' · '),
          to,
          score: scoreMatch(label, q),
        },
        limit,
      )
    ) {
      movementCount += 1
    }
  }

  const accounts = getTreasuryAccounts()
  let accountCount = 0
  for (const account of accounts) {
    if (accountCount >= perType.account || hits.length >= limit) break
    const fields = [account.name, account.type, account.iban, account.bankName]
    if (!fields.some((field) => includesQuery(field, q))) continue
    const label = account.name || account.id
    if (
      pushHit(
        hits,
        {
          id: `account-${account.id}`,
          type: 'Hesap',
          label: String(label),
          meta: account.type || '',
          to: `${CASH_BASE_PATH}/${account.id || 'cash-main'}`,
          score: scoreMatch(label, q),
        },
        limit,
      )
    ) {
      accountCount += 1
    }
  }

  let moduleCount = 0
  for (const mod of MODULE_HINTS) {
    if (moduleCount >= perType.module || hits.length >= limit) break
    const matched =
      includesQuery(mod.label, q) || mod.keys.some((key) => includesQuery(key, q) || key.includes(q))
    if (!matched) continue
    if (
      pushHit(
        hits,
        {
          id: `module-${mod.to}`,
          type: 'Modül',
          label: mod.label,
          meta: 'Sayfa',
          to: mod.to,
          score: scoreMatch(mod.label, q),
        },
        limit,
      )
    ) {
      moduleCount += 1
    }
  }

  return hits.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, limit)
}

export default runOmniSearch
