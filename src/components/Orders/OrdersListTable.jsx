import { Eye, Printer, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react'
import { statusBadgeMap, formatCurrency } from '../../data/mockData'
import { priorityBadgeMap, paymentStatusBadgeMap } from '../../data/ordersData'
import { getCustomerDisplay } from '../../utils/customerDisplay'

export default function OrdersListTable({
  orders,
  selectedId,
  onSelect,
  sortField,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}) {
  const allSelected = orders.length > 0 && selectedIds.length === orders.length

  function SortIcon({ field }) {
    if (sortField !== field) return null
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />
  }

  function SortableHeader({ field, children, align = 'left' }) {
    return (
      <th
        className={`table-header pb-2 cursor-pointer hover:text-gray-300 select-none text-${align}`}
        onClick={() => onSort(field)}
      >
        {children}
        <SortIcon field={field} />
      </th>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/50">
              <th className="pb-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-dark-500 bg-dark-700 text-accent-blue focus:ring-accent-blue/50"
                />
              </th>
              <SortableHeader field="id">Sipariş No</SortableHeader>
              <SortableHeader field="customer">Müşteri</SortableHeader>
              <th className="table-header text-left pb-2">Ürünler</th>
              <SortableHeader field="amount" align="right">Tutar</SortableHeader>
              <SortableHeader field="status" align="center">Durum</SortableHeader>
              <th className="table-header text-center pb-2">Öncelik</th>
              <th className="table-header text-center pb-2">Ödeme</th>
              <th className="table-header text-left pb-2">Kaynak</th>
              <SortableHeader field="date" align="right">Tarih</SortableHeader>
              <SortableHeader field="delivery" align="right">Teslim</SortableHeader>
              <th className="table-header text-center pb-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isSelected = selectedId === order.id
              const isChecked = selectedIds.includes(order.id)
              const itemSummary = order.items.map((i) => i.product).slice(0, 2).join(', ')
              const extraItems = order.items.length > 2 ? ` +${order.items.length - 2}` : ''

              const customerDisplay = getCustomerDisplay(order.customer)

              return (
                <tr
                  key={order.id}
                  onClick={() => onSelect(order.id)}
                  className={`border-b border-dark-500/20 cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent-blue/10' : 'hover:bg-dark-700/50'
                  }`}
                >
                  <td className="py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelect(order.id)}
                      className="rounded border-dark-500 bg-dark-700 text-accent-blue focus:ring-accent-blue/50"
                    />
                  </td>
                  <td className="table-cell font-medium text-accent-blue">{order.id}</td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">{customerDisplay.brandShortName}</p>
                      <p className="text-xs text-gray-500">{customerDisplay.companyTitle}</p>
                    </div>
                  </td>
                  <td className="table-cell text-gray-400 text-xs max-w-[160px] truncate">
                    {itemSummary}{extraItems}
                  </td>
                  <td className="table-cell text-right font-medium">{formatCurrency(order.amount)}</td>
                  <td className="table-cell text-center">
                    <span className={statusBadgeMap[order.status] || 'badge-gray'}>{order.status}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={priorityBadgeMap[order.priority]}>{order.priority}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={paymentStatusBadgeMap[order.paymentStatus]}>{order.paymentStatus}</span>
                  </td>
                  <td className="table-cell text-gray-500 text-xs">{order.source}</td>
                  <td className="table-cell text-right text-gray-500">{order.date}</td>
                  <td className="table-cell text-right text-gray-500">{order.delivery}</td>
                  <td className="table-cell text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelect(order.id)}
                        className="p-1.5 rounded-md hover:bg-dark-600 text-gray-400 hover:text-accent-blue transition-colors"
                        title="Detay"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors" title="Yazdır">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          Filtrelere uygun sipariş bulunamadı.
        </div>
      )}
    </div>
  )
}
