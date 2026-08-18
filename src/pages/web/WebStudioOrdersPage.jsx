import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { WEB_STUDIO_ADMIN_PATH, WEB_STUDIO_ORDERS_PATH } from '../../data/webMenu'
import { APP_LABEL_CLASS, APP_METRIC_ROW_CLASS, APP_VALUE_CLASS } from '../../utils/dashboardDesign'
import { documentTotals } from '../../utils/documentTotals'
import { loadOrders } from '../../utils/ordersStore'

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

export default function WebStudioOrdersPage() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('bach:orders-updated', refresh)
    return () => window.removeEventListener('bach:orders-updated', refresh)
  }, [])

  const snapshot = useMemo(() => {
    const orders = loadOrders()
    const sorted = [...orders].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    )
    const total = sorted.reduce(
      (sum, order) => sum + Number(documentTotals(order).grandTotal || 0),
      0,
    )
    const pending = sorted.filter((order) => {
      const stage = String(order.stageId || order.status || '').toLowerCase()
      return stage.includes('bek') || stage.includes('yeni') || stage.includes('lead')
    })
    return { orders: sorted, total, pending: pending.length }
  }, [tick])

  return (
    <AppPageShell>
      <AppPageHeader title="Siparişler" backTo={WEB_STUDIO_ADMIN_PATH} backLabel="Yönetim" />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Toplam sipariş', value: snapshot.orders.length, icon: ShoppingCart, tone: 'blue', valueTone: 'blue' },
          { title: 'Bekleyen', value: snapshot.pending, icon: Package, tone: 'amber', valueTone: 'amber' },
          { title: 'Toplam tutar', value: money(snapshot.total), icon: ShoppingCart, tone: 'emerald', valueTone: 'emerald' },
        ]}
      />

      <AppPagePanel
        title="Web siparişleri"
        description={`${snapshot.orders.length} kayıt`}
        action={
          <Link to="/siparisler" className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
            CRM
          </Link>
        }
      >
        {snapshot.orders.length ? (
          <div className="flex flex-col gap-1">
            {snapshot.orders.map((order) => (
              <Link key={order.id} to="/siparisler" className={APP_METRIC_ROW_CLASS}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className={APP_LABEL_CLASS}>
                      {order.customer || order.title || order.id || 'Web siparişi'}
                    </span>
                  </span>
                  <span className="truncate pl-5 text-[11px] font-semibold text-[var(--muted)]">
                    {order.paymentMethod || order.stageLabel || 'Sipariş'}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className={`${APP_VALUE_CLASS} text-emerald-600`}>
                    {money(documentTotals(order).grandTotal)}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--muted)]">
                    {formatWhen(order.createdAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-1 py-4 text-center text-[12px] font-semibold text-[var(--muted)]">
            Henüz web siparişi yok.
          </p>
        )}
      </AppPagePanel>
    </AppPageShell>
  )
}
