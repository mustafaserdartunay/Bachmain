import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck } from 'lucide-react'
import { loadDepoItems } from '../../utils/depoStore'
import { resolveStockScope } from '../../utils/stockScope'
import { loadLoadPlans } from '../../utils/logisticsStore'
import { customerLabel } from '../../utils/depoHelpers'

function matchCustomer(itemCustomer, customer) {
  const a = String(customerLabel(itemCustomer) || '').toLowerCase()
  const b = String(
    customer?.companyTitle || customer?.shortBrandName || customer?.name || '',
  ).toLowerCase()
  if (!a || !b) return false
  return a.includes(b.slice(0, 8)) || b.includes(a.slice(0, 8))
}

export default function CustomerStockPanel({ customer }) {
  const items = useMemo(() => {
    return loadDepoItems().filter(
      (row) => resolveStockScope(row) === 'customer' && matchCustomer(row.customer, customer),
    )
  }, [customer])

  const plans = useMemo(() => {
    const name = customer?.companyTitle || customer?.shortBrandName || ''
    return loadLoadPlans().filter((plan) =>
      (plan.pallets || []).some((p) => String(p.customer || '').toLowerCase().includes(String(name).toLowerCase().slice(0, 6))),
    )
  }, [customer])

  const qty = items.reduce((s, i) => s + (Number(i.quantity) || Number(i.deliveredQuantity) || 0), 0)
  const invoices = items.filter((i) => i.invoiceNo).length
  const waybills = items.filter((i) => i.waybillNo).length

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Müşteri Stokları & Lojistik</h2>
          <p className="mt-1 text-xs text-gray-500">Depo · sevkiyat · fatura özeti</p>
        </div>
        <Link to="/lojistik/yukleme-plani" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">
          <Truck className="h-3.5 w-3.5" />
          Yük Hesaplama
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {[
          ['Stok kalemi', items.length],
          ['Toplam adet', qty],
          ['Palet planı', plans.length],
          ['Koli (tahmini)', Math.ceil(qty / 12)],
          ['Sipariş', new Set(items.map((i) => i.orderId).filter(Boolean)).size],
          ['Sevkiyat', plans.length],
          ['Fatura', invoices],
          ['İrsaliye', waybills],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-dark-500/40 bg-dark-800/60 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-lg font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {!items.length ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            Bu müşteriye bağlı depo stoğu yok.
          </p>
        ) : items.slice(0, 8).map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dark-500/40 bg-dark-900/30 px-3 py-2 text-sm">
            <div>
              <p className="font-bold text-white">{row.product}</p>
              <p className="text-xs text-gray-500">
                {row.productCode || '—'} · {row.orderId || row.productionCode || '—'} · {row.status}
              </p>
            </div>
            <p className="font-black text-blue-300">{row.quantity || row.deliveredQuantity || 0} adet</p>
          </div>
        ))}
      </div>
    </section>
  )
}
