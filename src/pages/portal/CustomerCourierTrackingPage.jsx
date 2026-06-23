import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Clock3,
  MapPin,
  Navigation,
  Package,
  Phone,
  Radio,
  Truck,
} from 'lucide-react'
import CourierMap from '../../components/Courier/CourierMap'
import { readCompanySettings } from '../../utils/companySettings'
import {
  COURIER_UPDATED_EVENT,
  formatEta,
  formatTimelineTime,
  getDispatchByToken,
  getDispatchStatusMeta,
  getVehicleTypeMeta,
  loadCourierState,
  tickLivePositions,
} from '../../utils/courierStore'
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

export default function CustomerCourierTrackingPage() {
  const { trackingToken } = useParams()
  const [theme, setTheme] = useState(getStoredTheme)
  const [dispatch, setDispatch] = useState(() => getDispatchByToken(trackingToken))
  const [hq] = useState(() => loadCourierState().hq)
  const company = readCompanySettings()

  const refresh = useCallback(() => {
    setDispatch(getDispatchByToken(trackingToken))
  }, [trackingToken])

  useEffect(() => {
    function handleUpdate() {
      refresh()
    }
    window.addEventListener(COURIER_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(COURIER_UPDATED_EVENT, handleUpdate)
  }, [refresh])

  useEffect(() => {
    const timer = window.setInterval(() => {
      tickLivePositions()
    }, 3000)
    return () => window.clearInterval(timer)
  }, [])

  if (!dispatch || !dispatch.sharedWithCustomer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md rounded-2xl border border-dark-500/50 bg-dark-800/80 p-8 text-center shadow-card">
          <Package className="mx-auto h-10 w-10 text-gray-500" />
          <h1 className="mt-4 text-xl font-black text-white">Takip linki geçersiz</h1>
          <p className="mt-2 text-sm text-gray-400">
            Bu teslimat için canlı takip bağlantısı bulunamadı veya paylaşım kapatılmış olabilir.
          </p>
        </div>
      </div>
    )
  }

  const statusMeta = getDispatchStatusMeta(dispatch.status)
  const typeMeta = getVehicleTypeMeta(dispatch.vehicleType)
  const delivered = dispatch.status === 'delivered'
  const logo = company?.logoDataUrl || bachLogo

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <header className="border-b border-dark-500/50 bg-dark-800/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Canlı Teslimat Takibi</p>
              <h1 className="text-lg font-black text-blue-300">{company?.companyTitle || 'Bach CRM'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 sm:flex">
              <LivePulse />
              <span className="text-xs font-bold text-emerald-300">Canlı</span>
            </div>
            <button
              type="button"
              onClick={() => setTheme(cycleTheme())}
              className={THEME_TOGGLE_BUTTON_CLASS}
              aria-label="Tema değiştir"
            >
              <ThemeModeIcon mode={theme} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
        <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Sipariş / Referans</p>
                <p className="mt-1 text-2xl font-black text-white">{dispatch.referenceNo || dispatch.trackingToken}</p>
                <p className="mt-2 text-sm text-gray-400">{dispatch.customerName}</p>
              </div>
              <span className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide ${statusMeta.bg} ${statusMeta.tone}`}>
                {statusMeta.label}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wide">Tahmini Varış</span>
                </div>
                <p className="mt-2 text-xl font-black text-emerald-300">
                  {delivered ? 'Teslim edildi' : formatEta(dispatch.estimatedArrival)}
                </p>
              </div>
              <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Truck className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wide">Araç Tipi</span>
                </div>
                <p className="mt-2 text-xl font-black text-white">{typeMeta.emoji} {typeMeta.label}</p>
              </div>
              <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Navigation className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wide">Hız</span>
                </div>
                <p className="mt-2 text-xl font-black text-white">
                  {dispatch.livePosition?.speed ? `${dispatch.livePosition.speed} km/s` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Kurye Bilgisi</p>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{ background: `${typeMeta.color}18`, border: `1px solid ${typeMeta.color}44` }}
              >
                {typeMeta.emoji}
              </div>
              <div>
                <p className="text-lg font-black text-white">{dispatch.courierName}</p>
                <a href={`tel:${dispatch.courierPhone}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-blue-200">
                  <Phone className="h-4 w-4" />
                  {dispatch.courierPhone}
                </a>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-dark-500/45 bg-dark-900/50 p-4">
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Teslimat Adresi</p>
                  <p className="mt-1">{dispatch.address || 'Adres bilgisi yok'}</p>
                </div>
              </div>
            </div>
            {dispatch.packageNote && (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                {dispatch.packageNote}
              </div>
            )}
          </div>
        </section>

        <CourierMap
          hq={hq}
          dispatches={[dispatch]}
          activeDispatchId={dispatch.id}
          showAllVehicles
          className="min-h-[420px]"
          emptyMessage="Konum bilgisi yükleniyor..."
        />

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Radio className="h-4 w-4 text-purple-300" />
              <h2 className="text-sm font-black uppercase tracking-wide text-white">Teslimat Durumu</h2>
            </div>
            <div className="space-y-4">
              {(dispatch.timeline || []).slice().reverse().map((item, index) => {
                const meta = getDispatchStatusMeta(item.status)
                return (
                  <div key={`${item.at}-${index}`} className="flex gap-3">
                    <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${meta.tone}`} />
                    <div>
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-xs text-gray-500">{formatTimelineTime(item.at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
            <h2 className="text-sm font-black uppercase tracking-wide text-white">Canlı Konum</h2>
            <p className="mt-2 text-sm text-gray-400">
              Kuryeniz harita üzerinde gerçek zamanlı olarak izlenir. Sayfa açık kaldığı sürece konum otomatik güncellenir.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Son Güncelleme</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {dispatch.livePosition?.updatedAt
                    ? new Date(dispatch.livePosition.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Takip Kodu</p>
                <p className="mt-1 text-sm font-bold text-blue-300">{dispatch.trackingToken}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
