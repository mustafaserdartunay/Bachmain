import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_SURFACE_PANEL_CLASS, PAGE_TABLE_HEADER_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

const PAGE_SIZE = 30

export default function TruckInvoiceTable({ invoices, error }) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE))
  const slice = useMemo(
    () => invoices.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [invoices, page],
  )

  if (error) {
    return (
      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className={TCC_YFB}>Fatura bilgisi alınamadı.</p>
        <p className={`${TCC_MUTED} mt-1`}>{error}</p>
      </section>
    )
  }

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-0`}>
      <p className={`${TCC_YFB} p-4 uppercase`}>Faturalar</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              {['Fatura No', 'Tarih', 'Müşteri', 'Tutar', 'Ödeme', 'Ürün', ''].map((h) => (
                <th key={h} className={PAGE_TABLE_HEADER_CLASS}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id}>
                <td className={`px-3 py-2 ${TCC_YF}`}>{row.invoiceNo || row.id}</td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>{row.issueDate || '—'}</td>
                <td className={`px-3 py-2 ${TCC_YF}`}>{row.customerName || '—'}</td>
                <td className={`px-3 py-2 ${TCC_YF}`}>
                  {Number(row.totalAmount || 0).toLocaleString('tr-TR')} ₺
                </td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>
                  {Number(row.remainingAmount) > 0 ? 'Bekliyor' : 'Tahsil'}
                </td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>{row.itemCount || '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Link className="tcc-chip" to="/musteriler/faturalar">
                      Görüntüle
                    </Link>
                    <button type="button" className="tcc-chip" onClick={() => window.print()}>
                      PDF / Yazdır
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!slice.length ? (
              <tr>
                <td colSpan={7} className={`px-3 py-6 text-center ${TCC_MUTED}`}>
                  Bu sevkiyata bağlı fatura yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="flex justify-end gap-2 p-3">
          <button
            type="button"
            className="tcc-chip"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Önceki
          </button>
          <button
            type="button"
            className="tcc-chip"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            Sonraki
          </button>
        </div>
      ) : null}
    </section>
  )
}
