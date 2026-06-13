import { saveCustomerProfile, getCustomerProfiles } from '../data/customerProfiles'
import { getCatalogProducts } from './productCatalog'
import { emptyProduct } from '../data/productsData'
import { createVoiceQuote } from './quotesStore'
import { readCustomerMeta, getCustomerMetaSelection } from './customerMeta'

const PRODUCT_STORAGE_KEY = 'erlenbox-products'

function saveProductToCatalog(product) {
  const products = getCatalogProducts()
  const next = [product, ...products.filter((item) => item.id !== product.id)]
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('erlenbox:products-updated'))
  return product
}

export async function buildRichVoiceContext(pathname) {
  const customers = getCustomerProfiles().slice(0, 40).map((customer) => {
    const meta = readCustomerMeta()[customer.id] || {}
    const selection = getCustomerMetaSelection(customer, meta)
    return {
      id: customer.id,
      company: customer.company,
      companyTitle: customer.companyTitle || customer.company,
      contact: customer.contact,
      representative: selection.representative,
    }
  })

  const products = getCatalogProducts().slice(0, 50).map((product) => ({
    name: product.name,
    stockCode: product.stockCode,
    salesPriceExcl: Number(product.salesPriceExcl || 0),
    vatRate: Number(product.vatRate || 20),
    category: product.category,
  }))

  return {
    currentPath: pathname,
    customers,
    products,
    timestamp: new Date().toISOString(),
  }
}

export async function executeVoiceActions(actions, navigate) {
  const logs = []

  for (const action of actions || []) {
    const type = action?.type
    const payload = action?.payload || action?.data || {}

    try {
      if (type === 'navigate' && payload.path) {
        navigate(payload.path)
        logs.push(`Sayfa: ${payload.path}`)
        continue
      }

      if (type === 'create_customer') {
        const profile = saveCustomerProfile({
          company: payload.companyTitle || payload.company || payload.shortBrandName || 'Yeni Müşteri',
          companyTitle: payload.companyTitle || payload.company || '',
          shortBrandName: payload.shortBrandName || payload.company || '',
          contact: payload.contact || '',
          email: payload.email || '',
          phone: payload.phone || '',
          city: payload.city || '',
          owner: payload.representative || payload.owner || 'Satış Ekibi',
          balance: Number(payload.balance || 0),
        })

        if (payload.representative) {
          const meta = readCustomerMeta()
          meta[profile.id] = {
            ...(meta[profile.id] || {}),
            representative: payload.representative,
            type: payload.type || meta[profile.id]?.type || 'Müşteri',
          }
          localStorage.setItem('erlenbox-customer-list-settings', JSON.stringify(meta))
        }

        navigate(`/musteriler/${profile.id}`)
        logs.push(`Müşteri oluşturuldu: ${profile.company}`)
        continue
      }

      if (type === 'create_product') {
        const product = saveProductToCatalog({
          ...emptyProduct,
          id: `PRD-${Date.now()}`,
          name: payload.name || 'Yeni Ürün',
          stockCode: payload.stockCode || `SKU-${Date.now().toString().slice(-6)}`,
          category: payload.category || 'Kraft Kutular',
          salesPriceExcl: Number(payload.salesPriceExcl || payload.price || 0),
          vatRate: Number(payload.vatRate ?? 20),
          notes: payload.notes || '',
        })
        navigate('/stok/urunler')
        sessionStorage.setItem('erlenbox-voice-open-product', product.id)
        logs.push(`Ürün oluşturuldu: ${product.name}`)
        continue
      }

      if (type === 'create_quote') {
        const quote = createVoiceQuote({
          title: payload.title || `${payload.customer || 'Müşteri'} teklifi`,
          customer: payload.customer || payload.companyTitle || '',
          contact: payload.contact || '',
          email: payload.email || '',
          phone: payload.phone || '',
          owner: payload.owner || payload.representative || '',
          items: Array.isArray(payload.items) ? payload.items : [],
        })
        sessionStorage.setItem('erlenbox-voice-open-quote', quote.id)
        navigate('/teklifler')
        logs.push(`Teklif oluşturuldu: ${quote.id}`)
        continue
      }

      logs.push(`Bilinmeyen işlem atlandı: ${type}`)
    } catch (error) {
      logs.push(`Hata (${type}): ${error.message}`)
    }
  }

  return logs
}
