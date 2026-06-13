import {
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  Factory,
  CreditCard,
  Truck,
  Clock,
  User,
  Printer,
  Edit,
  Receipt,
} from 'lucide-react'
import { statusBadgeMap, formatCurrency } from '../../data/mockData'
import { priorityBadgeMap, paymentStatusBadgeMap } from '../../data/ordersData'
import { getCustomerDisplay } from '../../utils/customerDisplay'

const timelineIcons = {
  create: Clock,
  payment: CreditCard,
  production: Factory,
  shipping: Truck,
  complete: FileText,
  note: FileText,
  file: FileText,
  cancel: X,
}

const timelineColors = {
  create: 'text-blue-400 bg-blue-500/20',
  payment: 'text-emerald-400 bg-emerald-500/20',
  production: 'text-orange-400 bg-orange-500/20',
  shipping: 'text-purple-400 bg-purple-500/20',
  complete: 'text-gray-400 bg-gray-500/20',
  note: 'text-gray-400 bg-gray-500/20',
  file: 'text-blue-400 bg-blue-500/20',
  cancel: 'text-red-400 bg-red-500/20',
}

export default function OrderDetailPanel({ order, onClose }) {
  if (!order) return null
  const customerDisplay = getCustomerDisplay(order.customer)

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-dark-500/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white">{order.id}</h2>
            <span className={statusBadgeMap[order.status] || 'badge-gray'}>{order.status}</span>
            <span className={priorityBadgeMap[order.priority]}>{order.priority}</span>
          </div>
          <p className="text-sm text-gray-400">{customerDisplay.brandShortName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/30 transition-colors">
          <Edit className="w-3.5 h-3.5" /> Düzenle
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
          <Factory className="w-3.5 h-3.5" /> Üretime Al
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/30 transition-colors">
          <Receipt className="w-3.5 h-3.5" /> Fatura
        </button>
        <button className="p-2 rounded-lg bg-dark-700 text-gray-400 hover:text-white transition-colors">
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Müşteri Bilgileri */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Müşteri Bilgileri</h3>
          <div className="bg-dark-700/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="text-gray-300">{customerDisplay.companyTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="text-gray-300">{order.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="text-gray-300">{order.email}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
              <span className="text-gray-400 text-xs leading-relaxed">{order.shippingAddress}</span>
            </div>
          </div>
        </section>

        {/* Sipariş Kalemleri */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sipariş Kalemleri</h3>
          <div className="bg-dark-700/50 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dark-500/30">
                  <th className="text-left p-2 text-gray-500 font-medium">Ürün</th>
                  <th className="text-right p-2 text-gray-500 font-medium">Adet</th>
                  <th className="text-right p-2 text-gray-500 font-medium">Birim</th>
                  <th className="text-right p-2 text-gray-500 font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.sku} className="border-b border-dark-500/20 last:border-0">
                    <td className="p-2">
                      <p className="text-gray-300">{item.product}</p>
                      <p className="text-gray-600">{item.sku}</p>
                    </td>
                    <td className="p-2 text-right text-gray-300">{item.quantity.toLocaleString('tr-TR')}</td>
                    <td className="p-2 text-right text-gray-400">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-2 text-right text-gray-300 font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-dark-500/30 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Ara Toplam</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>KDV (%18)</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1">
                <span>Genel Toplam</span>
                <span>{formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ödeme & Teslimat */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ödeme & Teslimat</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 mb-1">Ödeme Yöntemi</p>
              <p className="text-sm text-gray-300">{order.paymentMethod}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 mb-1">Ödeme Durumu</p>
              <span className={paymentStatusBadgeMap[order.paymentStatus]}>{order.paymentStatus}</span>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 mb-1">Sipariş Tarihi</p>
              <p className="text-sm text-gray-300">{order.date}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 mb-1">Teslim Tarihi</p>
              <p className="text-sm text-gray-300">{order.delivery}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 mb-1">Kaynak</p>
              <p className="text-sm text-gray-300">{order.source}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 mb-1">Sorumlu</p>
              <p className="text-sm text-gray-300">{order.assignedTo}</p>
            </div>
          </div>
          {order.workOrder && (
            <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-2">
              <Factory className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">İş Emri: <strong>{order.workOrder}</strong></span>
            </div>
          )}
        </section>

        {/* Notlar */}
        {order.notes && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notlar</h3>
            <div className="bg-dark-700/50 rounded-lg p-3 text-sm text-gray-400 leading-relaxed">
              {order.notes}
            </div>
          </section>
        )}

        {/* Zaman Çizelgesi */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Aktivite Geçmişi</h3>
          <div className="space-y-0">
            {order.timeline.map((event, i) => {
              const Icon = timelineIcons[event.type] || Clock
              const colorClass = timelineColors[event.type] || timelineColors.note
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {i < order.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-dark-500/50 my-1" />
                    )}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm text-gray-300">{event.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.date} · {event.user}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
