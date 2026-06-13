import { AlertTriangle } from 'lucide-react'
import { criticalStocks } from '../../data/mockData'

export default function CriticalStock() {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-accent-red" />
        <h3 className="text-sm font-semibold text-white">Kritik Stoklar</h3>
      </div>
      <div className="space-y-2">
        {criticalStocks.map((item) => (
          <div key={item.product} className="flex items-center justify-between py-2 border-b border-dark-500/20 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-300 truncate">{item.product}</p>
              <div className="flex gap-3 mt-0.5">
                <span className="text-xs text-gray-500">Mevcut: <span className="text-accent-red font-medium">{item.current}</span></span>
                <span className="text-xs text-gray-500">Min: {item.min}</span>
              </div>
            </div>
            <span className="badge-red shrink-0">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
