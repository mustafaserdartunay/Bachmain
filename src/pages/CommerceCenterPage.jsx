import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Boxes,
  Building2,
  Cable,
  Globe2,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  Truck,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { commerceSubMenus } from '../data/commerceMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  COMMERCE_UPDATED_EVENT,
  addCouponLocal,
  addPaymentLocal,
  addPriceRuleLocal,
  addReturnLocal,
  addShipmentLocal,
  addSubscriptionLocal,
  aiSalesForecastLocal,
  analyticsLocal,
  analyzeOrderLocal,
  commerceOverviewLocal,
  connectChannelLocal,
  ensureCommerceSeed,
  expandI18nLocal,
  generateProductAiLocal,
  ingestOrderLocal,
  listAnalysesLocal,
  listChannelsLocal,
  listCouponsLocal,
  listI18nLocal,
  listInboxLocal,
  listListingsLocal,
  listPaymentsLocal,
  listPriceRulesLocal,
  listReturnsLocal,
  listShipmentsLocal,
  listStockJobsLocal,
  listSubscriptionsLocal,
  marketplaceCatalogLocal,
  promoteOrderLocal,
  publishListingLocal,
  runStockSyncLocal,
} from '../commerce/localStore'

const TABS = commerceSubMenus

function CloudStub({ title, children, links = [] }) {
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <h2 className="text-sm font-black uppercase text-[var(--ink)]">{title}</h2>
      <div className="mt-2 text-xs text-[var(--muted)]">{children}</div>
      {links.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default function CommerceCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const [overview, setOverview] = useState(() => commerceOverviewLocal())
  const [channels, setChannels] = useState([])
  const [inbox, setInbox] = useState([])
  const [rules, setRules] = useState([])
  const [listings, setListings] = useState([])
  const [jobs, setJobs] = useState([])
  const [i18n, setI18n] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [returns, setReturns] = useState([])
  const [subs, setSubs] = useState([])
  const [shipments, setShipments] = useState([])
  const [payments, setPayments] = useState([])
  const [coupons, setCoupons] = useState([])
  const [msg, setMsg] = useState('')
  const catalog = useMemo(() => marketplaceCatalogLocal(), [])
  const analytics = useMemo(() => analyticsLocal(), [])
  const forecast = useMemo(() => aiSalesForecastLocal(), [])

  function refresh() {
    setOverview(commerceOverviewLocal())
    setChannels(listChannelsLocal())
    setInbox(listInboxLocal())
    setRules(listPriceRulesLocal())
    setListings(listListingsLocal())
    setJobs(listStockJobsLocal())
    setI18n(listI18nLocal())
    setAnalyses(listAnalysesLocal())
    setReturns(listReturnsLocal())
    setSubs(listSubscriptionsLocal())
    setShipments(listShipmentsLocal())
    setPayments(listPaymentsLocal())
    setCoupons(listCouponsLocal())
  }

  useEffect(() => {
    ensureCommerceSeed()
    refresh()
    function onUp() {
      refresh()
    }
    window.addEventListener(COMMERCE_UPDATED_EVENT, onUp)
    return () => window.removeEventListener(COMMERCE_UPDATED_EVENT, onUp)
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'dashboard') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 2200)
  }

  function handleConnect(key) {
    connectChannelLocal(key)
    flash(`${key} bağlandı (stub)`)
    refresh()
  }

  function handleDemoOrder() {
    const order = ingestOrderLocal({
      channelKey: 'trendyol',
      externalOrderId: `TY-${Date.now().toString().slice(-6)}`,
      totalAmount: '12500',
      customerName: 'Kanal Demo',
      lines: [{ sku: 'SKU-DEMO', qty: 1 }],
    })
    publishDomainEvent(
      'trigger.commerce.order.received',
      { inboxId: order.id, channelKey: order.channelKey, externalOrderId: order.externalOrderId },
      { source: 'commerce' },
    )
    flash('Kanal siparişi inbox’a alındı')
    refresh()
  }

  function handlePromote(id) {
    const order = promoteOrderLocal(id)
    if (!order) return
    publishDomainEvent(
      'trigger.order.created',
      {
        source: 'commerce',
        inboxId: order.id,
        channelKey: order.channelKey,
        erpOrderId: order.erpOrderId,
      },
      { source: 'commerce' },
    )
    publishDomainEvent(
      'trigger.commerce.order.promoted',
      { inboxId: order.id, erpOrderId: order.erpOrderId },
      { source: 'commerce' },
    )
    flash('ERP’ye aktarıldı (event)')
    refresh()
  }

  function handleAnalyze(id) {
    const analysis = analyzeOrderLocal(id)
    if (!analysis) return
    publishDomainEvent(
      'trigger.commerce.order.analyzed',
      {
        inboxId: id,
        riskScore: analysis.riskScore,
        recommendation: analysis.recommendation,
      },
      { source: 'commerce' },
    )
    flash(`AI analiz: ${analysis.recommendation} (risk ${analysis.riskScore})`)
    refresh()
  }

  function handleProductAi() {
    const productId = `prd_${Date.now().toString(36)}`
    generateProductAiLocal(productId, 'Global Commerce Ürün')
    publishDomainEvent(
      'trigger.commerce.product.ai',
      { productId, locale: 'tr' },
      { source: 'commerce' },
    )
    flash('Product AI paket üretildi')
    refresh()
  }

  function handleExpandI18n() {
    const last = listI18nLocal()[0]
    const productId = last?.productId || `prd_${Date.now().toString(36)}`
    if (!last) generateProductAiLocal(productId, 'Global Commerce Ürün')
    expandI18nLocal(productId)
    publishDomainEvent(
      'trigger.commerce.product.i18n',
      { productId, locales: 8 },
      { source: 'commerce' },
    )
    flash('8 dil üretildi (TR/EN/DE/FR/ES/IT/AR/RU)')
    refresh()
  }

  function handleStockSync() {
    const job = runStockSyncLocal('all')
    publishDomainEvent(
      'trigger.commerce.stock.synced',
      { jobId: job.id, productsTouched: job.productsTouched },
      { source: 'commerce' },
    )
    flash('Stok senkron tamamlandı (stub)')
    refresh()
  }

  function handlePublishProduct() {
    publishListingLocal({
      channelKey: 'trendyol',
      productId: `prd_${Date.now().toString(36)}`,
      sku: 'SKU-GC0',
      title: 'Product Master → Trendyol',
      price: '999',
      currency: 'TRY',
    })
    flash('Listing yayınlandı (Product Master ref)')
    refresh()
  }

  function handleAddRule() {
    addPriceRuleLocal({
      name: 'Kampanya %5',
      scope: 'campaign',
      adjustmentType: 'percent',
      adjustmentValue: -5,
    })
    flash('Fiyat kuralı eklendi')
    refresh()
  }

  const kpis = [
    { label: 'Bağlı kanal', value: overview.channelsConnected, icon: Globe2 },
    { label: 'Inbox bekleyen', value: overview.inboxPending, icon: ShoppingBag },
    { label: 'Listing', value: overview.listingsTotal, icon: Package },
    { label: 'Aktif fiyat kuralı', value: overview.activePriceRules, icon: Tags },
  ]

  return (
    <AppPageShell>
      <AppPageHeader
        title="Global Commerce Cloud"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/stok/urunler"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Boxes className="h-4 w-4" /> Product Master
            </Link>
            <Link
              to="/siparisler"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <ShoppingBag className="h-4 w-4" /> Siparişler
            </Link>
            <Link
              to="/teklifler"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Tags className="h-4 w-4" /> Teklifler
            </Link>
            <Link
              to="/otomasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Workflow className="h-4 w-4" /> Workflow
            </Link>
            <Link
              to="/aios"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Sparkles className="h-4 w-4" /> AIOS
            </Link>
            <Link
              to="/entegrasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Cable className="h-4 w-4" /> Entegrasyon
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Store className="h-4 w-4" /> Marketplace
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          AI Native B2B · B2C · Dealer · Customer — dijital satış merkezi. Ayrı e-ticaret yok; ERP
          uzantısı. Tek ürün / tek sipariş modeli · inbox → event bus → üretim / depo / lojistik /
          finans. Phase {overview.phase}.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { to: '/lojistik', label: 'Lojistik' },
          { to: '/finans', label: 'Finans' },
          { to: '/belge-merkezi', label: 'Belgeler' },
          { to: '/depo', label: 'Depo' },
          { to: '/mes', label: 'MES' },
          { to: '/analitik', label: 'Analytics' },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase text-[var(--muted)]"
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-10 rounded-xl border px-2.5 text-[11px] font-black uppercase ${
              tab === t.id
                ? 'border-[var(--ink)]/20 bg-white/55 text-[var(--ink)]'
                : 'border-dark-500/30 text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'dashboard' || tab === 'analytics') && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <div className="flex items-center gap-2 text-gray-400">
                <k.icon className="h-4 w-4 text-amber-300" />
                <span className="text-[11px] font-bold uppercase">{k.label}</span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">{k.value}</p>
            </div>
          ))}
        </section>
      )}

      {tab === 'dashboard' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-[var(--ink)]">Cloud akış</h2>
          <p className="text-sm text-[var(--muted)]">
            Product Master → Channel Listings → Order Inbox →{' '}
            <code className="text-emerald-700">trigger.order.created</code> → ERP (tek kayıt) →
            üretim / depo / lojistik / AIOS. İkinci sipariş yok.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDemoOrder}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-black uppercase text-emerald-800"
            >
              Demo kanal siparişi
            </button>
            <button
              type="button"
              onClick={handleStockSync}
              className="rounded-xl border px-3 py-2 text-xs font-black uppercase"
            >
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Stock Sync
              </span>
            </button>
          </div>
        </section>
      )}

      {(tab === 'marketplace' || tab === 'b2b' || tab === 'b2c' || tab === 'dealer') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">
            {tab === 'marketplace' && 'Marketplace kanalları'}
            {tab === 'b2b' && 'B2B Portal'}
            {tab === 'b2c' && 'B2C Store'}
            {tab === 'dealer' && 'Dealer Portal'}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Bağlantı stub · gerçek adapter GC-2 / Integration Hub. Eski /bayi bu Dealer sekmesine
            yönlendirilir.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(tab === 'marketplace'
              ? catalog.filter((m) => m.kind === 'marketplace' || m.kind === 'store')
              : catalog.filter((m) => m.key === tab)
            ).map((m) => {
              const ch = channels.find((c) => c.key === m.key)
              const status = ch?.status || 'disconnected'
              return (
                <div
                  key={m.key}
                  className="flex items-center justify-between rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{m.name}</p>
                    <p className="text-[11px] uppercase text-gray-500">{status}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConnect(m.key)}
                    className="rounded-lg border border-amber-400/30 px-2 py-1 text-[10px] font-black uppercase text-amber-100"
                  >
                    {status === 'connected' ? 'Yenile' : 'Bağla'}
                  </button>
                </div>
              )
            })}
          </div>
          {tab === 'b2b' && (
            <p className="mt-4 text-xs text-gray-400">
              Kurumsal: özel fiyat, stok, sipariş, cari, teklif — Price Engine + Product Master.
            </p>
          )}
          {tab === 'dealer' && (
            <p className="mt-4 text-xs text-gray-400">
              Bayi: stok, teklif, sipariş, belge, fatura, kendi müşterileri — mevcut bayi modülü ile
              birleşecek.
            </p>
          )}
          {tab === 'b2c' && (
            <p className="mt-4 text-xs text-gray-400">
              Modern store: AI search, filtre, 360, AR, video, favori, karşılaştır (GC-1+).
            </p>
          )}
        </section>
      )}

      {tab === 'categories' && (
        <CloudStub title="Categories" links={[{ to: '/stok/urunler', label: 'Product Master' }]}>
          Kategori ağacı Product Master / MDM ile paylaşılır — kanal listing’e yayınlanır.
        </CloudStub>
      )}
      {tab === 'brands' && (
        <CloudStub title="Brands" links={[{ to: '/stok/urunler', label: 'Ürünler' }]}>
          Marka SoT stok/MDM; storefront vitrin GC-2.
        </CloudStub>
      )}
      {tab === 'collections' && (
        <CloudStub title="Collections">
          Kampanya / sezon koleksiyonları — listing grupları (GC-2).
        </CloudStub>
      )}
      {tab === 'experience' && (
        <CloudStub title="Product Experience Center">
          360° · 3D · Video · AR · teknik çizim · sertifika · kılavuz · stok · teslim — Document
          Platform + MDM (GC-3).
        </CloudStub>
      )}
      {tab === 'configurator' && (
        <CloudStub
          title="AI Product Configurator"
          links={[{ to: '/ticaret?tab=cpq', label: 'CPQ' }]}
        >
          Ölçü · kapak · malzeme · renk · baskı → AI anlık fiyat (GC-2).
        </CloudStub>
      )}
      {tab === 'cpq' && (
        <CloudStub
          title="CPQ — Configure · Price · Quote"
          links={[
            { to: '/teklifler', label: 'Teklifler SoT' },
            { to: '/ticaret?tab=configurator', label: 'Configurator' },
          ]}
        >
          Kurumsal teklif ERP Quotes SoT; Commerce yapılandırma + fiyat çözümler.
        </CloudStub>
      )}
      {tab === 'customer' && (
        <CloudStub
          title="Customer Portal"
          links={[
            { to: '/musteriler', label: 'Müşteriler' },
            { to: '/mesajlar', label: 'Mesajlar' },
            { to: '/belge-merkezi', label: 'Belgeler' },
          ]}
        >
          Sipariş takibi · destek · invoice · teklif · AI asistan — CRM + Document + AIOS.
        </CloudStub>
      )}
      {tab === 'supplier' && (
        <CloudStub
          title="Supplier Portal"
          links={[{ to: '/giderler/tedarikciler', label: 'Tedarikçiler' }]}
        >
          Satın alma · teklif · teslim · kalite · performans (GC-2).
        </CloudStub>
      )}
      {tab === 'quotes' && (
        <CloudStub title="Quotes" links={[{ to: '/teklifler', label: 'Teklifler SoT' }]}>
          Teklif kaydı çoğaltılmaz — ERP Quotes.
        </CloudStub>
      )}
      {tab === 'giftCards' && (
        <CloudStub title="Gift Cards">Hediye kartı motoru · kupon altyapısı (GC-2).</CloudStub>
      )}
      {tab === 'loyalty' && (
        <CloudStub title="Loyalty">
          Puan · Silver / Gold / Platinum / VIP — CRM müşteri skoru (GC-2).
        </CloudStub>
      )}
      {tab === 'aiCommerce' && (
        <CloudStub
          title="AI Commerce"
          links={[
            { to: '/ticaret?tab=productAi', label: 'Product AI' },
            { to: '/aios', label: 'AIOS' },
            { to: '/ai-buyume', label: 'AI Growth' },
          ]}
        >
          Açıklama · SEO · reklam · blog · mail · kampanya — AIOS + Growth.
        </CloudStub>
      )}
      {tab === 'checkout' && (
        <CloudStub
          title="Checkout"
          links={[
            { to: '/ticaret?tab=payments', label: 'Payments' },
            { to: '/ticaret?tab=shipping', label: 'Shipping' },
          ]}
        >
          Tek sayfa adres · teslimat · ödeme · onay — B2C shell (GC-2).
        </CloudStub>
      )}
      {tab === 'global' && (
        <CloudStub
          title="Global"
          links={[
            { to: '/platform?tab=localization', label: 'Localization' },
            { to: '/ayarlar/vergi-kdv', label: 'Vergi/KDV' },
          ]}
        >
          Çoklu dil · para · vergi · şirket — Platform + Finance.
        </CloudStub>
      )}
      {tab === 'showroom' && (
        <CloudStub title="Showroom">Dijital vitrin — B2C + Product Experience (GC-3).</CloudStub>
      )}
      {tab === 'settings' && (
        <CloudStub
          title="Settings"
          links={[
            { to: '/entegrasyon', label: 'Integration Hub' },
            { to: '/platform?tab=integrations', label: 'Platform' },
            { to: '/ayarlar', label: 'Ayarlar' },
          ]}
        >
          Kanal varsayılanları · para · vergi · sandbox.
        </CloudStub>
      )}

      {tab === 'orders' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase text-gray-300">Unified Order Inbox</h2>
            <button
              type="button"
              onClick={handleDemoOrder}
              className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
            >
              Sipariş ekle
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {inbox.length === 0 ? (
              <p className="text-sm text-gray-500">Inbox boş</p>
            ) : (
              inbox.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {o.externalOrderId} · {o.channelKey}
                    </p>
                    <p className="text-xs text-gray-400">
                      {o.customerName} · {o.totalAmount} {o.currency} · risk {o.riskScore} ·{' '}
                      {o.status}
                    </p>
                  </div>
                  {o.status !== 'promoted' ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAnalyze(o.id)}
                        className="rounded-lg border border-violet-400/40 px-2.5 py-1.5 text-[10px] font-black uppercase text-violet-200"
                      >
                        AI Analiz
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromote(o.id)}
                        className="rounded-lg border border-emerald-400/40 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-200"
                      >
                        ERP’ye aktar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-emerald-300">
                      {o.erpOrderId}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === 'products' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Channel Listings</h2>
          <p className="text-xs text-gray-500">
            Ürün oluşturma burada yok — Product Master (ERP/MDM) tek kaynak. Multi-language
            TR/EN/DE/FR/ES/IT/AR/RU GC-1.
          </p>
          <button
            type="button"
            onClick={handlePublishProduct}
            className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
          >
            Demo listing yayınla
          </button>
          <ul className="space-y-2">
            {listings.map((l) => (
              <li
                key={l.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {l.title} → {l.channelKey} · {l.sku} · {l.price} {l.currency}
              </li>
            ))}
          </ul>
          <Link
            to="/stok/urunler"
            className="inline-flex text-xs font-bold text-amber-300 underline"
          >
            Product Master’a git
          </Link>
        </section>
      )}

      {tab === 'price' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase text-gray-300">Price Engine</h2>
            <button
              type="button"
              onClick={handleAddRule}
              className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
            >
              Kural ekle
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Müşteri / bayi / ülke / para birimi / kampanya / min sipariş — dinamik çözümleme.
          </p>
          <ul className="space-y-2">
            {rules.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {r.name} · {r.scope} · {r.adjustmentType} {r.adjustmentValue}
                {r.currency ? ` · ${r.currency}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'productAi' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Product AI</h2>
          <p className="text-xs text-gray-500">
            Açıklama · SEO · Meta · Anahtar kelime · Alt text · Teknik · Pazarlama · Instagram ·
            Google Merchant — Product Master üzerinden (ERP’de oluşturulur).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleProductAi}
              className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
            >
              AI içerik üret
            </button>
            <button
              type="button"
              onClick={handleExpandI18n}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase text-gray-200"
            >
              8 dil genişlet
            </button>
          </div>
          <ul className="space-y-2">
            {i18n.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {r.locale.toUpperCase()} · {r.title}
                {r.seoTitle ? ` · SEO: ${r.seoTitle}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'stock' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Stock Sync</h2>
          <p className="text-xs text-gray-500">ERP → Marketplace → Website → Dealer → B2B → POS</p>
          <button
            type="button"
            onClick={handleStockSync}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Senkron başlat
          </button>
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {j.id} · {j.channelKey} · {j.status} · {j.productsTouched} ürün
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'shipping' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Shipping Center</h2>
          <p className="text-xs text-gray-500">
            UPS · DHL · FedEx · Yurtiçi · MNG · Aras · Sürat · PTT
          </p>
          <button
            type="button"
            onClick={() => {
              const row = addShipmentLocal('ORD-DEMO', 'Yurtiçi')
              publishDomainEvent(
                'trigger.commerce.shipment.created',
                { shipmentId: row.id, carrier: row.carrier },
                { source: 'commerce' },
              )
              flash('Kargo etiketi oluşturuldu')
              refresh()
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
          >
            <Truck className="h-3.5 w-3.5" /> Demo kargo
          </button>
          <ul className="space-y-2">
            {shipments.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {s.carrier} · {s.trackingNo} · {s.status} · {s.orderRef}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'payments' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Payment Center</h2>
          <p className="text-xs text-gray-500">
            Stripe · iyzico · PayTR · PayPal · Wise · Banka havalesi
          </p>
          <div className="flex flex-wrap gap-2">
            {['stripe', 'iyzico', 'paytr'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  const row = addPaymentLocal(p, '1500')
                  publishDomainEvent(
                    'trigger.commerce.payment.created',
                    { paymentId: row.id, provider: p },
                    { source: 'commerce' },
                  )
                  flash(`${p} intent`)
                  refresh()
                }}
                className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase text-gray-200"
              >
                {p}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {p.provider} · {p.amount} {p.currency} · {p.status}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'returns' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Return Center</h2>
          <p className="text-xs text-gray-500">İade · Değişim · Servis · Garanti — tek panel</p>
          <button
            type="button"
            onClick={() => {
              const row = addReturnLocal('ORD-DEMO', 'return')
              publishDomainEvent(
                'trigger.commerce.return.opened',
                { returnId: row.id },
                { source: 'commerce' },
              )
              flash('İade kaydı açıldı')
              refresh()
            }}
            className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
          >
            İade aç
          </button>
          <ul className="space-y-2">
            {returns.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {r.kind} · {r.orderRef} · {r.status}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'subscriptions' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Subscription Commerce</h2>
          <button
            type="button"
            onClick={() => {
              const row = addSubscriptionLocal('cust_demo', 'prd_sub')
              publishDomainEvent(
                'trigger.commerce.subscription.created',
                { subscriptionId: row.id },
                { source: 'commerce' },
              )
              flash('Abonelik oluşturuldu')
              refresh()
            }}
            className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
          >
            Abonelik ekle
          </button>
          <ul className="space-y-2">
            {subs.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {r.customerRef} · {r.productId} · {r.interval} · {r.amount} {r.currency} ·{' '}
                {r.status}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'coupons' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-3`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Coupons</h2>
          <button
            type="button"
            onClick={() => {
              addCouponLocal(`SAVE${Math.floor(Math.random() * 90 + 10)}`, '10')
              flash('Kupon eklendi')
              refresh()
            }}
            className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
          >
            Kupon oluştur
          </button>
          <ul className="space-y-2">
            {coupons.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm text-gray-200"
              >
                {c.code} · %{c.discountValue} · {c.active ? 'aktif' : 'pasif'}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'campaigns' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Campaigns</h2>
          <p className="mt-2 text-sm text-gray-400">
            Price Engine kampanya kuralları + Growth Campaign Center ile ortak çalışır. Price
            Management sekmesinden kural ekleyin.
          </p>
        </section>
      )}

      {tab === 'accounts' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Customer Accounts</h2>
          <p className="mt-2 text-sm text-gray-400">
            B2B / bayi hesapları CRM müşteri kaydı ile bağlanır.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Building2 className="h-4 w-4 text-amber-300" />
            <Link to="/musteriler" className="text-emerald-700 underline">
              Müşteriler
            </Link>
            <Link to="/ticaret?tab=dealer" className="text-emerald-700 underline">
              Bayi Portal
            </Link>
          </div>
        </section>
      )}

      {tab === 'reviews' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Reviews</h2>
          <p className="mt-2 text-sm text-gray-400">
            Kanal yorum senkronu GC-2. Product Master ürününe bağlanır.
          </p>
        </section>
      )}

      {tab === 'analytics' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5 space-y-4`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Analytics</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-dark-500/40 p-3">
              <p className="text-[10px] uppercase text-gray-500">Satış</p>
              <p className="text-xl font-black text-white">
                {analytics.sales.toLocaleString('tr-TR')} ₺
              </p>
            </div>
            <div className="rounded-xl border border-dark-500/40 p-3">
              <p className="text-[10px] uppercase text-gray-500">ROI</p>
              <p className="text-xl font-black text-white">{analytics.roi}</p>
            </div>
            <div className="rounded-xl border border-dark-500/40 p-3">
              <p className="text-[10px] uppercase text-gray-500">ROAS</p>
              <p className="text-xl font-black text-white">{analytics.roas}</p>
            </div>
            <div className="rounded-xl border border-dark-500/40 p-3">
              <p className="text-[10px] uppercase text-gray-500">Kâr</p>
              <p className="text-xl font-black text-white">
                {analytics.profit.toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-gray-400">Kanal</p>
            {analytics.byChannel.map((c) => (
              <p key={c.channel} className="text-sm text-gray-300">
                {c.channel}: {c.revenue.toLocaleString('tr-TR')} ₺
              </p>
            ))}
          </div>
          <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3">
            <p className="text-xs font-black uppercase text-violet-200">AI Sales tahmini</p>
            <p className="mt-1 text-sm text-gray-200">
              {forecast.country} · {forecast.suggestedPrice} {forecast.currency} ·{' '}
              {forecast.suggestedChannel} · +%{forecast.upliftPct} · {forecast.suggestedAd}
            </p>
          </div>
          {analyses.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-gray-400">AI Order Manager</p>
              {analyses.slice(0, 5).map((a) => (
                <p key={a.id} className="text-sm text-gray-300">
                  {a.orderRef} · risk {a.riskScore} · {a.recommendation}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      )}
    </AppPageShell>
  )
}
