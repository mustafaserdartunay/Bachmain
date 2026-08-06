import { ExternalLink, MapPin, Truck } from 'lucide-react'
import {
  getSevkiyatTrackingUrl,
  SEVKIYAT_STATUS,
} from '../../utils/sevkiyatStore'

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function TripCard({ trip, customerId, delivered = false }) {
  const myStops = (trip.stops || []).filter(
    (stop) => String(stop.customerId) === String(customerId),
  )
  const status = SEVKIYAT_STATUS[trip.status]?.label || trip.status
  const trackingUrl = getSevkiyatTrackingUrl(trip.trackingToken)

  return (
    <article className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase text-gray-400">{trip.code}</p>
          <p className="text-sm font-black text-white">{status}</p>
        </div>
        <div className="text-right text-xs font-bold text-gray-400">
          <p>{trip.plate || '—'}</p>
          <p>{trip.vehicleTypeLabel || 'Araç'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {myStops.map((stop) => (
          <div key={stop.id} className="rounded-xl border border-dark-500/40 bg-dark-900/40 px-3 py-2">
            <p className="flex items-start gap-1.5 text-xs text-gray-300">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {stop.address || 'Adres yok'}
            </p>
            {(stop.goods || []).length ? (
              <p className="mt-1 text-[11px] text-gray-500">
                {(stop.goods || [])
                  .map((g) => `${g.label || 'Mal'} ×${g.qty || 0} ${g.unit || ''}`)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          {delivered
            ? `Teslim: ${formatWhen(trip.deliveredAt)}`
            : `Şoför: ${trip.driverName || '—'}`}
        </span>
        {!delivered && trip.status === 'in_transit' ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 font-black text-emerald-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Canlı takip
          </a>
        ) : null}
      </div>
    </article>
  )
}

export default function CustomerPortalSevkiyatView({ trips = [], customerId }) {
  const live = trips.filter((trip) =>
    ['draft', 'planned', 'in_transit'].includes(trip.status),
  )
  const delivered = trips.filter((trip) => trip.status === 'delivered')

  if (!trips.length) {
    return (
      <div className="card py-12 text-center">
        <Truck className="mx-auto h-10 w-10 text-gray-600" />
        <p className="mt-3 text-sm font-bold text-gray-400">Henüz sevkiyat yok</p>
        <p className="mt-1 text-xs text-gray-600">
          Size ait sevkiyatlar oluştuğunda burada canlı olarak görünür.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wide text-emerald-300">
          Canlı / Yoldaki Sevkiyatlar
        </h3>
        {live.length ? (
          live.map((trip) => (
            <TripCard key={trip.id} trip={trip} customerId={customerId} />
          ))
        ) : (
          <p className="text-xs text-gray-500">Şu an yolda sevkiyat yok.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">
          Teslim Edilenler
        </h3>
        {delivered.length ? (
          delivered.map((trip) => (
            <TripCard key={trip.id} trip={trip} customerId={customerId} delivered />
          ))
        ) : (
          <p className="text-xs text-gray-500">Teslim edilen sevkiyat yok.</p>
        )}
      </section>
    </div>
  )
}
