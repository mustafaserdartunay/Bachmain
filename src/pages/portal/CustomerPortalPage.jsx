import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Building2,
  CreditCard,
  Factory,
  FileText,
  Landmark,
  MessageSquare,
  Minus,
  Package,
  Plus,
  Send,
  ShoppingCart,
  Trash2,
  Truck,
  UserRound,
  WalletCards,
} from 'lucide-react'
import ThemeModeIcon from '../../components/Common/ThemeModeIcon'
import {
  createB2bOrder,
  createB2bTicket,
  findCustomerByToken,
  hydrateB2bPortalSnapshot,
  readB2bOrders,
  readB2bQuotes,
  readB2bShipments,
  readB2bTickets,
} from '../../utils/b2bPortalStore'
import { fetchB2bPortalSnapshot } from '../../utils/platformAuth'
import {
  countActiveProductionJobs,
  readCustomerProductionTracking,
} from '../../utils/customerPortalProduction'
import CustomerPortalProductionView from '../../components/Portal/CustomerPortalProductionView'
import CustomerPortalSevkiyatView from '../../components/Portal/CustomerPortalSevkiyatView'
import { readCustomerPortalSettings } from '../../utils/customerPortalSettings'
import { readCompanySettings } from '../../utils/companySettings'
import {
  getCatalogProducts,
  getCustomerProductPrice,
  getProductCategories,
  getStockStatus,
  getTotalStock,
  stripCostFields,
} from '../../utils/productCatalog'
import { formatTL } from '../../utils/productPricing'
import {
  formatCustomerStatementAmount,
  formatTreasuryCurrency,
  getCustomerCollections,
  getCustomerPayments,
  getCustomerStatementAmountTone,
  getTreasuryMovements,
} from '../../utils/treasuryStore'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import {
  cycleTheme,
  getStoredTheme,
  THEME_MODES,
  THEME_TOGGLE_BUTTON_CLASS,
} from '../../utils/themeMode'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

const TABS = [
  { id: 'dashboard', label: 'Özet', icon: Building2 },
  { id: 'cari', label: 'Cari', icon: WalletCards },
  { id: 'products', label: 'Ürünler', icon: Package },
  { id: 'cart', label: 'Sepet', icon: ShoppingCart },
  { id: 'quotes', label: 'Teklif & Sipariş', icon: FileText },
  { id: 'production', label: 'Üretim', icon: Factory },
  { id: 'sevkiyat', label: 'Sevkiyat', icon: Truck },
  { id: 'notes', label: 'Canlı Not', icon: MessageSquare },
  { id: 'profile', label: 'Profil', icon: UserRound },
]

function cartStorageKey(token) {
  return `erlenbox-b2b-cart-${token}`
}

