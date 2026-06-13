import { Receipt } from 'lucide-react'
import { invoices, statusBadgeMap, formatCurrency } from '../../data/mockData'

export default function EInvoiceWidget() {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="w-4 h-4 text-accent-blue" />
        <h3 className="text-sm font-semibold text-white">E-Fatura</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-500/50">
              <th className="table-header text-left pb-2">Fatura No</th>
              <th className="table-header text-left pb-2">Müşteri</th>
              <th className="table-header text-right pb-2">Tutar</th>
              <th className="table-header text-right pb-2">Tarih</th>
              <th className="table-header text-center pb-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-dark-500/20 hover:bg-dark-700/50 transition-colors">
                <td className="table-cell font-medium text-accent-blue">{inv.id}</td>
                <td className="table-cell">{inv.customer}</td>
                <td className="table-cell text-right">{formatCurrency(inv.amount)}</td>
                <td className="table-cell text-right text-gray-500">{inv.date}</td>
                <td className="table-cell text-center">
                  <span className={statusBadgeMap[inv.status]}>{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
