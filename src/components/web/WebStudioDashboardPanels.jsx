import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleAlert,
  CircleCheckBig,
  CreditCard,
  Landmark,
  LayoutTemplate,
  Package,
  ShoppingCart,
  Warehouse,
  Wallet,
} from 'lucide-react'
import {
  APP_LABEL_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_PANEL_CLASS,
  APP_PANEL_TITLE_CLASS,
  APP_SURFACE_PANEL_CLASS,
  APP_VALUE_CLASS,
} from '../../utils/dashboardDesign'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { documentTotals } from '../../utils/documentTotals'
import { loadOrders } from '../../utils/ordersStore'
import {
  WEB_STUDIO_CATEGORY_CREATE_PATH,
  WEB_STUDIO_DESIGN_PATH,
  WEB_STUDIO_ORDERS_PATH,
  WEB_STUDIO_PAYMENT_PATH,
  WEB_STUDIO_PRODUCT_CREATE_PATH,
} from '../../data/webMenu'
import { getWebCategories, getWebStoreProducts } from '../../utils/webSiteStorage'
import {
  getWebPaymentSettings,
  isHavaleReady,
  isIyzicoReady,
  WEB_PAYMENT_EVENT,
} from '../../utils/webStudioSettings'

function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next.getTime()
}

function orderTime(order) {
  const raw = order?.createdAt || order?.date || ''
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function orderTotal(order) {
  return Number(documentTotals(order).grandTotal || 0)
}

function isPendingCollection(order) {
  const status = String(order?.status || '').toLowerCase()
  const stage = String(order?.currentStageId || '')
  if (status.includes('iptal') || status.includes('teslim')) return false
  if (stage.includes('cancel') || stage.includes('delivered')) return false
  return true
}

function isPreparing(order) {
  const status = String(order?.status || '').toLowerCase()
  const stage = String(order?.currentStageId || '')
  return status.includes('üretim') || status.includes('hazır') || stage.includes('stage-9') || stage.includes('prep')
}

function MetricCell({ label, value, hint, tone = 'text-[var(--ink)]' }) {
  return (
    <div className="rounded-xl bg-white/35 p-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`mt-1 truncate text-lg font-black tabular-nums ${tone}`}>{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--muted)]">{hint}</p> : null}
    </div>
  )
}

export function useWebStudioSnapshot() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    const events = [
      'bach:orders-updated',
      'bach:web-catalog-updated',
      'bach:web-sites-updated',
      WEB_PAYMENT_EVENT,
    ]
    events.forEach((event) => window.addEventListener(event, refresh))
    return () => events.forEach((event) => window.removeEventListener(event, refresh))
  }, [])

  return useMemo(() => {
    const orders = loadOrders()
    const products = getWebStoreProducts()
    const categories = getWebCategories()
    const payments = getWebPaymentSettings()
    const todayStart = startOfDay(new Date())
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000

    const todayOrders = orders.filter((order) => orderTime(order) >= todayStart)
    const weekOrders = orders.filter((order) => orderTime(order) >= weekStart)
    const pendingOrders = orders.filter(isPendingCollection)
    const preparingOrders = orders.filter(isPreparing)
    const todayRevenue = todayOrders.reduce((sum, order) => sum + orderTotal(order), 0)
    const pendingSum = pendingOrders.reduce((sum, order) => sum + orderTotal(order), 0)
    const preparingSum = preparingOrders.reduce((sum, order) => sum + orderTotal(order), 0)
    const weekRevenue = weekOrders.reduce((sum, order) => sum + orderTotal(order), 0)
    const stockValue = products.reduce(
      (sum, product) => sum + (Number(product.price) || 0) * (Number(product.stock) || 0),
      0,
    )
    const coverage = pendingSum > 0 ? Math.min(100, Math.round((todayRevenue / pendingSum) * 100)) : 100
    const iyzico = isIyzicoReady(payments)
    const havale = isHavaleReady(payments)

    return {
      todayRevenue,
      todayCount: todayOrders.length,
      pendingSum,
      pendingCount: pendingOrders.length,
      stockValue,
      productCount: products.length,
      categoryCount: categories.length,
      preparingSum,
      preparingCount: preparingOrders.length,
      weekRevenue,
      coverage,
      iyzico,
      havale,
      orderTotal: orders.length,
    }
  }, [tick])
}

