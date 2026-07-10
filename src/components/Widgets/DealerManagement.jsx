import { Plus, MapPin } from 'lucide-react'
import { dealers, statusBadgeMap } from '../../data/mockData'

export default function DealerManagement() {
  const { summary, list, performance } = dealers

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Bayi Yönetimi</h3>
        <button className="btn-primary flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Yeni Bayi
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-dark-700 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{summary.total}</p>
              <p className="text-[12px] text-gray-500">Toplam Bayi</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{summary.active}</p>
              <p className="text-[12px] text-gray-500">Aktif</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-400">{summary.applicant}</p>
              <p className="text-[12px] text-gray-500">Başvuru</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-red-400">{summary.passive}</p>
              <p className="text-[12px] text-gray-500">Pasif</p>
            </div>
          </div>

          <h4 className="text-xs font-medium text-gray-400 mb-2">Bayi Performansı</h4>
          <div className="space-y-2">
            {performance.map((p) => (
              <div key={p.city} className="flex items-center justify-between py-1.5 border-b border-dark-500/20">
                <span className="text-sm text-gray-300">{p.city}</span>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{p.orders} sipariş</span>
                  <span className="text-xs text-accent-blue ml-2">{p.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="overflow-x-auto mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-500/50">
                  <th className="table-header text-left pb-2">Bayi</th>
                  <th className="table-header text-left pb-2">İl</th>
                  <th className="table-header text-center pb-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.name} className="border-b border-dark-500/20">
                    <td className="table-cell">{d.name}</td>
                    <td className="table-cell text-gray-500">{d.city}</td>
                    <td className="table-cell text-center">
                      <span className={statusBadgeMap[d.status]}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DealerMap() {
  const { mapPins } = dealers

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-accent-purple" />
        <h3 className="text-sm font-semibold text-white">Bayi Haritası</h3>
      </div>
      <div className="relative bg-dark-700 rounded-lg overflow-hidden" style={{ height: 200 }}>
        <svg viewBox="0 0 100 80" className="w-full h-full">
          <path
            d="M15,15 L85,12 L88,25 L82,35 L75,40 L70,50 L65,55 L55,60 L45,65 L35,62 L25,55 L18,45 L12,35 L10,25 Z"
            fill="#1a2540"
            stroke="#243052"
            strokeWidth="0.5"
          />
          {mapPins.map((pin) => (
            <g key={pin.city}>
              <circle cx={pin.x} cy={pin.y} r="3" fill={pin.color} opacity="0.3" />
              <circle cx={pin.x} cy={pin.y} r="1.5" fill={pin.color} />
              <text x={pin.x + 3} y={pin.y + 1} fill="#9ca3af" fontSize="3">{pin.city}</text>
            </g>
          ))}
        </svg>
        <div className="absolute bottom-2 right-2 flex gap-2">
          {mapPins.slice(0, 4).map((pin) => (
            <div key={pin.city} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pin.color }} />
              <span className="text-[11px] text-gray-500">{pin.city}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
