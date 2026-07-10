import { Clock3, Copy, ExternalLink, MapPin, Phone, Share2 } from 'lucide-react'
import {
  DISPATCH_STATUSES,
  formatEta,
  formatTimelineTime,
  getCustomerTrackingUrl,
  getDispatchStatusMeta,
  getVehicleTypeMeta,
} from '../../utils/courierStore'

function StatusPill({ status }) {
  const meta = getDispatchStatusMeta(status)
  return (
    <span className={`rounded-lg px-2 py-1 text-[12px] font-black uppercase tracking-wide ${meta.bg} ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

function DispatchRow({
  dispatch,
  active,
  onSelect,
  onStatusChange,
  onShare,
}) {
  const typeMeta = getVehicleTypeMeta(dispatch.vehicleType)
  const nextStatuses = DISPATCH_STATUSES.filter((item) => {
    if (dispatch.status === 'delivered' || dispatch.status === 'cancelled') return false
    const order = ['draft', 'assigned', 'picked_up', 'en_route', 'nearby', 'delivered']
    return order.indexOf(item.id) > order.indexOf(dispatch.status)
  }).slice(0, 2)

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        active
          ? 'border-white/20 bg-dark-700/90 shadow-card'
          : 'border-dark-500/45 bg-dark-800/55 hover:border-dark-400/50'
      }`}
    >
      <button type="button" onClick={() => onSelect?.(dispatch)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: `${typeMeta.color}18`, border: `1px solid ${typeMeta.color}44` }}
            >
              {typeMeta.emoji}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-white">{dispatch.customerName}</p>
                <StatusPill status={dispatch.status} />
              </div>
              <p className="mt-0.5 text-[13px] font-semibold text-gray-500">
                {dispatch.referenceNo || dispatch.trackingToken} · {typeMeta.label}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{dispatch.address || 'Adres yok'}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-black uppercase tracking-wide text-gray-500">ETA</p>
            <p className="text-sm font-bold text-emerald-300">{formatEta(dispatch.estimatedArrival)}</p>
          </div>
        </div>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dark-500/40 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Phone className="h-3.5 w-3.5" />
          {dispatch.courierName}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock3 className="h-3.5 w-3.5" />
          {formatTimelineTime(dispatch.createdAt)}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => onStatusChange?.(dispatch.id, status.id)}
              className="rounded-lg border border-dark-500/50 bg-dark-700/70 px-2.5 py-1 text-[12px] font-bold text-gray-300 hover:text-white"
            >
              {status.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onShare?.(dispatch)}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[12px] font-bold text-blue-300 hover:bg-blue-500/20"
          >
            <Share2 className="h-3 w-3" />
            {dispatch.sharedWithCustomer ? 'Paylaşıldı' : 'Müşteriye Gönder'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CourierDispatchList({
  dispatches = [],
  activeDispatchId,
  onSelectDispatch,
  onStatusChange,
  onShare,
  shareToast,
}) {
  return (
    <div className="space-y-3">
      {shareToast && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
          {shareToast}
        </div>
      )}
      {dispatches.length ? dispatches.map((dispatch) => (
        <DispatchRow
          key={dispatch.id}
          dispatch={dispatch}
          active={dispatch.id === activeDispatchId}
          onSelect={onSelectDispatch}
          onStatusChange={onStatusChange}
          onShare={onShare}
        />
      )) : (
        <div className="rounded-2xl border border-dashed border-dark-500/50 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-gray-400">Aktif gönderi bulunmuyor</p>
          <p className="mt-1 text-xs text-gray-500">Yeni gönderi oluşturarak kurye ataması yapın</p>
        </div>
      )}
    </div>
  )
}

export function CourierTrackingLinkBar({ trackingToken, onCopy }) {
  const url = getCustomerTrackingUrl(trackingToken)
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-900/70 p-3">
      <ExternalLink className="h-4 w-4 text-blue-300" />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-300">{url}</span>
      <button
        type="button"
        onClick={() => onCopy?.(url)}
        className="inline-flex items-center gap-1 rounded-lg border border-dark-500/50 bg-dark-700 px-2.5 py-1.5 text-[12px] font-bold text-gray-200 hover:text-white"
      >
        <Copy className="h-3 w-3" />
        Kopyala
      </button>
    </div>
  )
}
