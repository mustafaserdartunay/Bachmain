import { stocks } from '../../data/mockData'

const statusIcon = {
  critical: { color: 'bg-red-500', label: 'Kritik' },
  warning: { color: 'bg-orange-500', label: 'Düşük' },
  normal: { color: 'bg-emerald-500', label: 'Normal' },
}

export default function StockManagement() {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Stok Yönetimi</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/50">
              <th className="table-header text-left pb-2">Ürün</th>
              <th className="table-header text-left pb-2">Kategori</th>
              <th className="table-header text-right pb-2">Mevcut</th>
              <th className="table-header text-right pb-2">Min/Maks</th>
              <th className="table-header text-center pb-2">Durum</th>
              <th className="table-header text-left pb-2">Tedarikçi</th>
              <th className="table-header text-right pb-2">Güncelleme</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s.product} className="border-b border-dark-500/20 hover:bg-dark-700/50 transition-colors">
                <td className="table-cell font-medium">{s.product}</td>
                <td className="table-cell text-gray-500">{s.category}</td>
                <td className="table-cell text-right">{s.current.toLocaleString('tr-TR')}</td>
                <td className="table-cell text-right text-gray-500">{s.min}/{s.max}</td>
                <td className="table-cell text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusIcon[s.status].color}`} />
                    <span className="text-xs text-gray-400">{statusIcon[s.status].label}</span>
                  </div>
                </td>
                <td className="table-cell text-gray-500">{s.supplier}</td>
                <td className="table-cell text-right text-gray-500">{s.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
