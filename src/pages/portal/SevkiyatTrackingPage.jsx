import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Clock3, MapPin, Package, Phone, Truck } from 'lucide-react'
import SevkiyatMap from '../../components/Sevkiyat/SevkiyatMap'
import { readCompanySettings } from '../../utils/companySettings'
import { getCompanyStartPoint } from '../../utils/customerGeo'
import {
  enrichStopCoordinates,
  getTripByToken,
  SEVKIYAT_EVENT,
  SEVKIYAT_STATUS,
  tickSevkiyatLivePositions,
} from '../../utils/sevkiyatStore'
import { cycleTheme, getStoredTheme, THEME_TOGGLE_BUTTON_CLASS } from '../../utils/themeMode'
import ThemeModeIcon from '../../components/Common/ThemeModeIcon'
import bachLogo from '../../assets/bach-logo.png'

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  )
}

export default function SevkiyatTrackingPage() {
  const { token } = useParams()
  const [theme, setTheme] = useState(getStoredTheme)
  const [trip, setTrip] = useState(() => getTripByToken(token))
  const company = readCompanySettings()
  const hq = useMemo(() => getCompanyStartPoint(company), [company])

  const refresh = useCallback(() => {
    setTrip(getTripByToken(token))
  }, [token])

  useEffect(() => {
    window.addEventListener(SEVKIYAT_EVENT, refresh)
    return () => window.removeEventListener(SEVKIYAT_EVENT, refresh)
  }, [refresh])

  useEffect(() => {
    const timer = window.setInterval(() => {
      tickSevkiyatLivePositions()
    }, 3000)
    return () => window.clearInterval(timer)
  }, [])

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
        <div className="max-w-md rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-8 text-center shadow-[0_10px_36px_-14px_rgba(30,35,60,0.18)]">
          <Package className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <h1 className="mt-4 text-[18px] font-bold text-[var(--ink)]">Takip linki geçersiz</h1>
          <p className="mt-2 text-[14px] font-normal text-[var(--muted)]">
            Bu sevkiyat için canlı takip bağlantısı bulunamadı.
          </p>
        </div>
      </div>
    )
  }

  const stops = (trip.stops || []).map(enrichStopCoordinates)
  const statusMeta = SEVKIYAT_STATUS[trip.status] || SEVKIYAT_STATUS.draft
  const logo = company?.logoDataUrl || bachLogo
  const live = trip.status === 'in_transit'

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Canlı Sevkiyat Takibi
              </p>
              <h1 className="text-[16px] font-bold text-[var(--ink)]">
                {company?.companyTitle || 'Bach CRM'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {live ? (
              <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 sm:flex">
                <LivePulse />
                <span className="text-[12px] font-bold text-emerald-600">Canlı</span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setTheme(cycleTheme())}
              className={THEME_TOGGLE_BUTTON_CLASS}
              aria-label="Tema"
            >
              <ThemeModeIcon theme={theme} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <div className="rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[12px] font-bold uppercase text-[var(--muted)]">{trip.code}</p>
                <h2 className="text-[18px] font-bold">{statusMeta.label}</h2>
              </div>
              <div className="flex items-center gap-2 text-[14px] text-[var(--muted)]">
                <Truck className="h-4 w-4" />
                {trip.plate || '—'} · {trip.vehicleTypeLabel || 'Araç'}
              </div>
            </div>
            <SevkiyatMap
              hq={hq}
              stops={stops}
              livePosition={trip.livePosition}
              routeGeometry={trip.routeGeometry}
              className="!rounded-[20px]"
            />
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
            <p className="text-[12px] font-bold uppercase text-[var(--muted)]">Şoför</p>
            <p className="mt-1 text-[14px] font-bold">{trip.driverName || '—'}</p>
            {trip.driverPhone ? (
              <a
                href={`tel:${trip.driverPhone}`}
                className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-blue-600"
              >
                <Phone className="h-3.5 w-3.5" />
                {trip.driverPhone}
              </a>
            ) : null}
          </div>

          <div className="rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
            <p className="mb-2 text-[12px] font-bold uppercase text-[var(--muted)]">Duraklar</p>
            <div className="space-y-2">
              {stops.map((stop, index) => (
                <div key={stop.id} className="rounded-xl border border-[var(--glass-border)] px-3 py-2">
                  <p className="text-[14px] font-bold">
                    {index + 1}. {stop.customerLabel || 'Durak'}
                  </p>
                  <p className="mt-0.5 flex items-start gap-1 text-[12px] text-[var(--muted)]">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    {stop.address || '—'}
                  </p>
                  {(stop.goods || []).length ? (
                    <p className="mt-1 text-[12px] text-[var(--muted)]">
                      {(stop.goods || [])
                        .map((g) => `${g.label || 'Mal'} ×${g.qty || 0}`)
                        .join(' · ')}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {trip.route?.distanceKm != null ? (
            <div className="rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-[14px] text-[var(--muted)]">
              <Clock3 className="mb-1 inline h-3.5 w-3.5" /> {trip.route.distanceKm} km · ~
              {trip.route.durationMin} dk
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  )
}
