import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { detailedOrders } from '../../data/ordersData'
import { statusBadgeMap, formatCurrency } from '../../data/mockData'
import { getCustomerDisplay } from '../../utils/customerDisplay'

const tabs = ['Tümü', 'Yeni', 'Üretimde', 'Paketlemede', 'Kargoda', 'Tamamlandı']

export default function OrdersTable() {
  const orders = detailedOrders.slice(0, 6)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Siparişler</h3>
        <Link to="/siparisler" className="btn-primary flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Yeni Sipariş
        </Link>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
              i === 0 ? 'bg-accent-blue/20 text-accent-blue' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/50">
              <th className="table-header text-left pb-2">Sipariş No</th>
              <th className="table-header text-left pb-2">Müşteri</th>
              <th className="table-header text-right pb-2">Tutar</th>
              <th className="table-header text-center pb-2">Durum</th>
              <th className="table-header text-right pb-2">Tarih</th>
              <th className="table-header text-right pb-2">Teslim</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const display = getCustomerDisplay(order.customer)
              return (
              <tr key={order.id} className="border-b border-dark-500/20 hover:bg-dark-700/50 transition-colors">
                <td className="table-cell font-medium">
                  <Link to="/siparisler" className="text-accent-blue hover:underline">{order.id}</Link>
                </td>
                <td className="table-cell">{display.brandShortName}</td>
                <td className="table-cell text-right">{formatCurrency(order.amount)}</td>
                <td className="table-cell text-center">
                  <span className={statusBadgeMap[order.status]}>{order.status}</span>
                </td>
                <td className="table-cell text-right text-gray-500">{order.date}</td>
                <td className="table-cell text-right text-gray-500">{order.delivery}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center mt-3">
        <Link to="/siparisler" className="text-xs text-accent-blue hover:text-blue-400 transition-colors">
          Tüm siparişleri gör →
        </Link>
      </div>
    </div>
  )
}
