import { Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TCC_MUTED, TCC_YF, TCC_YFB, toneClass } from './truckControlUi'
import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'

export default function TruckDetailHeader({ detail, prevId, nextId }) {
  const photo = detail.vehicle?.photoUrl
  const status = detail.status || {}

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-4`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[rgba(37,99,235,0.12)] text-blue-600">
            {photo ? (
              <img
                src={photo}
                alt={detail.plate || 'Araç'}
                className="h-full w-full object-cover"
              />
            ) : (
              <Truck className="h-7 w-7" strokeWidth={2} aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <h2 className={`${TCC_YFB} text-[var(--ink)]`}>{detail.plate || 'Plaka yok'}</h2>
            <p className={`${TCC_YF} mt-0.5`}>
              {detail.corridorLabel || 'Rota henüz tanımlı değil'}
            </p>
            <p className={`${TCC_MUTED} mt-0.5`}>Sevkiyat No: {detail.code}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-1.5">
            <span className={`tcc-status-dot ${status.tone || 'muted'}`} />
            <span className={`${TCC_YFB} uppercase ${toneClass(status.tone)}`}>
              {status.label || '—'}
            </span>
          </div>
          {prevId || nextId ? (
            <div className="flex gap-2">
              {prevId ? (
                <Link
                  to={`/lojistik/tir-sevkiyat/${prevId}`}
                  className={`${TCC_YF} hover:opacity-80`}
                >
                  Önceki TIR
                </Link>
              ) : null}
              {nextId ? (
                <Link
                  to={`/lojistik/tir-sevkiyat/${nextId}`}
                  className={`${TCC_YF} hover:opacity-80`}
                >
                  Sonraki TIR
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
