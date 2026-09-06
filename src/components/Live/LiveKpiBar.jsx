const KPI = [
  { id: 'personnel', label: 'Canlı personel', key: 'personnel' },
  { id: 'vehicles', label: 'Canlı araç', key: 'vehicles' },
  { id: 'deliveries', label: 'Aktif teslimat', key: 'deliveries' },
  { id: 'delayed', label: 'Geciken', key: 'delayed' },
  { id: 'offline', label: 'Çevrimdışı', key: 'offline' },
  { id: 'waiting', label: 'Bekleyen', key: 'waiting' },
  { id: 'done', label: 'Tamamlanan', key: 'done' },
]

export default function LiveKpiBar({ kpis, active, onSelect }) {
  return (
    <div className="live-ops__kpis">
      {KPI.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`live-ops__kpi ${active === item.id ? 'is-on' : ''}`}
          onClick={() => onSelect(active === item.id ? null : item.id)}
        >
          <span>{item.label}</span>
          <strong>{kpis[item.key] ?? 0}</strong>
        </button>
      ))}
    </div>
  )
}
