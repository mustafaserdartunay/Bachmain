import { Link } from 'react-router-dom'
import { APP_SURFACE_PANEL_CLASS, PAGE_TABLE_HEADER_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

export default function TruckOrderTable({ orders }) {
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-0`}>
      <p className={`${TCC_YFB} p-4 uppercase`}>Siparişler</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              {['Sipariş', 'Müşteri', 'Tarih', 'Tutar', 'Teslimat', 'Durum', ''].map((h) => (
                <th key={h} className={PAGE_TABLE_HEADER_CLASS}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className={`px-3 py-2 ${TCC_YF}`}>{order.id}</td>
                <td className={`px-3 py-2 ${TCC_YF}`}>{order.customer || '—'}</td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>{order.createdAt || '—'}</td>
                <td className={`px-3 py-2 ${TCC_YF}`}>
                  {order.totals?.grandTotal != null
                    ? `${Number(order.totals.grandTotal).toLocaleString('tr-TR')} ₺`
                    : '—'}
                </td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>{order.deliveryDate || '—'}</td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>{order.status || '—'}</td>
                <td className="px-3 py-2">
                  <Link className="tcc-chip" to="/siparisler">
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
            {!orders.length ? (
              <tr>
                <td colSpan={7} className={`px-3 py-6 text-center ${TCC_MUTED}`}>
                  Bu sevkiyata bağlı sipariş yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
