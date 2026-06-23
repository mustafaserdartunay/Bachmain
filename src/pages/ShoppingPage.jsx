import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingBasket,
  Trash2,
  Truck,
  WalletCards,
} from 'lucide-react'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { appendActivityEntry } from '../utils/activityArchiveStore'

const HISTORY_KEY = 'erlenbox-shopping-sales-history'
const CART_KEY = 'erlenbox-shopping-active-cart'

const products = [
  {
    id: 'CHB-001',
    name: 'Premium Madlen Çikolata Kutusu',
    category: 'Chocolate Box',
    description: 'Kurumsal hediye, özel gün ve bayi ziyaretleri için altın detaylı lüks madlen kutusu.',
    image: 'linear-gradient(135deg,#3b1d12,#7c2d12 52%,#f59e0b)',
    price: 1250,
    vatRate: 20,
    stock: 42,
    tag: 'En Çok Satan',
  },
  {
    id: 'CHB-002',
    name: 'Kraft Spesiyal Çikolata Kutusu',
    category: 'Chocolate Box',
    description: 'Günlük satış, hızlı paketleme ve doğal marka dili için kraft dokulu spesiyal kutu.',
    image: 'linear-gradient(135deg,#422006,#92400e 55%,#facc15)',
    price: 780,
    vatRate: 20,
    stock: 68,
    tag: 'Günlük',
  },
  {
    id: 'CHP-003',
    name: 'Bitter Trüf Çikolata 500g',
    category: 'Chocolate Product',
    description: 'Yoğun kakao aromalı bitter trüf; vitrin, paket servis ve özel siparişler için ideal.',
    image: 'linear-gradient(135deg,#111827,#3f1d12 55%,#a16207)',
    price: 540,
    vatRate: 10,
    stock: 96,
    tag: 'Taze Ürün',
  },
  {
    id: 'CHP-004',
    name: 'Sütlü Fındıklı Tablet Seti',
    category: 'Chocolate Product',
    description: 'Beşli tablet seti; kasada hızlı satış ve personel ikram alışverişleri için pratik paket.',
    image: 'linear-gradient(135deg,#4a2c1a,#9a3412 58%,#fed7aa)',
    price: 390,
    vatRate: 10,
    stock: 120,
    tag: 'Ekonomik',
  },
  {
    id: 'CHB-005',
    name: 'VIP Logolu Çikolata Kutusu',
    category: 'Chocolate Box',
    description: 'Firma logosu, kart notu ve premium iç dizilimle kurumsal müşteriye hazır sunum kutusu.',
    image: 'linear-gradient(135deg,#020617,#1e3a8a 54%,#c084fc)',
    price: 1850,
    vatRate: 20,
    stock: 24,
    tag: 'VIP',
  },
  {
    id: 'CHP-006',
    name: 'Karışık Draje ve Pralin Paketi',
    category: 'Chocolate Product',
    description: 'Kasada tamamlayıcı ürün olarak önerilen, günlük alışveriş sepetini büyüten karışık paket.',
    image: 'linear-gradient(135deg,#14532d,#166534 54%,#86efac)',
    price: 320,
    vatRate: 10,
    stock: 150,
    tag: 'Sepet Artırıcı',
  },
]

const paymentMethods = [
  { id: 'card', label: 'Kredi Kartı', icon: CreditCard },
  { id: 'cash', label: 'Nakit', icon: Banknote },
  { id: 'transfer', label: 'Havale / EFT', icon: WalletCards },
]

const categoryOptions = [
  { value: 'All', label: 'Tüm ürünler' },
  { value: 'Chocolate Box', label: 'Çikolata Kutuları' },
  { value: 'Chocolate Product', label: 'Çikolata Ürünleri' },
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

function categoryLabel(value) {
  return categoryOptions.find((option) => option.value === value)?.label || value
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback
    const parsed = JSON.parse(value)
    return Array.isArray(fallback) ? Array.isArray(parsed) ? parsed : fallback : parsed
  } catch {
    return fallback
  }
}

