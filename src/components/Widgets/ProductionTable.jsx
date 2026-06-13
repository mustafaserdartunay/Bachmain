import { useEffect, useState } from 'react'
import { statusBadgeMap } from '../../data/mockData'
import { loadProductionJobs } from '../../utils/productionStore'

export default function ProductionTable() {
  const [jobs, setJobs] = useState(() => loadProductionJobs())

  useEffect(() => {
    const refresh = () => setJobs(loadProductionJobs())
    refresh()
    window.addEventListener('bach:production-updated', refresh)
    return () => window.removeEventListener('bach:production-updated', refresh)
  }, [])

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">Üretim Takibi</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/50">
              <th className="table-header text-left pb-2">Kod</th>
              <th className="table-header text-left pb-2">Sipariş</th>
              <th className="table-header text-left pb-2">Ürün</th>
              <th className="table-header text-right pb-2">Miktar</th>
              <th className="table-header text-center pb-2">Aşama</th>
              <th className="table-header text-center pb-2">Durum</th>
              <th className="table-header text-right pb-2">Bitiş</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((item) => (
              <tr key={item.id || item.workOrder} className="border-b border-dark-500/20 hover:bg-dark-700/50 transition-colors">
                <td className="table-cell font-medium text-accent-blue">{item.id || item.workOrder}</td>
                <td className="table-cell text-gray-500">{item.orderId}</td>
                <td className="table-cell">{item.product}</td>
                <td className="table-cell text-right">{item.quantity.toLocaleString('tr-TR')}</td>
                <td className="table-cell text-center">
                  <span className="badge-orange">{item.stage}</span>
                </td>
                <td className="table-cell text-center">
                  <span className={statusBadgeMap[item.status]}>{item.status}</span>
                </td>
                <td className="table-cell text-right text-gray-500">{item.endDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
