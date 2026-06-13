import { Search, Filter, Download, Calendar } from 'lucide-react'
import { orderStatuses, sourceOptions } from '../../data/ordersData'

export default function OrderFilters({
  activeStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceChange,
  priorityFilter,
  onPriorityChange,
  dateFilter,
  onDateChange,
  resultCount,
}) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Sipariş no, müşteri veya ürün ara..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-dark-700 border border-dark-500/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-accent-blue/50"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => onSourceChange(e.target.value)}
            className="bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue/50"
          >
            {sourceOptions.map((s) => (
              <option key={s} value={s}>{s === 'Tümü' ? 'Kaynak: Tümü' : s}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue/50"
          >
            <option value="Tümü">Öncelik: Tümü</option>
            <option value="Yüksek">Yüksek</option>
            <option value="Normal">Normal</option>
            <option value="Düşük">Düşük</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-dark-700 border border-dark-500/50 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-accent-blue/50 appearance-none"
            >
              <option value="all">Tüm Tarihler</option>
              <option value="today">Bugün</option>
              <option value="week">Bu Hafta</option>
              <option value="month">Bu Ay</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 border border-dark-500/50 hover:bg-dark-700 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Gelişmiş Filtre
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 border border-dark-500/50 hover:bg-dark-700 transition-colors">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {orderStatuses.map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                activeStatus === status
                  ? 'bg-accent-blue/20 text-accent-blue font-medium'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 shrink-0 ml-4">{resultCount} sipariş bulundu</span>
      </div>
    </div>
  )
}