/** Güncel Durum orta alanı — Ay Sonu + Finans Özeti yerine Studio panelleri */
export default function WebStudioDashboardPanels() {
  const snapshot = useWebStudioSnapshot()

  return (
    <div className="space-y-4">
      <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-3.5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="truncate text-sm font-black text-[var(--ink)]">Operasyon kapasitesi</p>
          </div>
          <span className="text-[11px] font-extrabold text-[var(--muted)]">
            Kapasite skoru {snapshot.coverage}%
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCell label="Bugünkü ciro" value={money(snapshot.todayRevenue)} hint={`${snapshot.todayCount} sipariş`} tone="text-emerald-600" />
          <MetricCell label="Bekleyen tahsilat" value={money(snapshot.pendingSum)} hint={`${snapshot.pendingCount} sipariş`} tone="text-amber-600" />
          <MetricCell label="Stok değeri" value={money(snapshot.stockValue)} hint={`${snapshot.productCount} ürün`} tone="text-blue-600" />
          <MetricCell label="Hazırlanan sipariş" value={money(snapshot.preparingSum)} hint={`${snapshot.preparingCount} sipariş`} tone="text-fuchsia-600" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={APP_PANEL_CLASS}>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <AppPanelDot color="blue" />
              <h2 className={APP_PANEL_TITLE_CLASS}>Finans / Kasa Özeti</h2>
            </div>
            <Link to={WEB_STUDIO_ORDERS_PATH} className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
              Siparişler
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            <Link to={WEB_STUDIO_ORDERS_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span className={APP_LABEL_CLASS}>Bekleyen tahsilat (kasa girişi)</span>
              </span>
              <span className={`${APP_VALUE_CLASS} text-amber-600`}>{money(snapshot.pendingSum)}</span>
            </Link>
            <Link to={WEB_STUDIO_ORDERS_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className={APP_LABEL_CLASS}>Bugün tahsil edilen</span>
              </span>
              <span className={`${APP_VALUE_CLASS} text-emerald-600`}>{money(snapshot.todayRevenue)}</span>
            </Link>
            <Link to={WEB_STUDIO_ORDERS_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <Package className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className={APP_LABEL_CLASS}>Son 7 gün ciro</span>
              </span>
              <span className={APP_VALUE_CLASS}>{money(snapshot.weekRevenue)}</span>
            </Link>
            <Link to={WEB_STUDIO_PAYMENT_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                <span className={APP_LABEL_CLASS}>iyzico kanalı</span>
              </span>
              <span className={`${APP_VALUE_CLASS} ${snapshot.iyzico ? 'text-emerald-600' : 'text-amber-600'}`}>
                {snapshot.iyzico ? 'Aktif' : 'Kapalı'}
              </span>
            </Link>
            <Link to={WEB_STUDIO_PAYMENT_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                <span className={APP_LABEL_CLASS}>Havale / EFT</span>
              </span>
              <span className={`${APP_VALUE_CLASS} ${snapshot.havale ? 'text-emerald-600' : 'text-rose-600'}`}>
                {snapshot.havale ? 'Aktif' : 'Eksik'}
              </span>
            </Link>
            <div className={APP_METRIC_ROW_CLASS}>
              <span className={APP_LABEL_CLASS}>Toplam aktif sipariş</span>
              <span className={APP_VALUE_CLASS}>{snapshot.orderTotal}</span>
            </div>
          </div>
        </section>

        <section className={APP_PANEL_CLASS}>
          <div className="mb-2.5 flex items-center gap-2">
            <AppPanelDot color="violet" />
            <h2 className={APP_PANEL_TITLE_CLASS}>Studio işlemleri</h2>
          </div>
          <div className="flex flex-col gap-1">
            <Link to={WEB_STUDIO_DESIGN_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <LayoutTemplate className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                <span className={APP_LABEL_CLASS}>Web tasarım</span>
              </span>
              <span className={`${APP_VALUE_CLASS} text-blue-600`}>Aç</span>
            </Link>
            <Link to={WEB_STUDIO_CATEGORY_CREATE_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className={APP_LABEL_CLASS}>Kategoriler</span>
              <span className={APP_VALUE_CLASS}>{snapshot.categoryCount}</span>
            </Link>
            <Link to={WEB_STUDIO_PRODUCT_CREATE_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                <Warehouse className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span className={APP_LABEL_CLASS}>Ürünler</span>
              </span>
              <span className={APP_VALUE_CLASS}>{snapshot.productCount}</span>
            </Link>
            <Link to={WEB_STUDIO_PAYMENT_PATH} className={APP_METRIC_ROW_CLASS}>
              <span className="flex min-w-0 items-center gap-1.5">
                {snapshot.iyzico && snapshot.havale ? (
                  <CircleCheckBig className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <CircleAlert className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                )}
                <span className={APP_LABEL_CLASS}>Ödeme kanalları</span>
              </span>
              <span className={`${APP_VALUE_CLASS} ${snapshot.iyzico && snapshot.havale ? 'text-emerald-600' : 'text-amber-600'}`}>
                {snapshot.iyzico && snapshot.havale ? 'Hazır' : 'Tamamla'}
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
