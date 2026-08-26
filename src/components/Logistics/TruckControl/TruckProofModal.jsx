import { formatClock } from '../../../utils/truckControlCenter'
import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

export default function TruckProofModal({ stop, item, onClose }) {
  const proof = stop?.proof
  if (!stop && !item) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <section
        className={`${APP_SURFACE_PANEL_CLASS} max-h-[90vh] w-full max-w-lg overflow-auto p-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className={`${TCC_YFB} uppercase`}>{proof ? 'Teslimat kanıtı' : 'Ürün detayı'}</p>
          <button type="button" className={TCC_MUTED} onClick={onClose}>
            Kapat
          </button>
        </div>
        {proof ? (
          <div className="space-y-2">
            {proof.photo ? (
              <button
                type="button"
                className="block w-full"
                onClick={() => window.open(proof.photo, '_blank')}
              >
                <img
                  src={proof.photo}
                  alt="Teslimat fotoğrafı"
                  className="max-h-72 w-full rounded-xl object-cover"
                />
              </button>
            ) : null}
            {proof.signature ? (
              <img
                src={proof.signature}
                alt="İmza"
                className="max-h-28 rounded-xl bg-white object-contain p-2"
              />
            ) : null}
            <p className={TCC_YF}>Teslim alan: {proof.receivedBy || '—'}</p>
            <p className={TCC_MUTED}>{formatClock(proof.at) || '—'}</p>
            {proof.lat != null ? (
              <p className={TCC_MUTED}>
                {proof.lat}, {proof.lng}
              </p>
            ) : null}
            {proof.note ? <p className={TCC_YF}>{proof.note}</p> : null}
          </div>
        ) : null}
        {item ? (
          <div className="mt-2 grid gap-1">
            <p className={TCC_YF}>{item.name}</p>
            <p className={TCC_MUTED}>SKU: {item.sku || '—'}</p>
            <p className={TCC_MUTED}>
              Miktar: {item.qty} {item.unit}
            </p>
            <p className={TCC_MUTED}>
              Koli / palet / kg: {item.boxes || 0} / {item.pallets || 0} / {item.kg || 0}
            </p>
            <p className={TCC_MUTED}>Hacim: {item.volumeM3 || '—'}</p>
            <p className={TCC_MUTED}>Müşteri: {item.customerLabel || '—'}</p>
            <p className={TCC_MUTED}>Sipariş: {item.orderNo || '—'}</p>
            <p className={TCC_MUTED}>Fatura: {item.invoiceNo || '—'}</p>
            {item.productId ? (
              <p className={TCC_MUTED}>Stok ID: {item.productId}</p>
            ) : (
              <p className={TCC_MUTED}>Bağlı stok kaydı yok.</p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}
