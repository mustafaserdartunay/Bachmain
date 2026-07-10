import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Minus,
  Percent,
  Plus,
  Receipt,
  ShoppingBag,
  StickyNote,
  Tag,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import SearchInput from '../components/Common/SearchInput'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { appendActivityEntry } from '../utils/activityArchiveStore'
import { getStoreSalesCategories, getStoreSalesProductsWithMedia } from '../utils/productCatalog'

const HISTORY_KEY = 'erlenbox-shopping-sales-history'
const CART_KEY = 'erlenbox-shopping-active-cart'
const CART_META_KEY = 'erlenbox-shopping-cart-meta'

const quickCustomerPresets = [
  'Perakende Müşteri',
  'Kurumsal Müşteri',
  'Misafir',
  'Personel İkramı',
]

const paymentMethods = [
  { id: 'cash', label: 'Nakit', icon: Banknote, tone: 'bg-emerald-500 hover:bg-emerald-600 text-white', selectedRing: 'ring-emerald-400/50' },
  { id: 'card', label: 'Kredi Kartı', icon: CreditCard, tone: 'bg-blue-500 hover:bg-blue-600 text-white', selectedRing: 'ring-blue-400/50' },
  { id: 'transfer', label: 'Havale', icon: WalletCards, tone: 'bg-violet-500 hover:bg-violet-600 text-white', selectedRing: 'ring-violet-400/50' },
]

function formatCurrency(value) {
  const amount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)
  return `${amount}₺`
}

