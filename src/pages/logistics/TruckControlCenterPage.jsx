import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppPageBackLink, AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  APP_SURFACE_PANEL_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
} from '../../utils/dashboardDesign'
import { useOrg } from '../../org/OrgContext'
import { hasGoogleMapsBrowserKey } from '../../utils/googleMapsLoader'
import {
  computeGoogleTruckRoute,
  formatDurationLabel,
  formatKmLabel,
} from '../../utils/googleRoutesClient'
import { LOGISTICS_EVENT } from '../../utils/logisticsStore'
import { SEVKIYAT_EVENT } from '../../utils/sevkiyatStore'
import {
  TABS,
  TRUCK_CONTROL_LIST_PATH,
  appendTruckNote,
  loadTruckControlDetail,
  reorderTruckStops,
  saveTruckRouteSettings,
  saveTruckRouteSnapshot,
  selectTruckAlternateRoute,
  unpaidInvoiceCount,
} from '../../utils/truckControlCenter'
import TruckDetailHeader from '../../components/Logistics/TruckControl/TruckDetailHeader'
import TruckKpiBar from '../../components/Logistics/TruckControl/TruckKpiBar'
import TruckOperationStatus from '../../components/Logistics/TruckControl/TruckOperationStatus'
import TruckLiveMap from '../../components/Logistics/TruckControl/TruckLiveMap'
import TruckMapControls from '../../components/Logistics/TruckControl/TruckMapControls'
import TruckRouteTimeline from '../../components/Logistics/TruckControl/TruckRouteTimeline'
import TruckStopCard from '../../components/Logistics/TruckControl/TruckStopCard'
import TruckDeliveryPanel from '../../components/Logistics/TruckControl/TruckDeliveryPanel'
import TruckDriverCard from '../../components/Logistics/TruckControl/TruckDriverCard'
import TruckVehicleCard from '../../components/Logistics/TruckControl/TruckVehicleCard'
import TruckCargoTable from '../../components/Logistics/TruckControl/TruckCargoTable'
import TruckInvoiceTable from '../../components/Logistics/TruckControl/TruckInvoiceTable'
import TruckOrderTable from '../../components/Logistics/TruckControl/TruckOrderTable'
import TruckDocuments from '../../components/Logistics/TruckControl/TruckDocuments'
import TruckGpsHistory from '../../components/Logistics/TruckControl/TruckGpsHistory'
import TruckRouteAnalysis from '../../components/Logistics/TruckControl/TruckRouteAnalysis'
import TruckEventTimeline from '../../components/Logistics/TruckControl/TruckEventTimeline'
import TruckNotes from '../../components/Logistics/TruckControl/TruckNotes'
import TruckProofModal from '../../components/Logistics/TruckControl/TruckProofModal'
import {
  TCC_INPUT,
  TCC_MUTED,
  TCC_YF,
  TCC_YFB,
} from '../../components/Logistics/TruckControl/truckControlUi'
import '../../components/Logistics/TruckControl/truckControl.css'

const STOP_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'delivered', label: 'Teslim edildi' },
  { id: 'in_transit', label: 'Yolda' },
  { id: 'planned', label: 'Bekliyor' },
  { id: 'delayed', label: 'Gecikmiş' },
  { id: 'returned', label: 'İade' },
  { id: 'partial', label: 'Kısmi' },
]

const STOP_SORTS = [
  { id: 'seq', label: 'Teslimat sırası' },
  { id: 'eta', label: 'ETA' },
  { id: 'customer', label: 'Müşteri' },
  { id: 'status', label: 'Durum' },
  { id: 'priority', label: 'Öncelik' },
]

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="tcc-skel h-24" />
      <div className="tcc-skel h-16" />
      <div className="tcc-skel h-[52vh]" />
    </div>
  )
}

