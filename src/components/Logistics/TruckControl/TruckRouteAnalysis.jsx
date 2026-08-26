import { formatDurationLabel, formatKmLabel } from '../../../utils/googleRoutesClient'
import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

export default function TruckRouteAnalysis({
  googleRoute,
  alternatives,
  selectedIndex,
  hasLiveGps,
  gpsHistory,
  routeSettings,
  onChangeSettings,
  onRefresh,
  onSelectRoute,
  refreshing,
  compare,
}) {
  const plannedKm = googleRoute?.distanceMeters
  const actualMeters = hasLiveGps && gpsHistory.length > 1 ? null : null

  return (
    <div className="space-y-4">
      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className={`${TCC_YFB} uppercase`}>Trafik</p>
        {googleRoute?.staticDurationSec != null || googleRoute?.durationSec != null ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <p className={TCC_MUTED}>Normal süre</p>
              <p className={TCC_YF}>{formatDurationLabel(googleRoute.staticDurationSec) || '—'}</p>
            </div>
            <div>
              <p className={TCC_MUTED}>Trafikli ETA</p>
              <p className={TCC_YF}>{formatDurationLabel(googleRoute.durationSec) || '—'}</p>
            </div>
            <div>
              <p className={TCC_MUTED}>Trafik etkisi</p>
              <p className={TCC_YF}>
                {googleRoute.trafficDeltaSec != null
                  ? `${googleRoute.trafficDeltaSec > 0 ? '+' : ''}${formatDurationLabel(Math.abs(googleRoute.trafficDeltaSec))}`
                  : '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className={`${TCC_MUTED} mt-2`}>Gerçek Google trafik verisi yok — değer uydurulmaz.</p>
        )}
      </section>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className={`${TCC_YFB} uppercase`}>Rota ayarları</p>
        <label className={`${TCC_YF} mt-2 flex items-center gap-2`}>
          <input
            type="checkbox"
            checked={Boolean(routeSettings.avoidTolls)}
            onChange={(e) => onChangeSettings({ ...routeSettings, avoidTolls: e.target.checked })}
          />
          Ücretli yollardan kaçın
        </label>
        <label className={`${TCC_YF} mt-2 flex items-center gap-2`}>
          <input
            type="checkbox"
            checked={Boolean(routeSettings.avoidHighways)}
            onChange={(e) =>
              onChangeSettings({ ...routeSettings, avoidHighways: e.target.checked })
            }
          />
          Otoyollardan kaçın
        </label>
        <label className={`${TCC_YF} mt-2 flex items-center gap-2`}>
          <input
            type="checkbox"
            checked={Boolean(routeSettings.avoidFerries)}
            onChange={(e) => onChangeSettings({ ...routeSettings, avoidFerries: e.target.checked })}
          />
          Feribottan kaçın
        </label>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Rota hesaplanıyor...' : 'Rotayı yenile'}
        </button>
      </section>

      {alternatives?.length ? (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <p className={`${TCC_YFB} uppercase`}>Alternatif rotalar</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {alternatives.map((route) => (
              <div key={route.index} className="rounded-xl border border-[var(--glass-border)] p-3">
                <p className={TCC_YFB}>{route.label}</p>
                <p className={TCC_YF}>{formatKmLabel(route.distanceMeters) || '—'}</p>
                <p className={TCC_MUTED}>{formatDurationLabel(route.durationSec) || '—'}</p>
                <button
                  type="button"
                  className="tcc-chip mt-2"
                  onClick={() => onSelectRoute(route)}
                >
                  {selectedIndex === route.index ? 'Seçili' : 'Rotayı seç'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className={`${TCC_YFB} uppercase`}>Planlanan vs gerçek</p>
        {hasLiveGps && gpsHistory.length > 1 ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <p className={TCC_MUTED}>Plan</p>
              <p className={TCC_YF}>{formatKmLabel(plannedKm) || '—'}</p>
            </div>
            <div>
              <p className={TCC_MUTED}>Gerçek</p>
              <p className={TCC_YF}>{formatKmLabel(actualMeters) || 'GPS izinden hesaplanamadı'}</p>
            </div>
            <div>
              <p className={TCC_MUTED}>{compare?.label || 'Fark'}</p>
              <p className={TCC_YF}>{compare?.value || '—'}</p>
            </div>
          </div>
        ) : (
          <p className={`${TCC_MUTED} mt-2`}>GPS yoksa plan/gerçek karşılaştırma gösterilmez.</p>
        )}
      </section>
    </div>
  )
}