function Panel({ title, description, children, action }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function ProductVisual({ product }) {
  return (
    <div className="relative h-28 overflow-hidden rounded-2xl border border-white/10 shadow-inner" style={{ background: product.image }}>
      <div className="absolute inset-x-5 top-5 h-12 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm" />
      <div className="absolute bottom-4 left-5 right-5 rounded-xl border border-white/15 bg-black/20 px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/75">{categoryLabel(product.category)}</p>
        <p className="truncate text-sm font-black text-white">{product.name}</p>
      </div>
    </div>
  )
}

export default function ShoppingPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState(() => readStorage(CART_KEY, []))
  const [history, setHistory] = useState(() => readStorage(HISTORY_KEY, []))
  const [customerName, setCustomerName] = useState('Perakende Müşteri')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [note, setNote] = useState('Günlük çikolata ve kutu satışı.')
  const [lastReceipt, setLastReceipt] = useState(null)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR')
    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category
      const matchesQuery = !normalized
        || product.name.toLocaleLowerCase('tr-TR').includes(normalized)
        || product.id.toLocaleLowerCase('tr-TR').includes(normalized)
        || product.description.toLocaleLowerCase('tr-TR').includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  const totals = useMemo(() => {
    return cart.reduce((summary, item) => {
      const lineSubtotal = item.price * item.quantity
      const lineVat = lineSubtotal * (item.vatRate / 100)
      return {
        subtotal: summary.subtotal + lineSubtotal,
        vat: summary.vat + lineVat,
        quantity: summary.quantity + item.quantity,
      }
    }, { subtotal: 0, vat: 0, quantity: 0 })
  }, [cart])

  const grandTotal = totals.subtotal + totals.vat
  const dailyRevenue = history.reduce((sum, sale) => sum + sale.grandTotal, 0)

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
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
    setCart((current) => current.map((item) => item.id === productId ? { ...item, quantity } : item))
  }

  function completePayment() {
    if (cart.length === 0) {
      window.alert('Sepete en az bir çikolata kutusu veya ürün ekleyin.')
      return
    }

    const invoiceNo = `SHOP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(history.length + 1).padStart(3, '0')}`
    const sale = {
      id: invoiceNo,
      date: today(),
      customerName: customerName.trim() || 'Perakende Müşteri',
      paymentMethod: paymentMethods.find((method) => method.id === paymentMethod)?.label || 'Ödeme',
      note: note.trim(),
      items: cart,
      subtotal: totals.subtotal,
      vat: totals.vat,
      grandTotal,
      status: 'Tahsil edildi',
    }

    setHistory((current) => [sale, ...current])
    setLastReceipt(sale)
    setCart([])
  }

  function clearHistory() {
    if (window.confirm('Kayıtlı alışveriş geçmişi temizlensin mi?')) {
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
      setCart((current) => current.some((item) => item.id === entry.snapshot.id) ? current : [...current, entry.snapshot])
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
    <div className="space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Alışveriş</h1>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 lg:absolute lg:right-5 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
          {categoryOptions.slice(1).map((option) => (
            <span key={option.value} className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-300">
              {option.label}
            </span>
          ))}
        </div>
      </section>

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Sepet Ürünü', value: totals.quantity, icon: ShoppingBasket, tone: 'orange', valueTone: 'orange' },
          { title: 'Sepet Toplamı', value: formatCurrency(grandTotal), icon: Receipt, tone: 'blue', valueTone: 'blue' },
          { title: 'Kesilen Fiş', value: history.length, icon: BadgeCheck, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Kayıtlı Ciro', value: formatCurrency(dailyRevenue), icon: WalletCards, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_410px]">
        <section className="space-y-4">
          <Panel
            title="Ürün Kataloğu"
            description="Çikolata kutularını ve ürünleri arayın, doğrudan sepete ekleyin."
            action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{filteredProducts.length} ürün</span>}
          >
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_210px] gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ürün adı, ürün kodu veya açıklama ara..."
                  className="form-input pl-10"
                />
              </div>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="form-input">
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article key={product.id} className="rounded-3xl border border-dark-500/45 bg-dark-800/55 p-3 transition-all hover:border-blue-400/35 hover:bg-dark-700/45">
                  <ProductVisual product={product} />
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-black text-blue-300">{product.id}</p>
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-300">{product.tag}</span>
                    </div>
                    <h3 className="min-h-10 text-sm font-black leading-5 text-white">{product.name}</h3>
                    <p className="mt-2 min-h-14 text-xs font-semibold leading-5 text-gray-500">{product.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/45 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Fiyat</p>
                        <p className="mt-1 text-sm font-black text-white">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/45 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Stok</p>
                        <p className="mt-1 text-sm font-black text-emerald-300">{product.stock} adet</p>
                      </div>
                    </div>
                    <button onClick={() => addToCart(product)} className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-sm">
                      <Plus className="h-4 w-4" /> Sepete Ekle
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Satış Geçmişi" description="Tahsil edilen her sepet fiş numarasıyla burada saklanır.">
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-6 text-center">
                  <Receipt className="mx-auto mb-3 h-8 w-8 text-gray-600" />
                  <p className="text-sm font-bold text-white">Henüz kayıtlı fiş yok.</p>
                  <p className="mt-1 text-xs text-gray-500">İlk fişi oluşturmak için ödeme alıp satışı tamamlayın.</p>
                </div>
              ) : (
                history.map((sale) => (
                  <div key={sale.id} className="grid grid-cols-[140px_minmax(0,1fr)_130px_110px] items-center gap-3 rounded-2xl border border-dark-500/45 bg-dark-700/35 p-4">
                    <div>
                      <p className="text-xs font-black text-blue-300">{sale.id}</p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-500">{sale.date}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{sale.customerName}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-gray-500">{sale.items.length} ürün satırı · {sale.paymentMethod}</p>
                    </div>
                    <p className="text-right text-sm font-black text-white">{formatCurrency(sale.grandTotal)}</p>
                    <span className="rounded-xl bg-emerald-500/10 px-3 py-2 text-center text-xs font-black text-emerald-300">{sale.status}</span>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>

        <aside className="space-y-4">
          <Panel
            title="Sepet"
            description="Tahsilat bekleyen ürünler."
            action={cart.length > 0 && (
              <button onClick={clearCart} className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-300">
                Temizle
              </button>
            )}
          >
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-6 text-center">
                  <ShoppingBasket className="mx-auto mb-3 h-9 w-9 text-gray-600" />
                  <p className="text-sm font-bold text-white">Sepet boş.</p>
                  <p className="mt-1 text-xs text-gray-500">Satışa başlamak için ürün ekleyin.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-dark-500/45 bg-dark-700/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{item.name}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-500">{formatCurrency(item.price)} · KDV %{item.vatRate}</p>
                      </div>
                      <button onClick={() => updateQuantity(item.id, 0)} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-xl border border-dark-500/45 bg-dark-800/70">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-gray-400 hover:text-white">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-9 text-center text-sm font-black text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-gray-400 hover:text-white">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-white">{formatCurrency(item.price * item.quantity * (1 + item.vatRate / 100))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Tahsilat ve Fiş" description="Ödemeyi alın, sepeti fişe dönüştürün ve geçmişe kaydedin.">
            <div className="space-y-3">
              <div>
                <label className="form-label">Müşteri Adı</label>
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Ödeme Yöntemi</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`rounded-2xl border p-3 text-center transition-all ${
                          paymentMethod === method.id
                            ? 'border-blue-400/45 bg-blue-500/10 text-blue-200'
                            : 'border-dark-500/45 bg-dark-700/40 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className="mx-auto mb-2 h-4 w-4" />
                        <span className="text-[10px] font-black">{method.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="form-label">Fiş Notu</label>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} className="form-input min-h-20 resize-none" />
              </div>
              <div className="rounded-2xl border border-dark-500/45 bg-dark-700/40 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Ara toplam</span><strong className="text-gray-200">{formatCurrency(totals.subtotal)}</strong></div>
                  <div className="flex justify-between text-gray-500"><span>KDV</span><strong className="text-gray-200">{formatCurrency(totals.vat)}</strong></div>
                  <div className="border-t border-dark-500/45 pt-3">
                    <div className="flex justify-between text-base"><span className="font-black text-white">Genel toplam</span><strong className="text-blue-300">{formatCurrency(grandTotal)}</strong></div>
                  </div>
                </div>
              </div>
              <button onClick={completePayment} className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Ödemeyi Al ve Fiş Kes
              </button>
            </div>
          </Panel>

          <Panel
            title="Son Fiş"
            description="Son tahsil edilen satış hızlı kontrol için burada tutulur."
            action={history.length > 0 && <button onClick={clearHistory} className="text-xs font-black text-red-300">Geçmişi temizle</button>}
          >
            {lastReceipt || history[0] ? (
              <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                {(() => {
                  const receipt = lastReceipt || history[0]
                  return (
                    <>
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <p className="text-xs font-black text-emerald-300">{receipt.id}</p>
                          <p className="mt-1 text-sm font-black text-white">{receipt.customerName}</p>
                        </div>
                        <Receipt className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div className="space-y-2">
                        {receipt.items.map((item) => (
                          <div key={item.id} className="flex justify-between gap-3 text-xs font-semibold text-gray-400">
                            <span>{item.quantity} x {item.name}</span>
                            <span className="text-gray-200">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-2xl bg-dark-900/35 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><CalendarDays className="h-3.5 w-3.5" /> {receipt.date}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-500"><Truck className="h-3.5 w-3.5" /> Teslimat veya mağaza teslimi için hazır</div>
                        <p className="mt-3 text-lg font-black text-white">{formatCurrency(receipt.grandTotal)}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-5 text-center text-sm font-semibold text-gray-500">
                Henüz fiş kesilmedi.
              </p>
            )}
          </Panel>
        </aside>
      </div>
      <ActivityArchivePanel
        title="Shopping Arşiv ve İşlem Geçmişi"
        modules={['shopping']}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz shopping arşiv veya silme kaydı yok."
      />
    </div>
  )
}
