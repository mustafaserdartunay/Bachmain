import { useMemo, useState } from 'react'
import { filterGpsHistory, formatClock, headingToLabel } from '../../../utils/truckControlCenter'
import { APP_SURFACE_PANEL_CLASS, PAGE_TABLE_HEADER_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

const RANGES = [
  { id: 1, label: 'Son 1 saat' },
  { id: 6, label: 'Son 6 saat' },
  { id: 12, label: 'Son 12 saat' },
  { id: 24, label: 'Son 24 saat' },
  { id: 168, label: 'Son 7 gün' },
]

const PAGE_SIZE = 50

export default function TruckGpsHistory({ points, hasLiveGps, gpsFix }) {
  const [hours, setHours] = useState(24)
  const [page, setPage] = useState(0)
  const filtered = useMemo(() => filterGpsHistory(points, hours), [points, hours])
  const slice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-0`}>
      <div className="space-y-2 p-4">
        <p className={`${TCC_YFB} uppercase`}>GPS geçmişi</p>
        {hasLiveGps && gpsFix ? (
          <p className={TCC_MUTED}>
            Son konum: {gpsFix.lat?.toFixed?.(5)}, {gpsFix.lng?.toFixed?.(5)}
            {gpsFix.updatedAt || gpsFix.at
              ? ` · ${formatClock(gpsFix.updatedAt || gpsFix.at)}`
              : ''}
            {gpsFix.speed != null ? ` · ${gpsFix.speed} km/s` : ''}
            {gpsFix.heading != null ? ` · ${headingToLabel(gpsFix.heading)}` : ''}
          </p>
        ) : (
          <p className={TCC_MUTED}>
            Konum bilgisi mevcut değil. Canlı GPS bağlantısı yok — sahte hareket üretilmez.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              className={`tcc-chip ${hours === range.id ? 'is-active' : ''}`}
              onClick={() => {
                setHours(range.id)
                setPage(0)
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              {['Zaman', 'Latitude', 'Longitude', 'Hız', 'Yön'].map((h) => (
                <th key={h} className={PAGE_TABLE_HEADER_CLASS}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((point, index) => (
              <tr key={`${point.at}-${index}`}>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>{formatClock(point.at) || '—'}</td>
                <td className={`px-3 py-2 ${TCC_YF}`}>{point.lat}</td>
                <td className={`px-3 py-2 ${TCC_YF}`}>{point.lng}</td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>
                  {point.speed != null ? `${point.speed} km/s` : '—'}
                </td>
                <td className={`px-3 py-2 ${TCC_MUTED}`}>{headingToLabel(point.heading) || '—'}</td>
              </tr>
            ))}
            {!slice.length ? (
              <tr>
                <td colSpan={5} className={`px-3 py-6 text-center ${TCC_MUTED}`}>
                  GPS noktası yok.
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