function readCart(token) {
  try {
    const saved = localStorage.getItem(cartStorageKey(token))
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function writeCart(token, cart) {
  localStorage.setItem(cartStorageKey(token), JSON.stringify(cart))
}

export default function CustomerPortalPage() {
  const { token } = useParams()
  const [theme, setTheme] = useState(getStoredTheme)
  const [tab, setTab] = useState('dashboard')
  const [session, setSession] = useState(() => findCustomerByToken(token))
  const [movements, setMovements] = useState(() => getTreasuryMovements())
  const [orders, setOrders] = useState([])
  const [quotes, setQuotes] = useState([])
  const [productionJobs, setProductionJobs] = useState([])
  const [shipments, setShipments] = useState([])
  const [tickets, setTickets] = useState([])
  const [catalog, setCatalog] = useState(() => getCatalogProducts().map(stripCostFields))
  const [cart, setCart] = useState(() => readCart(token))
  const [categoryFilter, setCategoryFilter] = useState('Tümü')
  const [noteText, setNoteText] = useState('')
  const [orderNote, setOrderNote] = useState('')
  const [cartToast, setCartToast] = useState('')
  const [checkoutStep, setCheckoutStep] = useState('cart')
  const [paymentMethod, setPaymentMethod] = useState('havale')
  const [lastOrderId, setLastOrderId] = useState(null)
  const [portalLoading, setPortalLoading] = useState(() => !findCustomerByToken(token))
  const [portalError, setPortalError] = useState('')

  const activeTheme = THEME_MODES[theme] || THEME_MODES.dark

  useEffect(() => {
    writeCart(token, cart)
  }, [cart, token])

  const refreshCatalog = useCallback(() => {
    setCatalog(getCatalogProducts().map(stripCostFields))
  }, [])

  const refreshData = useCallback(
    (customer) => {
      setMovements(getTreasuryMovements())
      setOrders(readB2bOrders(customer.id))
      setQuotes(readB2bQuotes(customer.id))
      setProductionJobs(readCustomerProductionTracking(customer))
      setShipments(readB2bShipments(customer.id))
      setTickets(readB2bTickets(customer.id))
      refreshCatalog()
    },
    [refreshCatalog],
  )

  useEffect(() => {
    let cancelled = false
    async function bootstrapPortal() {
      const local = findCustomerByToken(token)
      if (local) {
        setSession(local)
        refreshData(local.customer)
        setPortalLoading(false)
        return
      }

      setPortalLoading(true)
      setPortalError('')
      try {
        const snapshot = await fetchB2bPortalSnapshot(token)
        if (cancelled || !snapshot) return
        hydrateB2bPortalSnapshot(snapshot)
        const remote = findCustomerByToken(token)
        setSession(remote)
        if (remote) refreshData(remote.customer)
        else setPortalError('Panel verileri yüklenemedi.')
      } catch (error) {
        if (!cancelled) {
          setPortalError(error.message || 'B2B panel bağlantısı yüklenemedi.')
        }
      } finally {
        if (!cancelled) setPortalLoading(false)
      }
    }
    bootstrapPortal()
    return () => {
      cancelled = true
    }
  }, [refreshData, token])

  useEffect(() => {
    if (!session?.customer) return undefined
    const interval = setInterval(() => refreshCatalog(), 8000)
    function sync() {
      refreshData(session.customer)
    }
    window.addEventListener('erlenbox:b2b-updated', sync)
    window.addEventListener('erlenbox:treasury-updated', sync)
    window.addEventListener('bach:production-updated', sync)
    window.addEventListener('bach:sevkiyat-updated', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', refreshCatalog)
    return () => {
      clearInterval(interval)
      window.removeEventListener('erlenbox:b2b-updated', sync)
      window.removeEventListener('erlenbox:treasury-updated', sync)
      window.removeEventListener('bach:production-updated', sync)
      window.removeEventListener('bach:sevkiyat-updated', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', refreshCatalog)
    }
  }, [refreshCatalog, refreshData, session?.customer])

  const categories = useMemo(() => ['Tümü', ...getProductCategories(catalog)], [catalog])

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'Tümü') return catalog
    return catalog.filter((product) => product.category === categoryFilter)
  }, [catalog, categoryFilter])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  if (portalLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 p-6">
        <div className="card max-w-md text-center">
          <p className="text-lg font-black text-white">B2B paneliniz hazırlanıyor</p>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            Güncel firma verileriniz güvenli bağlantıdan yükleniyor.
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 p-6">
        <div className="card max-w-md text-center">
          <p className="text-lg font-black text-white">Panel erişimi bulunamadı</p>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            {portalError || 'Bağlantınız geçersiz veya B2B erişiminiz kapatılmış olabilir.'}
          </p>
        </div>
      </div>
    )
  }

  const { customer, access, isDealer } = session
  const display = getCustomerDisplay(customer)
  const company = readCompanySettings()
  const portalPrefs = readCustomerPortalSettings(customer.id, customer)
  const visibleBankAccounts = company.bankAccounts.filter((account) =>
    portalPrefs.sharedIbanIds?.includes(account.id),
  )
  const collections = getCustomerCollections(customer.company, movements)
  const payments = getCustomerPayments(customer.company, movements)
  const opening = Number(customer.balance) || 0
  const collected = collections.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const paid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const balance = opening + collected - paid

  const statementRows = [
    ...payments.map((m) => ({ ...m, isPayment: true })),
    ...collections.map((m) => ({ ...m, isPayment: false })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)))

  function getPrice(product) {
    const custom = access.customPrices?.[product.id]
    return getCustomerProductPrice(product, { isDealer, customPrice: custom })
  }

  function showCartToast(message) {
    setCartToast(message)
    setTimeout(() => setCartToast(''), 1800)
  }

  function addToCart(product, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity, unitPrice: getPrice(product) }
            : item,
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: getPrice(product),
          stockAtAdd: getTotalStock(product),
        },
      ]
    })
    showCartToast(`${product.name} sepete eklendi`)
  }

  function updateCartQty(productId, delta) {
    setCart((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    )
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  function submitOrder() {
    if (cart.length === 0) return
    const order = createB2bOrder({
      customerId: customer.id,
      customerName: customer.company,
      lines: cart,
      note: `[${paymentMethod}] ${orderNote}`.trim(),
      paymentMethod,
      total: cartTotal,
    })
    setLastOrderId(order.id)
    setCart([])
    setOrderNote('')
    setCheckoutStep('success')
    refreshData(customer)
  }

  function submitNote(event) {
    event.preventDefault()
    if (!noteText.trim()) return
    createB2bTicket({
      customerId: customer.id,
      customerName: customer.company,
      message: noteText.trim(),
    })
    setNoteText('')
    refreshData(customer)
  }

  return (
    <div className="min-h-screen bg-dark-900 transition-colors">
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-black text-emerald-200 shadow-xl">
          {cartToast}
        </div>
      )}

      <header className="border-b border-dark-500/50 bg-dark-800/90 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-dark-500/50 bg-dark-700">
              {company.logoDataUrl ? (
                <img src={company.logoDataUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-5 w-5 text-blue-300" />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-white">{company.companyName}</p>
              <p className="text-xs font-semibold text-gray-500">
                B2B Müşteri Paneli · {display.brandShortName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((current) => cycleTheme(current))}
              className={THEME_TOGGLE_BUTTON_CLASS}
              title={`Görünüm: ${activeTheme.label}`}
            >
              <ThemeModeIcon mode={theme} className="h-5 w-5 shrink-0" />
              <span className="truncate">{activeTheme.label}</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('cart')}
              className="relative flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black text-gray-300 transition-colors hover:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Sepet
              {cartCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[12px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-right">
              <p className="text-[12px] font-black uppercase tracking-wider text-blue-300">
                Güncel Bakiye
              </p>
              <p
                className={`text-sm font-black ${balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
              >
                {formatTreasuryCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-5 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="card h-fit space-y-1 p-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide transition-colors ${
                tab === id
                  ? 'bg-blue-500/15 text-blue-200'
                  : 'text-gray-400 hover:bg-dark-700/60 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {id === 'cart' && cartCount > 0 && (
                <span className="ml-auto rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[12px] text-blue-200">
                  {cartCount}
                </span>
              )}
            </button>
          ))}
        </aside>

        <main className="space-y-4">
          {tab === 'dashboard' && (
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                [
                  'Açık Sipariş',
                  orders.filter((o) => o.status !== 'Tamamlandı').length,
                  'text-blue-300',
                ],
                ['Sepet', cartCount, 'text-cyan-300'],
                ['Üretimde', countActiveProductionJobs(productionJobs), 'text-amber-300'],
                [
                  'Sevkiyat',
                  shipments.filter((s) =>
                    ['planned', 'in_transit'].includes(s.status),
                  ).length,
                  'text-sky-300',
                ],
                ['Canlı Not', tickets.length, 'text-emerald-300'],
              ].map(([label, value, tone]) => (
                <div key={label} className="card">
                  <p className="text-[12px] font-black uppercase tracking-wider text-gray-500">
                    {label}
                  </p>
                  <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
                </div>
              ))}
            </section>
          )}

          {tab === 'cari' && (
            <section className="card overflow-hidden p-0">
              <div className="grid grid-cols-[130px_130px_minmax(0,1fr)_120px_110px] border-b border-dark-500/45 px-5 py-3 text-[13px] font-black uppercase tracking-wider text-gray-500">
                <span>İşlem Türü</span>
                <span>İşlem Yeri</span>
                <span>Açıklama</span>
                <span>Tarih</span>
                <span className="text-right">Meblağ</span>
              </div>
              <div className="divide-y divide-dark-500/35">
                {statementRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[130px_130px_minmax(0,1fr)_120px_110px] items-center px-5 py-4 text-sm"
                  >
                    <span className="font-bold text-gray-300">
                      {row.method} {row.isPayment ? 'Ödeme' : 'Tahsilat'}
                    </span>
                    <span className="truncate text-xs text-gray-500">{row.accountName || '—'}</span>
                    <span className="truncate text-xs text-gray-500">{row.description}</span>
                    <span className="text-xs text-gray-500">{row.date}</span>
                    <span
                      className={`text-right font-black ${getCustomerStatementAmountTone(row)}`}
                    >
                      {formatCustomerStatementAmount(row)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'products' && (
            <section className="space-y-4">
              <div className="card">
                <p className="mb-3 text-[12px] font-black uppercase tracking-wider text-gray-500">
                  Kategori
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setCategoryFilter(category)}
                      className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
                        categoryFilter === category
                          ? 'bg-blue-500/20 text-blue-200'
                          : 'border border-dark-500/45 bg-dark-700/40 text-gray-400 hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13px] font-semibold text-gray-500">
                  Stok durumları canlı güncellenir · Stok yoksa da sipariş verebilirsiniz
                </p>
              </div>

              <section className="card overflow-hidden p-0">
                <div className="grid grid-cols-[72px_minmax(0,1.4fr)_120px_100px_110px_120px] border-b border-dark-500/45 px-4 py-3 text-[12px] font-black uppercase tracking-wider text-gray-500">
                  <span>Görsel</span>
                  <span>Ürün</span>
                  <span>Kategori</span>
                  <span className="text-right">Stok</span>
                  <span className="text-right">Fiyat</span>
                  <span className="text-right">İşlem</span>
                </div>
                <div className="divide-y divide-dark-500/35">
                  {filteredProducts.map((product) => {
                    const stock = getTotalStock(product)
                    const stockInfo = getStockStatus(stock)
                    const price = getPrice(product)
                    const listPrice = getCustomerProductPrice(product, { isDealer: false })
                    const inCart = cart.find((item) => item.productId === product.id)
                    return (
                      <div
                        key={product.id}
                        className="grid grid-cols-[72px_minmax(0,1.4fr)_120px_100px_110px_120px] items-center gap-2 px-4 py-3"
                      >
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-dark-500/40 bg-dark-700/40">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-black text-gray-600">
                              {product.name.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{product.name}</p>
                          <p className="truncate text-[13px] font-semibold text-gray-500">
                            {product.stockCode}
                          </p>
                          {inCart && (
                            <p className="mt-0.5 text-[12px] font-bold text-blue-300">
                              Sepette: {inCart.quantity} adet
                            </p>
                          )}
                        </div>
                        <span className="truncate text-xs font-semibold text-gray-500">
                          {product.category || '—'}
                        </span>
                        <div className="text-right">
                          <p className={`text-sm font-black ${stockInfo.tone}`}>{stock}</p>
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-black uppercase ${stockInfo.badge}`}
                          >
                            {stockInfo.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-300">{formatTL(price)}</p>
                          {isDealer && price !== listPrice && (
                            <p className="text-[12px] text-gray-500 line-through">
                              {formatTL(listPrice)}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-2 text-[12px] font-black uppercase text-blue-200 transition-colors hover:bg-blue-500/20"
                          >
                            Sepete Ekle
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </section>
          )}

          {tab === 'cart' && (
            <section className="space-y-4">
              {checkoutStep === 'success' ? (
                <div className="card space-y-4 text-center">
                  <p className="text-lg font-black text-emerald-300">Siparişiniz alındı</p>
                  <p className="text-xs text-gray-500">Sipariş no: {lastOrderId}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep('cart')
                      setTab('quotes')
                    }}
                    className={`${BTN_PRIMARY} px-4 py-3 text-xs uppercase`}
                  >
                    Siparişlerime Git
                  </button>
                </div>
              ) : checkoutStep === 'payment' ? (
                <div className="space-y-4">
                  <div className="card space-y-3">
                    <p className="text-sm font-black text-white">Ödeme Yöntemi</p>
                    <p className="text-xs text-gray-500">
                      Toplam:{' '}
                      <span className="font-black text-emerald-300">{formatTL(cartTotal)}</span>
                    </p>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        ['havale', 'Havale / EFT', Landmark],
                        ['kart', 'Kredi Kartı', CreditCard],
                        ['cari', 'Cari Hesap', WalletCards],
                      ].map(([id, label, Icon]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPaymentMethod(id)}
                          disabled={id === 'kart' && !portalPrefs.onlineCollection}
                          className={`rounded-xl border p-4 text-left transition-all ${
                            paymentMethod === id
                              ? 'border-blue-400/50 bg-blue-500/15'
                              : 'border-dark-500/45 bg-dark-700/30 hover:border-dark-400/60'
                          } ${id === 'kart' && !portalPrefs.onlineCollection ? 'opacity-40' : ''}`}
                        >
                          <Icon className="mb-2 h-5 w-5 text-blue-300" />
                          <p className="text-xs font-black text-white">{label}</p>
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'havale' && (
                      <div className="space-y-2 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4">
                        <p className="text-[12px] font-black uppercase text-gray-500">
                          Havale Bilgileri
                        </p>
                        {visibleBankAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="rounded-xl border border-dark-500/35 px-3 py-2"
                          >
                            <p className="text-xs font-bold text-gray-300">
                              {account.bankName} · {account.label}
                            </p>
                            <p className="text-[13px] text-gray-500">{account.iban}</p>
                          </div>
                        ))}
                        <p className="text-[13px] text-gray-500">
                          Açıklama kısmına sipariş numaranızı yazınız.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'kart' && portalPrefs.onlineCollection && (
                      <div className="grid gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4 sm:grid-cols-2">
                        <input placeholder="Kart üzerindeki isim" className="form-input" />
                        <input placeholder="Kart numarası" className="form-input" />
                        <input placeholder="AA/YY" className="form-input" />
                        <input placeholder="CVV" className="form-input" />
                      </div>
                    )}

                    {paymentMethod === 'cari' && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-xs text-gray-400">Tutar cari hesabınıza işlenecek.</p>
                        <p className="mt-1 text-sm font-black text-emerald-300">
                          Güncel bakiye: {formatTreasuryCurrency(balance)}
                        </p>
                      </div>
                    )}

                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      className="form-input min-h-[80px]"
                      placeholder="Sipariş notunuz (isteğe bağlı)"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="flex-1 rounded-xl border border-dark-500/50 bg-dark-700/70 py-3 text-xs font-black text-gray-300 hover:text-white"
                      >
                        Geri
                      </button>
                      <button
                        type="button"
                        onClick={submitOrder}
                        className={`${BTN_PRIMARY} flex-1 py-3 text-xs uppercase`}
                      >
                        Siparişi Onayla
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card space-y-4">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm font-bold text-gray-400">Sepetiniz boş</p>
                      <button
                        type="button"
                        onClick={() => setTab('products')}
                        className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-200 hover:bg-blue-500/20"
                      >
                        Ürünlere Git
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {cart.map((line) => (
                          <div
                            key={line.productId}
                            className="flex flex-wrap items-center gap-3 rounded-xl border border-dark-500/40 bg-dark-700/30 px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-200">{line.productName}</p>
                              <p className="text-xs text-gray-500">
                                {formatTL(line.unitPrice)} / adet
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateCartQty(line.productId, -1)}
                                className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 hover:text-white"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[28px] text-center text-sm font-black text-white">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(line.productId, 1)}
                                className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 hover:text-white"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="min-w-[90px] text-right font-black text-emerald-300">
                              {formatTL(line.quantity * line.unitPrice)}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(line.productId)}
                              className="text-gray-500 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-dark-500/40 pt-4">
                        <p className="text-xs font-black uppercase text-gray-500">Toplam</p>
                        <p className="text-lg font-black text-emerald-300">{formatTL(cartTotal)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('payment')}
                        className={`${BTN_PRIMARY} w-full py-3 text-xs uppercase`}
                      >
                        Ödemeye Geç
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {tab === 'quotes' && (
            <section className="space-y-3">
              {[
                ...orders.map((o) => ({ ...o, kind: 'Sipariş' })),
                ...quotes.map((q) => ({ ...q, kind: 'Teklif' })),
              ].map((item) => (
                <article key={item.id} className="card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">
                        {item.kind} · {item.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <span className="rounded-lg bg-blue-500/15 px-2 py-1 text-[12px] font-black uppercase text-blue-300">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {item.lines.map((line) => (
                      <p key={`${item.id}-${line.productId}`} className="text-xs text-gray-400">
                        {line.productName} · {line.quantity} adet · {formatTL(line.unitPrice)}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}

          {tab === 'production' && <CustomerPortalProductionView jobs={productionJobs} />}

          {tab === 'sevkiyat' && (
            <CustomerPortalSevkiyatView
              trips={shipments}
              customerId={session?.customer?.id}
            />
          )}

          {tab === 'notes' && (
            <section className="space-y-4">
              <form onSubmit={submitNote} className="card space-y-3">
                <p className="text-sm font-black text-white">Canlı Not Gönder</p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="form-input min-h-[100px]"
                  placeholder="Mesajınız yönetim paneline iletilir..."
                />
                <button
                  type="submit"
                  className={`${BTN_PRIMARY} gap-2 px-4 py-2.5 text-xs uppercase`}
                >
                  <Send className="h-4 w-4" /> Gönder
                </button>
              </form>
              {tickets.map((ticket) => (
                <article key={ticket.id} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-gray-400">
                      {new Date(ticket.createdAt).toLocaleString('tr-TR')}
                    </p>
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[12px] font-black text-emerald-300">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{ticket.message}</p>
                  {(ticket.replies || []).map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2"
                    >
                      <p className="text-[12px] font-black uppercase text-blue-300">
                        {reply.author}
                      </p>
                      <p className="mt-1 text-xs text-gray-300">{reply.message}</p>
                    </div>
                  ))}
                </article>
              ))}
            </section>
          )}

          {tab === 'profile' && (
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="card space-y-3">
                <p className="text-sm font-black text-white">Profil Bilgilerim</p>
                <p className="text-xs text-gray-400">Firma: {display.companyTitle}</p>
                <p className="text-xs text-gray-400">Yetkili: {customer.contact || '—'}</p>
                <p className="text-xs text-gray-400">E-posta: {customer.email || '—'}</p>
                <p className="text-xs text-gray-400">Şehir: {customer.city || '—'}</p>
                {isDealer && (
                  <span className="inline-flex rounded-lg bg-emerald-500/15 px-2 py-1 text-[12px] font-black uppercase text-emerald-300">
                    Bayi Hesabı
                  </span>
                )}
              </div>
              <div className="card space-y-3">
                <p className="text-sm font-black text-white">Firma Bilgilerimiz</p>
                <p className="text-xs text-gray-400">{company.legalTitle}</p>
                <p className="text-xs text-gray-400">{company.address}</p>
                <p className="text-xs text-gray-400">
                  {company.phone} · {company.email}
                </p>
                <div className="space-y-2 pt-2">
                  {visibleBankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-xl border border-dark-500/40 bg-dark-700/30 px-3 py-2"
                    >
                      <p className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Landmark className="h-3.5 w-3.5" /> {account.bankName} · {account.label}
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-gray-500">{account.iban}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