export default function TruckControlCenterPage() {
  const { shipmentId } = useParams()
  const { scope } = useOrg()
  const [tick, setTick] = useState(0)
  const [tab, setTab] = useState('live')
  const [openedTabs, setOpenedTabs] = useState({ live: true })
  const [search, setSearch] = useState('')
  const [stopFilter, setStopFilter] = useState('all')
  const [stopSort, setStopSort] = useState('seq')
  const [selectedStop, setSelectedStop] = useState(null)
  const [proof, setProof] = useState(null)
  const [cargoItem, setCargoItem] = useState(null)
  const [mapType, setMapType] = useState('roadmap')
  const [traffic, setTraffic] = useState(false)
  const [showStops, setShowStops] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [routeState, setRouteState] = useState({
    loading: false,
    error: '',
    result: null,
    stale: false,
  })
  const [legRoute, setLegRoute] = useState(null)
  const mapApiRef = useRef(null)
  const lastHashRef = useRef('')

  const loaded = useMemo(() => {
    try {
      return loadTruckControlDetail(shipmentId, scope) || { error: 'not_found', detail: null }
    } catch (error) {
      console.warn('[truck-control] page load', error)
      return { error: 'not_found', detail: null }
    }
  }, [shipmentId, scope, tick])
  const detail = loaded.detail

  useEffect(() => {
    function refresh() {
      setTick((n) => n + 1)
    }
    window.addEventListener(LOGISTICS_EVENT, refresh)
    window.addEventListener(SEVKIYAT_EVENT, refresh)
    return () => {
      window.removeEventListener(LOGISTICS_EVENT, refresh)
      window.removeEventListener(SEVKIYAT_EVENT, refresh)
    }
  }, [])

  useEffect(() => {
    if (!detail?.hasLiveGps) return undefined
    const timer = window.setInterval(() => setTick((n) => n + 1), 20000)
    return () => window.clearInterval(timer)
  }, [detail?.hasLiveGps])

  const requestInput = useMemo(() => {
    if (!detail?.origin || !detail.destination) return null
    if (detail.origin.lat == null || detail.destination.lat == null) return null
    return {
      origin: { lat: detail.origin.lat, lng: detail.origin.lng },
      destination: { lat: detail.destination.lat, lng: detail.destination.lng },
      intermediates: (detail.intermediates || [])
        .filter((stop) => stop.lat != null && stop.lng != null)
        .map((stop) => ({ lat: stop.lat, lng: stop.lng })),
      avoidTolls: Boolean(detail.routeSettings?.avoidTolls),
      avoidHighways: Boolean(detail.routeSettings?.avoidHighways),
      avoidFerries: Boolean(detail.routeSettings?.avoidFerries),
      computeAlternativeRoutes: true,
      vehicle: {
        weightKg: detail.vehicle?.weightKg || detail.vehicle?.maxKg,
        heightM: detail.vehicle?.heightM,
        widthM: detail.vehicle?.widthM,
        lengthM: detail.vehicle?.lengthM,
      },
    }
  }, [detail])

  const detailIdRef = useRef(detail?.id)
  const snapshotRef = useRef(detail?.routeSnapshot)
  detailIdRef.current = detail?.id
  snapshotRef.current = detail?.routeSnapshot

  const runRoute = useCallback(
    async (force = false) => {
      if (!requestInput || !hasGoogleMapsBrowserKey()) {
        const snap = snapshotRef.current
        if (snap) {
          setRouteState({
            loading: false,
            error: hasGoogleMapsBrowserKey() ? '' : 'Rota servisine şu anda ulaşılamıyor.',
            result: {
              ok: true,
              primary: snap.primary || snap,
              routes: snap.routes || [snap.primary || snap],
              stale: true,
            },
            stale: true,
          })
        }
        return
      }
      setRouteState((prev) => ({ ...prev, loading: true, error: '' }))
      const result = await computeGoogleTruckRoute(requestInput, { force })
      if (
        result.ok &&
        detailIdRef.current &&
        !result.cached &&
        result.requestHash &&
        result.requestHash !== lastHashRef.current
      ) {
        saveTruckRouteSnapshot(
          detailIdRef.current,
          {
            ...result,
            encodedPolyline: result.primary?.encodedPolyline,
            primary: result.primary,
            routes: result.routes,
            computedAt: result.computedAt,
            source: 'google-routes',
          },
          scope,
        )
        lastHashRef.current = result.requestHash
      }
      setRouteState({
        loading: false,
        error: result.ok ? '' : result.error || 'Rota servisine şu anda ulaşılamıyor.',
        result,
        stale: Boolean(result.stale),
      })
    },
    [requestInput, scope],
  )

  useEffect(() => {
    if (!requestInput) return undefined
    const handle = window.setTimeout(() => {
      runRoute(false)
    }, 400)
    return () => window.clearTimeout(handle)
  }, [requestInput, runRoute])

  const googleRoute = routeState.result?.primary || detail?.routeSnapshot?.primary || null
  const alternatives = routeState.result?.routes || detail?.routeSnapshot?.routes || []

  const kpis = useMemo(() => {
    if (!detail) return {}
    const next = { ...detail.kpis }
    if (googleRoute) {
      next.planKmLabel = formatKmLabel(googleRoute.distanceMeters) || next.planKmLabel
      next.planDurationLabel =
        formatDurationLabel(googleRoute.staticDurationSec || googleRoute.durationSec) ||
        next.planDurationLabel
      next.trafficDurationLabel =
        formatDurationLabel(googleRoute.durationSec) || next.trafficDurationLabel
      next.trafficDeltaLabel =
        googleRoute.trafficDeltaSec != null
          ? `${googleRoute.trafficDeltaSec > 0 ? '+' : ''}${formatDurationLabel(Math.abs(googleRoute.trafficDeltaSec))}`
          : next.trafficDeltaLabel
      if (detail.hasLiveGps) {
        next.remainingKmLabel = formatKmLabel(googleRoute.distanceMeters)
        next.remainingDurationLabel = formatDurationLabel(googleRoute.durationSec)
        next.etaLabel =
          googleRoute.durationSec != null
            ? new Date(Date.now() + googleRoute.durationSec * 1000).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : next.etaLabel
      }
    }
    return next
  }, [detail, googleRoute])

  const filteredStops = useMemo(() => {
    if (!detail) return []
    const q = search.trim().toLocaleLowerCase('tr-TR')
    let rows = detail.stops.filter((stop) => {
      if (stopFilter !== 'all') {
        if (stopFilter === 'planned' && !['planned', 'loading', 'loaded'].includes(stop.status))
          return false
        if (stopFilter !== 'planned' && stop.status !== stopFilter) return false
      }
      if (!q) return true
      return [
        stop.customerLabel,
        stop.address,
        stop.city,
        stop.orderNo,
        stop.invoiceNo,
        ...(stop.cargo || []).map((c) => c.name),
      ]
        .join(' ')
        .toLocaleLowerCase('tr-TR')
        .includes(q)
    })
    rows = [...rows].sort((a, b) => {
      if (stopSort === 'customer')
        return String(a.customerLabel).localeCompare(b.customerLabel, 'tr')
      if (stopSort === 'status') return String(a.statusLabel).localeCompare(b.statusLabel, 'tr')
      if (stopSort === 'priority') return String(b.priority).localeCompare(String(a.priority), 'tr')
      if (stopSort === 'eta') return String(a.etaAt).localeCompare(String(b.etaAt))
      return a.seq - b.seq
    })
    return rows
  }, [detail, search, stopFilter, stopSort])

  function openTab(id) {
    setTab(id)
    setOpenedTabs((prev) => ({ ...prev, [id]: true }))
  }

  async function routeToStop(stop) {
    const originPoint =
      detail?.hasLiveGps && detail.gpsFix
        ? { lat: detail.gpsFix.lat, lng: detail.gpsFix.lng }
        : detail?.origin
    if (!originPoint || stop.lat == null) return
    setRouteState((prev) => ({ ...prev, loading: true }))
    const result = await computeGoogleTruckRoute({
      origin: originPoint,
      destination: { lat: stop.lat, lng: stop.lng },
      intermediates: [],
      avoidTolls: detail.routeSettings.avoidTolls,
      avoidHighways: detail.routeSettings.avoidHighways,
      avoidFerries: detail.routeSettings.avoidFerries,
      vehicle: requestInput?.vehicle,
    })
    setLegRoute(result.ok ? result.primary : null)
    setRouteState((prev) => ({
      ...prev,
      loading: false,
      error: result.ok ? prev.error : result.error || prev.error,
    }))
    setSelectedStop(stop)
  }

  function handleMapAction(id) {
    if (id === 'normal') setMapType('roadmap')
    if (id === 'satellite') setMapType('hybrid')
    if (id === 'traffic') setTraffic((v) => !v)
    if (id === 'stops') setShowStops((v) => !v)
    if (id === 'history') setShowHistory((v) => !v)
    if (id === 'fullscreen') setFullscreen((v) => !v)
    if (id === 'fit') mapApiRef.current?.fitAll()
    if (id === 'focusTruck') mapApiRef.current?.focusTruck()
  }

  function handleDrop(targetId, draggedId) {
    if (!detail || !draggedId || draggedId === targetId) return
    const ids = detail.stops.map((stop) => stop.id)
    const from = ids.indexOf(draggedId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, draggedId)
    reorderTruckStops(detail.id, next, scope)
    setTick((n) => n + 1)
  }

  if (loaded.error === 'forbidden') {
    return (
      <AppPageShell className="tcc-shell">
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink to={TRUCK_CONTROL_LIST_PATH} label="Tır Sevkiyat" />}
          centerTitle="TIR KONTROL MERKEZİ"
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        />
        <section className={`${APP_SURFACE_PANEL_CLASS} p-6`}>
          <p className={TCC_YFB}>Bu sevkiyatı görüntüleme yetkiniz yok.</p>
          <p className={`${TCC_MUTED} mt-2`}>Başka şirketin TIR kaydı URL ile açılamaz.</p>
        </section>
      </AppPageShell>
    )
  }

  if (loaded.error === 'not_found' || !detail) {
    return (
      <AppPageShell className="tcc-shell">
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink to={TRUCK_CONTROL_LIST_PATH} label="Tır Sevkiyat" />}
          centerTitle="TIR KONTROL MERKEZİ"
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        />
        <section className={`${APP_SURFACE_PANEL_CLASS} p-6`}>
          <p className={TCC_YFB}>Sevkiyat bulunamadı.</p>
          <p className={`${TCC_MUTED} mt-2`}>URL’deki kimlik bu şirketin kayıtlarında yok.</p>
          <Link className="tcc-chip mt-3 inline-flex" to={TRUCK_CONTROL_LIST_PATH}>
            Tır Sevkiyat listesine dön
          </Link>
        </section>
      </AppPageShell>
    )
  }

  const historyPath = showHistory
    ? (detail.gpsHistory || []).map((point) => ({ lat: point.lat, lng: point.lng }))
    : []
  const plannedPolyline =
    legRoute?.encodedPolyline ||
    googleRoute?.encodedPolyline ||
    detail.routeSnapshot?.encodedPolyline ||
    ''
  const unpaid = unpaidInvoiceCount(detail.invoices || [])

  const mapBlock = (
    <section className={`${APP_SURFACE_PANEL_CLASS} tcc-map-wrap p-0`}>
      <TruckLiveMap
        origin={detail.origin}
        stops={detail.stops}
        gpsFix={detail.gpsFix}
        plannedPolyline={plannedPolyline}
        historyPath={historyPath}
        mapType={mapType}
        traffic={traffic}
        showStops={showStops}
        showHistory={showHistory}
        focusStopId={selectedStop?.id}
        routeLoading={routeState.loading}
        routeError={routeState.error}
        snapshotStale={routeState.stale}
        plate={detail.plate}
        statusLabel={detail.status.label}
        onSelectStop={setSelectedStop}
        onSelectTruck={() => setSelectedStop(null)}
        mapApiRef={mapApiRef}
      />
      <div className="tcc-map-overlay left-3 top-3">
        <div className="tcc-float-panel app-surface-panel p-3">
          <TruckRouteTimeline
            origin={detail.origin}
            stops={detail.stops}
            selectedId={selectedStop?.id}
            onSelectStop={(stop) => {
              setSelectedStop(stop)
              mapApiRef.current?.focusStop(stop)
            }}
          />
        </div>
      </div>
      <div className="tcc-map-overlay right-3 top-3 max-w-[min(100%,420px)]">
        <TruckMapControls
          mapType={mapType}
          traffic={traffic}
          showStops={showStops}
          showHistory={showHistory}
          fullscreen={fullscreen}
          hasGps={detail.hasLiveGps}
          hasHistory={detail.gpsHistory.length > 1}
          onAction={handleMapAction}
        />
      </div>
      {selectedStop ? (
        <TruckDeliveryPanel
          stop={selectedStop}
          onClose={() => setSelectedStop(null)}
          onOpenProof={setProof}
        />
      ) : null}
      {!detail.hasLiveGps ? (
        <div className="tcc-map-overlay bottom-3 left-1/2 -translate-x-1/2 rounded-2xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_92%,transparent)] px-4 py-2 text-center">
          <p className={TCC_YFB}>Canlı GPS bağlantısı yok</p>
          <p className={TCC_MUTED}>Bu araç için canlı konum verisi bulunmuyor.</p>
        </div>
      ) : null}
    </section>
  )

  return (
    <AppPageShell className="tcc-shell">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink to={TRUCK_CONTROL_LIST_PATH} label="Tır Sevkiyat" />}
        centerTitle="TIR KONTROL MERKEZİ"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
      />

      <TruckDetailHeader detail={detail} prevId={detail.prevId} nextId={detail.nextId} />
      <TruckKpiBar kpis={kpis} />
      <TruckOperationStatus
        banner={detail.banner}
        kpis={kpis}
        windowRisk={detail.windowRisk}
        hasLiveGps={detail.hasLiveGps}
      />

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className={`${TCC_YFB} uppercase`}>Kalan operasyon</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          <span className={TCC_YF}>{kpis.remainingStops} teslimat</span>
          <span className={TCC_YF}>
            {detail.hasLiveGps
              ? kpis.remainingKmLabel || '—'
              : kpis.planKmLabel || 'Plan mesafe için rota gerekli'}
          </span>
          <span className={TCC_YF}>
            {detail.hasLiveGps ? kpis.remainingDurationLabel || '—' : kpis.planDurationLabel || '—'}
          </span>
          <span className={TCC_YF}>{unpaid} bekleyen fatura</span>
        </div>
        <div className="mt-3">
          <p className={TCC_MUTED}>
            %{kpis.deliveryPct} tamamlandı · {kpis.delivered} / {kpis.totalStops} teslimat
          </p>
          <div className="tcc-progress mt-1">
            <span style={{ width: `${kpis.deliveryPct || 0}%` }} />
          </div>
        </div>
      </section>

      {detail.routeNeedsRecalc ? (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <p className={TCC_YFB}>Teslimat sırası değişti — rotayı yeniden hesapla</p>
          <button type="button" className="btn-primary mt-3" onClick={() => runRoute(true)}>
            Rotayı yeniden hesapla
          </button>
        </section>
      ) : null}

      <nav className="tcc-tabs" aria-label="Tır kontrol sekmeleri">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tcc-tab ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => openTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'live' ? mapBlock : null}

      {tab === 'stops' ? (
        <div className="space-y-3">
          <section
            className={`${APP_SURFACE_PANEL_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}
          >
            <input
              className={TCC_INPUT}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Müşteri, adres, sipariş, fatura, ürün"
            />
            <select
              className={TCC_INPUT}
              value={stopFilter}
              onChange={(e) => setStopFilter(e.target.value)}
            >
              {STOP_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              className={TCC_INPUT}
              value={stopSort}
              onChange={(e) => setStopSort(e.target.value)}
            >
              {STOP_SORTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </section>
          {filteredStops.map((stop) => (
            <TruckStopCard
              key={stop.id}
              stop={stop}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', stop.id)}
              onDrop={(event) => {
                event.preventDefault()
                handleDrop(stop.id, event.dataTransfer.getData('text/plain'))
              }}
              onShowOnMap={(item) => {
                openTab('live')
                setSelectedStop(item)
                window.setTimeout(() => mapApiRef.current?.focusStop(item), 50)
              }}
              onRouteTo={routeToStop}
              onOpenProof={setProof}
            />
          ))}
          {!filteredStops.length ? <p className={TCC_MUTED}>Eşleşen teslimat yok.</p> : null}
        </div>
      ) : null}

      {openedTabs.cargo && tab === 'cargo' ? (
        <TruckCargoTable cargo={detail.cargo} vehicle={detail.vehicle} onOpenItem={setCargoItem} />
      ) : null}

      {openedTabs.invoices && tab === 'invoices' ? (
        <TruckInvoiceTable invoices={detail.invoices} />
      ) : null}

      {openedTabs.orders && tab === 'orders' ? <TruckOrderTable orders={detail.orders} /> : null}

      {openedTabs.docs && tab === 'docs' ? <TruckDocuments documents={detail.documents} /> : null}

      {openedTabs.crew && tab === 'crew' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <TruckDriverCard
            driver={detail.driver}
            stats={detail.driverStats}
            plate={detail.plate}
            vehicle={detail.vehicle}
          />
          <TruckVehicleCard vehicle={detail.vehicle} />
        </div>
      ) : null}

      {openedTabs.gps && tab === 'gps' ? (
        <TruckGpsHistory
          points={detail.gpsHistory}
          hasLiveGps={detail.hasLiveGps}
          gpsFix={detail.gpsFix}
        />
      ) : null}

      {openedTabs.analysis && tab === 'analysis' ? (
        <TruckRouteAnalysis
          googleRoute={googleRoute}
          alternatives={alternatives}
          selectedIndex={googleRoute?.index ?? 0}
          hasLiveGps={detail.hasLiveGps}
          gpsHistory={detail.gpsHistory}
          routeSettings={detail.routeSettings}
          refreshing={routeState.loading}
          onChangeSettings={(next) => {
            saveTruckRouteSettings(detail.id, next, scope)
            setTick((n) => n + 1)
          }}
          onRefresh={() => runRoute(true)}
          onSelectRoute={(route) => {
            selectTruckAlternateRoute(detail.id, route, scope)
            setRouteState((prev) => ({
              ...prev,
              result: prev.result
                ? { ...prev.result, primary: route }
                : { ok: true, primary: route, routes: alternatives },
            }))
            setTick((n) => n + 1)
          }}
        />
      ) : null}

      {openedTabs.history && tab === 'history' ? (
        <TruckEventTimeline events={detail.events} />
      ) : null}

      {openedTabs.notes && tab === 'notes' ? (
        <TruckNotes
          notes={detail.notes}
          onAdd={(text) => {
            appendTruckNote(detail.id, text, scope)
            setTick((n) => n + 1)
          }}
        />
      ) : null}

      {proof || cargoItem ? (
        <TruckProofModal
          stop={proof}
          item={cargoItem}
          onClose={() => {
            setProof(null)
            setCargoItem(null)
          }}
        />
      ) : null}

      {fullscreen ? <div className="tcc-fs">{mapBlock}</div> : null}
    </AppPageShell>
  )
}

export { Skeleton as TruckControlSkeleton }
