import { Plus } from 'lucide-react'
import { quotes, statusBadgeMap, formatCurrency } from '../../data/mockData'

export default function QuotesWidget() {
  const { summary, list } = quotes

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Teklifler</h3>
        <button className="btn-primary flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Yeni Teklif
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">{summary.total}</p>
          <p className="text-[10px] text-gray-500">Toplam</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-orange-400">{summary.pending}</p>
          <p className="text-[10px] text-gray-500">Bekleyen</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-emerald-400">{summary.accepted}</p>
          <p className="text-[10px] text-gray-500">Kabul</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-red-400">{summary.rejected}</p>
          <p className="text-[10px] text-gray-500">Red</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/50">
              <th className="table-header text-left pb-2">Teklif No</th>
              <th className="table-header text-left pb-2">Müşteri</th>
              <th className="table-header text-right pb-2">Tutar</th>
              <th className="table-header text-center pb-2">Durum</th>
              <th className="table-header text-right pb-2">Geçerlilik</th>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id} className="border-b border-dark-500/20 hover:bg-dark-700/50 transition-colors">
                <td className="table-cell font-medium text-accent-blue">{q.id}</td>
                <td className="table-cell">{q.customer}</td>
                <td className="table-cell text-right">{formatCurrency(q.amount)}</td>
                <td className="table-cell text-center">
                  <span className={statusBadgeMap[q.status]}>{q.status}</span>
                </td>
                <td className="table-cell text-right text-gray-500">{q.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
