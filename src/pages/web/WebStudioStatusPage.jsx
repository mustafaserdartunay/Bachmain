import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleAlert,
  CircleCheckBig,
  Globe2,
  LayoutTemplate,
  MessageCircle,
  Package,
  ShoppingCart,
  Sparkles,
  Warehouse,
} from 'lucide-react'
import {
  APP_LABEL_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_SURFACE_PANEL_CLASS,
  APP_VALUE_CLASS,
} from '../../utils/dashboardDesign'
import { documentTotals } from '../../utils/documentTotals'
import { loadOrders } from '../../utils/ordersStore'
import { getCatalogProducts, getTotalStock } from '../../utils/productCatalog'
import { getPages, getSites } from '../../utils/webSiteStorage'

const WEB_INBOX_KEY = 'bach-web-inbox'

function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function readInbox() {
  try {
    const raw = localStorage.getItem(WEB_INBOX_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  const seed = [
    {
      id: 'msg-1',
      name: 'Ayşe Kaya',
      text: 'Siparişimin kargo durumunu öğrenebilir miyim?',
      at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      unread: true,
    },
    {
      id: 'msg-2',
      name: 'Mehmet Demir',
      text: 'Web sitedeki stok bitmiş görünüyor, ne zaman gelir?',
      at: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
      unread: true,
    },
    {
      id: 'msg-3',
      name: 'Elif Aksoy',
      text: 'Toplu sipariş için fiyat teklifi istiyorum.',
      at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      unread: false,
    },
  ]
  try {
    localStorage.setItem(WEB_INBOX_KEY, JSON.stringify(seed))
  } catch {
    /* ignore */
  }
  return seed
}

function MetricCell({ label, value, hint, tone = 'text-emerald-600' }) {
  return (
    <div className="rounded-xl bg-white/35 p-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`mt-1 truncate text-lg font-black tabular-nums ${tone}`}>{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--muted)]">{hint}</p> : null}
    </div>
  )
}

function Panel({ title, icon: Icon, iconTone, action, children }) {
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-3.5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="truncate text-sm font-black text-[var(--ink)]">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function WebStudioStatusPage() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    const events = [
      'bach:orders-updated',
      'bach:web-sites-updated',
      'bach:web-pages-updated',
      'bach:products-updated',
    ]
    events.forEach((event) => window.addEventListener(event, refresh))
    return () => events.forEach((event) => window.removeEventListener(event, refresh))
  }, [])

  const snapshot = useMemo(() => {
    const sites = getSites()
    const pages = getPages()
    const orders = loadOrders()
    const products = getCatalogProducts()
    const inbox = readInbox()
    const incoming = [...orders]
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 6)
    const stockRows = products
      .map((product) => ({
        id: product.id,
        name: product.name || product.stockCode || 'Ürün',
        stock: getTotalStock(product),
        code: product.stockCode || '—',
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
    const lowStock = stockRows.filter((row) => row.stock <= 8).length
    const orderTotal = incoming.reduce((sum, order) => sum + Number(documentTotals(order).grandTotal || 0), 0)
    const connected = sites.filter((site) => site.domain).length
    const unread = inbox.filter((item) => item.unread).length
    return {
      sites,
      pages,
      incoming,
      stockRows,
      lowStock,
      orderTotal,
      connected,
      inbox,
      unread,
      productCount: products.length,
    }
  }, [tick])

  const liveTone = snapshot.connected ? 'green' : 'orange'
  const liveStyle =
    liveTone === 'green'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-600'

  return (
    <div className="modern-dashboard space-y-4">
      <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-3.5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            <p className="truncate text-sm font-black text-[var(--ink)]">Web Güncel Durum</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${liveStyle}`}>
              {snapshot.connected ? <CircleCheckBig className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
              {snapshot.connected ? 'Yayında' : 'Domain bekliyor'}
            </span>
            <Link
              to="/web/studio/yonetim/panel"
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-white/45 px-2.5 text-[10px] font-extrabold text-blue-600 transition-colors hover:bg-white/70"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Studio
            </Link>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCell label="Gelen sipariş" value={String(snapshot.incoming.length)} hint={money(snapshot.orderTotal)} tone="text-emerald-600" />
          <MetricCell label="Stok ürün" value={String(snapshot.productCount)} hint={`${snapshot.lowStock} kritik`} tone="text-amber-600" />
          <MetricCell label="Müşteri mesajı" value={String(snapshot.inbox.length)} hint={`${snapshot.unread} okunmadı`} tone="text-sky-600" />
          <MetricCell label="Site / sayfa" value={`${snapshot.sites.length} / ${snapshot.pages.length}`} hint={`${snapshot.connected} domain`} tone="text-blue-600" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Gelen Siparişler"
          icon={ShoppingCart}
          iconTone="bg-emerald-500/10 text-emerald-600"
          action={
            <Link to="/siparisler" className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
              Tümü
            </Link>
          }
        >
          <div className="flex flex-col gap-1">
            {snapshot.incoming.length ? (
              snapshot.incoming.map((order) => (
                <Link key={order.id} to="/siparisler" className={APP_METRIC_ROW_CLASS}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className={APP_LABEL_CLASS}>{order.customer || order.title || 'Web siparişi'}</span>
                  </span>
                  <span className={`${APP_VALUE_CLASS} text-emerald-600`}>{money(documentTotals(order).grandTotal)}</span>
                </Link>
              ))
            ) : (
              <p className="glass-inset px-3 py-5 text-center text-[12px] font-semibold text-[var(--muted)]">
                Henüz web siparişi yok.
              </p>
            )}
          </div>
        </Panel>

        <Panel
          title="Stok Bilgileri"
          icon={Warehouse}
          iconTone="bg-amber-500/10 text-amber-600"
          action={
            <Link to="/stok/urunler" className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
              Stok
            </Link>
          }
        >
          <div className="flex flex-col gap-1">
            {snapshot.stockRows.length ? (
              snapshot.stockRows.map((row) => (
                <Link key={row.id} to="/stok/urunler" className={APP_METRIC_ROW_CLASS}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span className={APP_LABEL_CLASS}>{row.name}</span>
                  </span>
                  <span className={`${APP_VALUE_CLASS} ${row.stock <= 8 ? 'text-rose-600' : 'text-[var(--ink)]'}`}>
                    {row.stock} adet
                  </span>
                </Link>
              ))
            ) : (
              <p className="glass-inset px-3 py-5 text-center text-[12px] font-semibold text-[var(--muted)]">
                Stok kaydı bulunamadı.
              </p>
            )}
          </div>
        </Panel>

        <Panel
          title="Müşteri Mesajları"
          icon={MessageCircle}
          iconTone="bg-sky-500/10 text-sky-600"
        >
          <div className="flex flex-col gap-1">
            {snapshot.inbox.map((message) => (
              <div key={message.id} className={APP_METRIC_ROW_CLASS}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                    <span className={APP_LABEL_CLASS}>{message.name}</span>
                    {message.unread ? <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> : null}
                  </span>
                  <span className="truncate pl-5 text-[11px] font-semibold text-[var(--muted)]">{message.text}</span>
                </span>
                <span className="shrink-0 text-[10px] font-bold text-[var(--muted)]">{formatWhen(message.at)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Site & Yayın"
          icon={Globe2}
          iconTone="bg-blue-500/10 text-blue-600"
          action={
            <Link to="/web/studio/yonetim/domain-bagla" className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
              Domain
            </Link>
          }
        >
          <div className="flex flex-col gap-1">
            {snapshot.sites.length ? (
              snapshot.sites.map((site) => (
                <Link key={site.id} to="/web/studio/yonetim/panel" className={APP_METRIC_ROW_CLASS}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <LayoutTemplate className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className={APP_LABEL_CLASS}>{site.name}</span>
                  </span>
                  <span className={`${APP_VALUE_CLASS} ${site.domain ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {site.domain || 'Domain yok'}
                  </span>
                </Link>
              ))
            ) : (
              <Link to="/web/studio/yonetim/domain-bagla" className={APP_METRIC_ROW_CLASS}>
                <span className={APP_LABEL_CLASS}>İlk web sitesini oluştur</span>
                <span className={`${APP_VALUE_CLASS} text-blue-600`}>Bağla</span>
              </Link>
            )}
            <Link to="/web/studio/yonetim/panel" className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className={APP_LABEL_CLASS}>Sayfa tasarımına geç</span>
              </span>
              <span className={`${APP_VALUE_CLASS} text-blue-600`}>{snapshot.pages.length} sayfa</span>
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}
