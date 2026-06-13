import { Plus } from 'lucide-react'
import { customers } from '../../data/mockData'
import { getCustomerDisplay } from '../../utils/customerDisplay'

export default function CustomerTracking() {
  const { summary, list } = customers

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Müşteri Takibi</h3>
        <button className="btn-primary flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Yeni Müşteri
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">{summary.total}</p>
          <p className="text-[10px] text-gray-500">Toplam</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-emerald-400">{summary.active}</p>
          <p className="text-[10px] text-gray-500">Aktif</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-gray-400">{summary.passive}</p>
          <p className="text-[10px] text-gray-500">Pasif</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-accent-blue">{summary.revenue}</p>
          <p className="text-[10px] text-gray-500">Toplam Ciro</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/50">
              <th className="table-header text-left pb-2">Firma Adı</th>
              <th className="table-header text-left pb-2">Yetkili</th>
              <th className="table-header text-left pb-2">E-posta</th>
              <th className="table-header text-right pb-2">Son Görüşme</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const display = getCustomerDisplay(c)
              return (
              <tr key={c.company} className="border-b border-dark-500/20 hover:bg-dark-700/50 transition-colors">
                <td className="table-cell font-medium">{display.brandShortName}</td>
                <td className="table-cell">{display.companyTitle}</td>
                <td className="table-cell text-gray-500">{c.email}</td>
                <td className="table-cell text-right text-gray-500">{c.lastMeeting}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
