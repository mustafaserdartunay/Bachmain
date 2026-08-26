import { Link } from 'react-router-dom'
import { telHref, whatsappHref } from '../../../utils/truckControlCenter'
import { TCC_MUTED, TCC_YF, TCC_YFB, toneClass } from './truckControlUi'

function cargoSummary(cargo = []) {
  const boxes = cargo.reduce((sum, item) => sum + (Number(item.boxes) || 0), 0)
  const pallets = cargo.reduce((sum, item) => sum + (Number(item.pallets) || 0), 0)
  const kg = cargo.reduce((sum, item) => sum + (Number(item.kg) || 0), 0)
  return { boxes, pallets, kg }
}

export default function TruckStopCard({
  stop,
  draggable,
  onDragStart,
  onDrop,
  onShowOnMap,
  onRouteTo,
  onOpenProof,
}) {
  const load = cargoSummary(stop.cargo)
  const high =
    String(stop.priority || '').toLocaleLowerCase('tr-TR') === 'yüksek' ||
    String(stop.priority).toLowerCase() === 'high'

  return (
    <article
      draggable={Boolean(draggable)}
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={`app-surface-panel rounded-2xl p-4 transition-transform hover:-translate-y-0.5 ${high ? 'ring-1 ring-amber-400/70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`${TCC_YFB} text-[var(--ink)]`}>{String(stop.seq).padStart(2, '0')}</p>
          <p className={`${TCC_YF} mt-1`}>Müşteri: {stop.customerLabel}</p>
          <p className={TCC_MUTED}>{stop.address || stop.city || 'Adres yok'}</p>
        </div>
        <span className={`inline-flex items-center gap-2 ${toneClass(stop.statusTone)}`}>
          <span className={`tcc-status-dot ${stop.statusTone}`} />
          <span className={TCC_YFB}>{stop.statusLabel}</span>
        </span>
      </div>

      <dl className="mt-3 grid gap-1 sm:grid-cols-2">
        <div>
          <dt className={TCC_MUTED}>Telefon</dt>
          <dd className={TCC_YF}>{stop.phone || '—'}</dd>
        </div>
        <div>
          <dt className={TCC_MUTED}>Sipariş</dt>
          <dd className={TCC_YF}>{stop.orderNo || '—'}</dd>
        </div>
        <div>
          <dt className={TCC_MUTED}>Fatura</dt>
          <dd className={TCC_YF}>{stop.invoiceNo || '—'}</dd>
        </div>
        <div>
          <dt className={TCC_MUTED}>Yük</dt>
          <dd className={TCC_YF}>
            {load.boxes ? `${load.boxes} koli ` : ''}
            {load.pallets ? `${load.pallets} palet ` : ''}
            {load.kg ? `${Math.round(load.kg)} kg` : !load.boxes && !load.pallets ? '—' : ''}
          </dd>
        </div>
        <div>
          <dt className={TCC_MUTED}>Planlanan</dt>
          <dd className={TCC_YF}>
            {stop.plannedAt ||
              (stop.windowStart && stop.windowEnd
                ? `${stop.windowStart} – ${stop.windowEnd}`
                : '—')}
          </dd>
        </div>
        <div>
          <dt className={TCC_MUTED}>Tahmini</dt>
          <dd className={TCC_YF}>{stop.etaAt || '—'}</dd>
        </div>
        <div>
          <dt className={TCC_MUTED}>Gerçek</dt>
          <dd className={TCC_YF}>{stop.actualAt || '—'}</dd>
        </div>
        <div>
          <dt className={TCC_MUTED}>Bekleme</dt>
          <dd className={TCC_YF}>{stop.waitMin != null ? `${stop.waitMin} dk` : '—'}</dd>
        </div>
      </dl>

      {stop.windowStart && stop.windowEnd ? (
        <p className={`${TCC_MUTED} mt-2`}>
          Teslimat penceresi: {stop.windowStart} – {stop.windowEnd}
        </p>
      ) : null}

      {stop.status === 'delivered' ? (
        <p className={`${TCC_YFB} mt-2 text-emerald-600`}>
          ✓ Teslim edildi{stop.proof?.receivedBy ? ` · ${stop.proof.receivedBy}` : ''}
        </p>
      ) : null}

      {stop.customer ? (
        <div className="mt-3 grid gap-1">
          <p className={`${TCC_YFB} uppercase`}>Müşteri</p>
          <p className={TCC_YF}>{stop.companyTitle || stop.customerLabel}</p>
          <p className={TCC_MUTED}>{stop.contactName || '—'}</p>
          <p className={TCC_MUTED}>{stop.email || '—'}</p>
          {stop.taxOffice || stop.taxNumber ? (
            <p className={TCC_MUTED}>
              {[stop.taxOffice, stop.taxNumber].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          <Link to={`/musteriler/${stop.customerId}`} className={`${TCC_YF} text-blue-600`}>
            CRM kayıt
          </Link>
        </div>
      ) : null}

      {stop.lat != null ? (
        <p className={`${TCC_MUTED} mt-2`}>
          {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {stop.lat != null ? (
          <button type="button" className="tcc-chip" onClick={() => onShowOnMap?.(stop)}>
            Haritada göster
          </button>
        ) : null}
        {stop.lat != null ? (
          <button type="button" className="tcc-chip" onClick={() => onRouteTo?.(stop)}>
            Bu noktaya rota
          </button>
        ) : null}
        {telHref(stop.phone) ? (
          <a className="tcc-chip" href={telHref(stop.phone)}>
            Ara
          </a>
        ) : null}
        {stop.email ? (
          <a className="tcc-chip" href={`mailto:${stop.email}`}>
            Mesaj
          </a>
        ) : null}
        {whatsappHref(stop.phone) ? (
          <a className="tcc-chip" href={whatsappHref(stop.phone)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        ) : null}
        {stop.proof ? (
          <button type="button" className="tcc-chip" onClick={() => onOpenProof?.(stop)}>
            Teslimat kanıtı
          </button>
        ) : null}
      </div>
    </article>
  )
}
