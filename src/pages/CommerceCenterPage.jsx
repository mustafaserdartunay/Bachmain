import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Boxes,
  Building2,
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
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { commerceSubMenus } from '../data/commerceMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  COMMERCE_UPDATED_EVENT,
  addPriceRuleLocal,
  commerceOverviewLocal,
  connectChannelLocal,
  ensureCommerceSeed,
  ingestOrderLocal,
  listChannelsLocal,
  listInboxLocal,
  listListingsLocal,
  listPriceRulesLocal,
  listStockJobsLocal,
  marketplaceCatalogLocal,
  promoteOrderLocal,
  publishListingLocal,
  runStockSyncLocal,
} from '../commerce/localStore'

const TABS = commerceSubMenus

export default function CommerceCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const [overview, setOverview] = useState(() => commerceOverviewLocal())
  const [channels, setChannels] = useState([])
  const [inbox, setInbox] = useState([])
  const [rules, setRules] = useState([])
  const [listings, setListings] = useState([])
  const [jobs, setJobs] = useState([])
  const [msg, setMsg] = useState('')
  const catalog = useMemo(() => marketplaceCatalogLocal(), [])

  function refresh() {
    setOverview(commerceOverviewLocal())
    setChannels(listChannelsLocal())
    setInbox(listInboxLocal())
    setRules(listPriceRulesLocal())
    setListings(listListingsLocal())
    setJobs(listStockJobsLocal())
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
    <div className="w-full space-y-5 pb-8">
      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300">
              <Store className="h-5 w-5" />
              <h1 className="text-xl font-black uppercase tracking-wide">Commerce Center</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Global ticaret katmanı. Ürün sadece ERP/MDM’de; kanallar listing ile yayınlanır.
              Siparişler tek inbox’a akar, event bus ile ERP → üretim → depo → lojistik tetiklenir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/stok/urunler"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase text-emerald-200"
            >
              <Boxes className="h-4 w-4" />
              Product Master
            </Link>
            <Link
              to="/otomasyon"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase text-blue-200"
            >
              <Workflow className="h-4 w-4" />
              Workflow
            </Link>
            <Link
              to="/aios"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase text-violet-200"
            >
              <Sparkles className="h-4 w-4" />
              AIOS
            </Link>
          </div>
        </div>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-300">{msg}</p> : null}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide ${
              tab === t.id
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
                : 'border-dark-500/40 bg-dark-800/60 text-gray-400 hover:text-gray-200'
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
          <h2 className="text-sm font-black uppercase text-gray-300">GC-0 akış</h2>
          <p className="text-sm text-gray-400">
            Product Master → Channel Listings → Order Inbox →{' '}
            <code className="text-amber-200">trigger.order.created</code> → ERP üretim / depo /
            lojistik / AIOS.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDemoOrder}
              className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase text-amber-100"
            >
              Demo kanal siparişi
            </button>
            <button
              type="button"
              onClick={handleStockSync}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase text-gray-200"
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
            GC-0: bağlantı stub. Gerçek adapter’lar GC-2. Mevcut{' '}
            <Link to="/bayi" className="text-amber-300 underline">
              /bayi
            </Link>{' '}
            ve portal bozulmaz.
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
                    <button
                      type="button"
                      onClick={() => handlePromote(o.id)}
                      className="rounded-lg border border-emerald-400/40 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-200"
                    >
                      ERP’ye aktar
                    </button>
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

      {(tab === 'shipping' ||
        tab === 'returns' ||
        tab === 'subscriptions' ||
        tab === 'campaigns' ||
        tab === 'coupons' ||
        tab === 'accounts' ||
        tab === 'reviews') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">
            {TABS.find((t) => t.id === tab)?.label}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            GC-0 kabuk. Shipping (UPS/DHL/FedEx/Yurtiçi/MNG/Aras/Sürat/PTT), Payment
            (Stripe/iyzico/PayTR/PayPal/Wise/havale), Return Center ve Subscription Commerce GC-3
            roadmap’te.
          </p>
          {tab === 'shipping' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <Truck className="h-4 w-4 text-amber-300" />
              Carrier adapter iskeleti hazırlanacak
            </div>
          )}
          {tab === 'accounts' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <Building2 className="h-4 w-4 text-amber-300" />
              B2B / bayi hesapları CRM müşteri kaydı ile bağlanır
            </div>
          )}
        </section>
      )}
    </div>
  )
}