function today() {
  return new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ProductVisual({ product }) {
  const imageUrl = product.imageUrl || product.image
  const isImageUrl = typeof imageUrl === 'string'
    && (imageUrl.startsWith('data:') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))
  const fallbackStyle = { background: product.image || 'linear-gradient(135deg,#1e293b,#475569)' }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-dark-700/50">
      {isImageUrl ? (
        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full" style={fallbackStyle} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700 shadow-sm">
        {product.tag}
      </span>
    </div>
  )
}

function DailySalesSparkline({ history }) {
  const buckets = useMemo(() => {
    const hours = Array.from({ length: 8 }, (_, index) => ({ hour: index + 9, total: 0 }))
    history.forEach((sale) => {
      const match = sale.date?.match(/(\d{1,2}):(\d{2})/)
      if (!match) return
      const hour = Number(match[1])
      const bucket = hours.find((item) => item.hour === hour) || hours.find((item) => hour >= item.hour && hour < item.hour + 1)
      if (bucket) bucket.total += sale.grandTotal
    })
    const max = Math.max(...hours.map((item) => item.total), 1)
    return hours.map((item) => ({ ...item, pct: Math.round((item.total / max) * 100) }))
  }, [history])

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <p className="text-xs font-bold text-white">Günlük Satış Akışı</p>
      <p className="mt-0.5 text-[12px] text-gray-500">Saatlik tahsilat dağılımı</p>
      <div className="mt-4 flex h-16 items-end gap-1.5">
        {buckets.map((item) => (
          <div key={item.hour} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-blue-500 transition-all"
              style={{
                height: `${Math.max(item.pct, item.total > 0 ? 12 : 6)}%`,
                opacity: item.total > 0 ? 1 : 0.2,
              }}
            />
            <span className="text-[11px] font-semibold text-gray-500">{item.hour}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StoreBalanceCard({ history }) {
  const balance = history.reduce((sum, sale) => sum + sale.grandTotal, 0)
  const avgTicket = history.length ? balance / history.length : 0

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <p className="text-xs font-bold text-white">Mağaza Kasası</p>
      <p className="mt-2 text-2xl font-black tabular-nums text-blue-300">{formatCurrency(balance)}</p>
      <p className="mt-1 text-[12px] text-gray-500">
        {history.length} fiş · ort. {formatCurrency(avgTicket)}
      </p>
    </div>
  )
}

function PaymentMixBar({ history }) {
  const totals = useMemo(() => {
    const mix = { Nakit: 0, 'Kredi Kartı': 0, other: 0 }
    history.forEach((sale) => {
      if (sale.paymentMethod === 'Nakit') mix.Nakit += sale.grandTotal
      else if (sale.paymentMethod === 'Kredi Kartı') mix['Kredi Kartı'] += sale.grandTotal
      else mix.other += sale.grandTotal
    })
    const total = mix.Nakit + mix['Kredi Kartı'] + mix.other || 1
    return [
      { label: 'Nakit', value: mix.Nakit, pct: Math.round((mix.Nakit / total) * 100), color: 'bg-emerald-500' },
      { label: 'Kart', value: mix['Kredi Kartı'], pct: Math.round((mix['Kredi Kartı'] / total) * 100), color: 'bg-blue-500' },
      { label: 'Diğer', value: mix.other, pct: Math.round((mix.other / total) * 100), color: 'bg-violet-500' },
    ]
  }, [history])

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <p className="text-xs font-bold text-white">Ödeme Dağılımı</p>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-dark-700">
        {totals.map((item) => (
          item.pct > 0 ? <div key={item.label} className={item.color} style={{ width: `${item.pct}%` }} /> : null
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {totals.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-gray-500">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
            <span className="font-bold tabular-nums text-gray-200">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const defaultCartMeta = {
  customerName: 'Perakende Müşteri',
  paymentMethod: 'cash',
  note: '',
  description: '',
  discountType: 'percent',
  discountValue: 0,
}

export default function ShoppingPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(() => readStorage(CART_KEY, []))
  const [history, setHistory] = useState(() => readStorage(HISTORY_KEY, []))
  const [meta, setMeta] = useState(() => ({ ...defaultCartMeta, ...readStorage(CART_META_KEY, defaultCartMeta) }))
  const [activeQuickAction, setActiveQuickAction] = useState(null)
  const [lastReceipt, setLastReceipt] = useState(null)

  const categoryOptions = useMemo(() => getStoreSalesCategories(products), [products])

  useEffect(() => {
    let cancelled = false

    async function refreshProducts() {
      const loaded = await getStoreSalesProductsWithMedia()
      if (!cancelled) setProducts(loaded)
    }

    refreshProducts()
    window.addEventListener('erlenbox:products-updated', refreshProducts)
    window.addEventListener('storage', refreshProducts)
    return () => {
      cancelled = true
      window.removeEventListener('erlenbox:products-updated', refreshProducts)
      window.removeEventListener('storage', refreshProducts)
    }
  }, [])

  const {
    customerName,
    paymentMethod,
    note,
    description,
    discountType,
    discountValue,
  } = meta

  function updateMeta(patch) {
    setMeta((current) => ({ ...current, ...patch }))
  }

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem(CART_META_KEY, JSON.stringify(meta))
  }, [meta])

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR')
    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category
      const matchesQuery = !normalized
        || product.name.toLocaleLowerCase('tr-TR').includes(normalized)
        || product.id.toLocaleLowerCase('tr-TR').includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [category, query, products])

  const totals = useMemo(() => {
    const base = cart.reduce((summary, item) => {
      const lineSubtotal = item.price * item.quantity
      const lineVat = lineSubtotal * (item.vatRate / 100)
      return {
        subtotal: summary.subtotal + lineSubtotal,
        vat: summary.vat + lineVat,
        quantity: summary.quantity + item.quantity,
      }
    }, { subtotal: 0, vat: 0, quantity: 0 })

    const rawDiscount = discountType === 'percent'
      ? base.subtotal * (Math.max(0, discountValue) / 100)
      : Math.max(0, discountValue)
    const discount = Math.min(rawDiscount, base.subtotal)
    const ratio = base.subtotal > 0 ? (base.subtotal - discount) / base.subtotal : 1
    const adjustedVat = base.vat * ratio
    const grandTotal = Math.max(0, base.subtotal - discount + adjustedVat)

    return {
      ...base,
      discount,
      vat: adjustedVat,
      grandTotal,
    }
  }, [cart, discountType, discountValue])

  const grandTotal = totals.grandTotal
  const dailyRevenue = history.reduce((sum, sale) => sum + sale.grandTotal, 0)

  const quickActions = [
    { id: 'discount', label: 'İndirim Uygula', icon: Percent },
    { id: 'customer', label: 'Müşteri Ekle', icon: UserRound },
    { id: 'note', label: 'Not Ekle', icon: StickyNote },
    { id: 'description', label: 'Açıklama Ekle', icon: FileText },
  ]

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      setCart((current) => {
        const item = current.find((cartItem) => cartItem.id === productId)
        if (item) {
          appendActivityEntry({
            module: 'shopping',
            action: 'delete',
            entityType: 'cartItem',
            entityId: item.id,
            entityLabel: item.name,
            description: `${item.name} sepetten kaldırıldı.`,
            snapshot: item,
            undo: { type: 'shopping.restoreCartItem' },
          })
        }
        return current.filter((item) => item.id !== productId)
      })
      return
    }
    setCart((current) => current.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  function completePayment(methodOverride) {
    if (cart.length === 0) {
      window.alert('Sepete en az bir ürün ekleyin.')
      return
    }

    const methodId = methodOverride || paymentMethod
    const invoiceNo = `SHOP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(history.length + 1).padStart(3, '0')}`
    const sale = {
      id: invoiceNo,
      date: today(),
      customerName: customerName.trim() || 'Perakende Müşteri',
      paymentMethod: paymentMethods.find((method) => method.id === methodId)?.label || 'Ödeme',
      note: note.trim(),
      description: description.trim(),
      discount: totals.discount,
      discountType,
      discountValue,
      items: cart,
      subtotal: totals.subtotal,
      vat: totals.vat,
      grandTotal,
      status: 'Tamamlandı',
    }

    setHistory((current) => [sale, ...current])
    setLastReceipt(sale)
    setCart([])
    updateMeta({
      paymentMethod: methodId,
      note: '',
      description: '',
      discountValue: 0,
    })
    setActiveQuickAction(null)
  }

  function clearHistory() {
    if (!window.confirm('Kayıtlı satış geçmişi temizlensin mi?')) return
    appendActivityEntry({
      module: 'shopping',
      action: 'delete',
      entityType: 'salesHistory',
      entityId: 'shopping-history',
      entityLabel: 'Satış geçmişi',
      description: `${history.length} alışveriş geçmişi temizlendi.`,
      snapshot: history,
      undo: { type: 'shopping.restoreHistory' },
    })
    setHistory([])
    setLastReceipt(null)
  }

  function clearCart() {
    if (!cart.length) return
    appendActivityEntry({
      module: 'shopping',
      action: 'delete',
      entityType: 'cart',
      entityId: 'active-cart',
      entityLabel: 'Sepet',
      description: `${cart.length} sepet satırı temizlendi.`,
      snapshot: cart,
      undo: { type: 'shopping.restoreCart' },
    })
    setCart([])
  }

  function handleRestoreArchiveEntry(entry) {
    if (entry.entityType === 'cartItem' && entry.snapshot?.id) {
      setCart((current) => (current.some((item) => item.id === entry.snapshot.id) ? current : [...current, entry.snapshot]))
      return true
    }
    if (entry.entityType === 'cart' && Array.isArray(entry.snapshot)) {
      setCart(entry.snapshot)
      return true
    }
    if (entry.entityType === 'salesHistory' && Array.isArray(entry.snapshot)) {
      setHistory(entry.snapshot)
      setLastReceipt(entry.snapshot[0] || null)
      return true
    }
    return false
  }

  return (
    <AppPageShell>
      <AppPageHeader title="Mağaza Satışı" />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Sepet Ürünü', value: totals.quantity, icon: ShoppingBag, tone: 'orange', valueTone: 'orange' },
          { title: 'Sepet Toplamı', value: formatCurrency(grandTotal), icon: Receipt, tone: 'blue', valueTone: 'blue' },
          { title: 'Günlük Fiş', value: history.length, icon: CheckCircle2, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Günlük Ciro', value: formatCurrency(dailyRevenue), icon: WalletCards, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <AppPagePanel
            title="Ürün Kataloğu"
            description="Çikolata kutularını ve ürünleri arayın, doğrudan sepete ekleyin."
            action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{filteredProducts.length} ürün</span>}
          >
            <SearchInput
              wrapperClassName="mb-4"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ürün adı veya ürün kodu ara..."
            />

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                    category === option.value
                      ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/40'
                      : 'bg-dark-700/70 text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.length === 0 ? (
                <p className="col-span-full rounded-xl border border-dashed border-dark-500/60 bg-dark-800/40 py-10 text-center text-xs text-gray-500">
                  Mağaza satışında görünecek ürün yok. Ürün kartından &quot;Mağaza satışında görünsün&quot; seçeneğini açın.
                </p>
              ) : filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-dark-500/45 bg-dark-800/55 p-2 transition-all hover:border-blue-400/35 hover:bg-dark-700/45"
                >
                  <ProductVisual product={product} />
                  <div className="mt-2 px-1 pb-1">
                    <p className="line-clamp-2 min-h-[2.5rem] text-xs font-bold leading-5 text-white">{product.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-black tabular-nums text-blue-300">{formatCurrency(product.price)}</p>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="btn-primary flex h-8 w-8 items-center justify-center rounded-full p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-gray-500">Stok: {product.stock}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon
                const isActive = activeQuickAction === action.id
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setActiveQuickAction(isActive ? null : action.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-bold transition-colors ${
                      isActive
                        ? 'border-blue-400/45 bg-blue-500/10 text-blue-200'
                        : 'border-dark-500/45 bg-dark-700/40 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                )
              })}
            </div>

            {activeQuickAction && (
              <div className="mt-3 rounded-xl border border-blue-400/25 bg-blue-500/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-200">
                    {quickActions.find((action) => action.id === activeQuickAction)?.label}
                  </p>
                  <button type="button" onClick={() => setActiveQuickAction(null)} className="text-gray-500 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {activeQuickAction === 'discount' && (
                  <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)_auto]">
                    <select
                      value={discountType}
                      onChange={(event) => updateMeta({ discountType: event.target.value })}
                      className="form-input text-xs"
                    >
                      <option value="percent">Yüzde (%)</option>
                      <option value="amount">Tutar (₺)</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step={discountType === 'percent' ? '1' : '0.01'}
                      value={discountValue || ''}
                      onChange={(event) => updateMeta({ discountValue: Number(event.target.value) || 0 })}
                      placeholder={discountType === 'percent' ? 'Örn. 10' : 'Örn. 50'}
                      className="form-input text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => updateMeta({ discountValue: 0 })}
                      className="rounded-xl border border-dark-500/45 bg-dark-700/40 px-3 py-2 text-xs font-bold text-gray-400"
                    >
                      Sıfırla
                    </button>
                  </div>
                )}

                {activeQuickAction === 'customer' && (
                  <div className="space-y-3">
                    <input
                      value={customerName}
                      onChange={(event) => updateMeta({ customerName: event.target.value })}
                      placeholder="Müşteri adı girin..."
                      className="form-input text-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                      {quickCustomerPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateMeta({ customerName: preset })}
                          className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                            customerName === preset
                              ? 'bg-blue-500 text-white'
                              : 'border border-dark-500/45 bg-dark-700/40 text-gray-400'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeQuickAction === 'note' && (
                  <textarea
                    value={note}
                    onChange={(event) => updateMeta({ note: event.target.value })}
                    placeholder="Fiş notu, paketleme veya teslimat detayı..."
                    className="form-input min-h-20 resize-none text-xs"
                  />
                )}

                {activeQuickAction === 'description' && (
                  <textarea
                    value={description}
                    onChange={(event) => updateMeta({ description: event.target.value })}
                    placeholder="Satış açıklaması, kampanya veya özel talep..."
                    className="form-input min-h-20 resize-none text-xs"
                  />
                )}
              </div>
            )}

            {(note || description || totals.discount > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {totals.discount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[12px] font-bold text-emerald-300">
                    <Tag className="h-3 w-3" />
                    İndirim {formatCurrency(totals.discount)}
                  </span>
                )}
                {note && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[12px] font-bold text-amber-300">
                    <StickyNote className="h-3 w-3" />
                    Not eklendi
                  </span>
                )}
                {description && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[12px] font-bold text-blue-300">
                    <FileText className="h-3 w-3" />
                    Açıklama eklendi
                  </span>
                )}
              </div>
            )}
          </AppPagePanel>

          <AppPagePanel
            title="Son Satışlar"
            description="Bugün kesilen fişler"
            action={history.length > 0 ? (
              <button type="button" onClick={clearHistory} className="text-xs font-black text-red-300">
                Temizle
              </button>
            ) : null}
          >
            {history.length === 0 ? (
              <p className="rounded-xl border border-dashed border-dark-500/60 bg-dark-800/40 py-8 text-center text-xs text-gray-500">
                Henüz satış kaydı yok.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-dark-500/40 text-[12px] font-bold uppercase tracking-wide text-gray-500">
                      <th className="pb-2 pr-3">Fiş No</th>
                      <th className="pb-2 pr-3">Tarih</th>
                      <th className="pb-2 pr-3">Müşteri</th>
                      <th className="pb-2 pr-3">Ödeme</th>
                      <th className="pb-2 pr-3 text-right">Tutar</th>
                      <th className="pb-2 pr-3 text-right">İndirim</th>
                      <th className="pb-2 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 8).map((sale) => (
                      <tr key={sale.id} className="border-b border-dark-500/25 last:border-0">
                        <td className="py-2.5 pr-3 font-bold text-blue-300">{sale.id}</td>
                        <td className="py-2.5 pr-3 text-gray-500">{sale.date}</td>
                        <td className="py-2.5 pr-3 font-semibold text-white">{sale.customerName}</td>
                        <td className="py-2.5 pr-3 text-gray-500">{sale.paymentMethod}</td>
                        <td className="py-2.5 pr-3 text-right font-bold tabular-nums text-white">{formatCurrency(sale.grandTotal)}</td>
                        <td className="py-2.5 pr-3 text-right text-emerald-300">
                          {sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[12px] font-bold text-emerald-300">{sale.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppPagePanel>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <AppPagePanel
            title="Satış Sepeti"
            description="Tahsilat bekleyen ürünler"
            action={cart.length > 0 ? (
              <button type="button" onClick={clearCart} className="text-xs font-black text-red-300">Temizle</button>
            ) : null}
          >
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="rounded-xl border border-dashed border-dark-500/60 bg-dark-800/40 py-10 text-center text-xs text-gray-500">
                  Sepet boş — ürün ekleyin
                </p>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 rounded-xl border border-dark-500/45 bg-dark-700/40 p-2">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-dark-700/50">
                    {(item.imageUrl || item.image)?.startsWith?.('data:') || (item.imageUrl || item.image)?.startsWith?.('http') ? (
                      <img src={item.imageUrl || item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: item.image }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{item.name}</p>
                    <p className="text-[12px] text-gray-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center rounded-lg border border-dark-500/45 bg-dark-800/70">
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 text-gray-400 hover:text-white">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-6 text-center text-xs font-black text-white">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 text-gray-400 hover:text-white">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="w-16 shrink-0 text-right text-xs font-bold tabular-nums text-white">
                    {formatCurrency(item.price * item.quantity * (1 + item.vatRate / 100))}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-dark-500/40 pt-3 text-xs">
              <div className="flex justify-between text-gray-500"><span>Ara Toplam</span><span className="font-semibold tabular-nums text-gray-200">{formatCurrency(totals.subtotal)}</span></div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>İndirim</span>
                  <span className="font-semibold tabular-nums">-{formatCurrency(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500"><span>KDV</span><span className="font-semibold tabular-nums text-gray-200">{formatCurrency(totals.vat)}</span></div>
              <div className="flex justify-between pt-1 text-base font-black text-white">
                <span>Toplam</span>
                <span className="tabular-nums text-blue-300">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-dark-500/45 bg-dark-700/40 px-3 py-2">
              <p className="text-[12px] font-bold uppercase tracking-wide text-gray-500">Müşteri</p>
              <p className="mt-0.5 truncate text-xs font-bold text-white">{customerName || 'Perakende Müşteri'}</p>
              {(note || description) && (
                <p className="mt-1 line-clamp-2 text-[12px] text-gray-500">
                  {[note, description].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = paymentMethod === method.id
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      updateMeta({ paymentMethod: method.id })
                      if (cart.length) completePayment(method.id)
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold transition-all ${
                      isSelected
                        ? `${method.tone} ring-2 ring-offset-1 ring-offset-dark-800 ${method.selectedRing}`
                        : 'border border-dark-500/45 bg-dark-700/40 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {method.label}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => completePayment()}
              className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-3 text-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Ödeme Al
            </button>
          </AppPagePanel>

          <StoreBalanceCard history={history} />
          <DailySalesSparkline history={history} />
          <PaymentMixBar history={history} />

          {(lastReceipt || history[0]) && (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-300" />
                <p className="text-xs font-bold text-emerald-300">Son Fiş</p>
              </div>
              {(() => {
                const receipt = lastReceipt || history[0]
                return (
                  <div className="mt-2">
                    <p className="text-[12px] font-bold text-emerald-300">{receipt.id}</p>
                    <p className="mt-1 text-lg font-black tabular-nums text-white">{formatCurrency(receipt.grandTotal)}</p>
                    <p className="mt-1 text-[12px] text-gray-500">{receipt.customerName} · {receipt.paymentMethod}</p>
                    {receipt.discount > 0 && (
                      <p className="mt-1 text-[12px] font-bold text-emerald-300">İndirim: -{formatCurrency(receipt.discount)}</p>
                    )}
                    {(receipt.note || receipt.description) && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-gray-500">{[receipt.note, receipt.description].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-800/70 px-3 py-2 text-[12px] text-gray-500">
            <Clock3 className="h-3.5 w-3.5" />
            Kısayol: ürün kartındaki + ile hızlı ekleme
          </div>
        </aside>
      </div>

      <ActivityArchivePanel
        title="Mağaza Satışı Arşiv ve İşlem Geçmişi"
        modules={['shopping']}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz mağaza satışı arşiv veya silme kaydı yok."
      />
    </AppPageShell>
  )
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback
    const parsed = JSON.parse(value)
    return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : parsed
  } catch {
    return fallback
  }
}
