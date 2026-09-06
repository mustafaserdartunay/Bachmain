import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, LocateFixed, Maximize2, Minus, Plus, Satellite } from 'lucide-react'
import LiveMap, { fitLiveEntities } from '../../components/Live/LiveMap'
import LiveKpiBar from '../../components/Live/LiveKpiBar'
import LiveOpsPanel from '../../components/Live/LiveOpsPanel'
import LiveDetailPanel from '../../components/Live/LiveDetailPanel'
import { collectLiveEntities, summarizeLiveKpis } from '../../live/entities'
import { createInterpolator } from '../../live/interpolate'
import { readMapboxPublicToken } from '../../live/flags'
import { fetchDirections, fetchMapboxStatus } from '../../live/mapboxClient'
import { MockLocationProvider } from '../../live/providers/MockLocationProvider'
import { LIVE_EVENT } from '../../live/constants'
import { getCompanyStartPoint } from '../../utils/customerGeo'
import { readCompanySettings } from '../../utils/companySettings'
import '../../live/live.css'

const DEFAULT_LAYERS = {
  personnel: true,
  driver: true,
  vehicle: true,
  delivery: true,
  customer: false,
  geofence: true,
  route: true,
}

function applyKpiFilter(entities, kpi) {
  if (!kpi) return entities
  if (kpi === 'personnel') return entities.filter((row) => row.kind === 'personnel')
  if (kpi === 'vehicles')
    return entities.filter((row) => row.kind === 'vehicle' || row.kind === 'driver')
  if (kpi === 'deliveries')
    return entities.filter((row) => row.kind === 'delivery' && row.status !== 'done')
  if (kpi === 'delayed') return entities.filter((row) => row.delayed || row.status === 'delayed')
  if (kpi === 'offline') return entities.filter((row) => row.status === 'offline')
  if (kpi === 'waiting') return entities.filter((row) => row.status === 'waiting')
  if (kpi === 'done') return entities.filter((row) => row.status === 'done')
  return entities
}

function applyChipFilter(entities, filter) {
  if (!filter || filter === 'all') return entities
  if (['personnel', 'driver', 'vehicle', 'delivery'].includes(filter)) {
    return entities.filter((row) => row.kind === filter)
  }
  if (filter === 'active')
    return entities.filter((row) => row.status === 'active' || row.status === 'delivering')
  return entities.filter((row) => row.status === filter || row.delayed)
}

export default function LiveOperationsPage() {
  const [snapshot, setSnapshot] = useState(() => collectLiveEntities())
  const [display, setDisplay] = useState(snapshot.entities)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [kpiFilter, setKpiFilter] = useState(null)
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [selectedId, setSelectedId] = useState(null)
  const [routeGeometry, setRouteGeometry] = useState([])
  const [mapError, setMapError] = useState('')
  const [status, setStatus] = useState(null)
  const [satellite, setSatellite] = useState(false)
  const [token] = useState(() => readMapboxPublicToken())
  const mapRef = useRef(null)
  const interpolator = useRef(createInterpolator())
  const mockRef = useRef(null)

  useEffect(() => {
    fetchMapboxStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false }))
  }, [])

  useEffect(() => {
    function refresh() {
      setSnapshot(collectLiveEntities())
    }
    window.addEventListener(LIVE_EVENT, refresh)
    window.addEventListener('bach:pdks-updated', refresh)
    window.addEventListener('bach:sevkiyat-updated', refresh)
    window.addEventListener('bach:logistics-updated', refresh)
    window.addEventListener('bach:courier-updated', refresh)
    const timer = window.setInterval(refresh, 4000)
    return () => {
      window.removeEventListener(LIVE_EVENT, refresh)
      window.removeEventListener('bach:pdks-updated', refresh)
      window.removeEventListener('bach:sevkiyat-updated', refresh)
      window.removeEventListener('bach:logistics-updated', refresh)
      window.removeEventListener('bach:courier-updated', refresh)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!snapshot.usingDemo) return undefined
    mockRef.current = new MockLocationProvider()
    return mockRef.current.subscribe((rows) => {
      setSnapshot((current) => ({ ...current, entities: rows }))
    })
  }, [snapshot.usingDemo])

  useEffect(() => {
    let start = performance.now()
    let raf = 0
    function tick(now) {
      const t = Math.min(1, (now - start) / 800)
      setDisplay(interpolator.current(snapshot.entities, t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [snapshot.entities])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR')
    return applyChipFilter(applyKpiFilter(display, kpiFilter), filter)
      .filter((row) => layers[row.kind] !== false)
      .filter((row) => {
        if (!q) return true
        return `${row.name} ${row.subtitle} ${row.plate} ${row.task || ''}`
          .toLocaleLowerCase('tr-TR')
          .includes(q)
      })
  }, [display, filter, kpiFilter, layers, query])

  const kpis = useMemo(() => summarizeLiveKpis(display), [display])
  const selected =
    filtered.find((row) => row.id === selectedId) || display.find((row) => row.id === selectedId)

  async function showRoute(entity) {
    const origin = getCompanyStartPoint(readCompanySettings())
    try {
      const result = await fetchDirections({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: entity.lat, lng: entity.lng },
      })
      setRouteGeometry(result.routes?.[0]?.geometry || [])
      setMapError('')
    } catch (error) {
      setMapError(error.message || 'Harita servisine şu anda ulaşılamıyor.')
    }
  }

  return (
    <div className="live-ops">
      <div className="flex items-center justify-between gap-3 px-3 pt-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">
            Bachmain LIVE
          </p>
          <h1 className="text-lg font-black">Canlı operasyon</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <Link to="/lojistik" className="btn-ghost !px-3 !py-2">
            Lojistik
          </Link>
          <Link to="/live/saha" className="btn-ghost !px-3 !py-2">
            Saha GPS
          </Link>
          <Link to="/ayarlar/harita" className="btn-ghost !px-3 !py-2">
            Mapbox
          </Link>
        </div>
      </div>
      <LiveKpiBar kpis={kpis} active={kpiFilter} onSelect={setKpiFilter} />
      <div className="live-ops__body">
        <LiveOpsPanel
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          layers={layers}
          onToggleLayer={(id) =>
            setLayers((current) => ({ ...current, [id]: current[id] === false }))
          }
          entities={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          usingDemo={snapshot.usingDemo}
        />
        <div className="live-ops__map-wrap">
          {token ? (
            <LiveMap
              token={token}
              entities={layers.geofence === false ? filtered : filtered}
              geofences={layers.geofence === false ? [] : snapshot.geofences}
              routeGeometry={layers.route === false ? [] : routeGeometry}
              selectedId={selectedId}
              satellite={satellite}
              onSelect={setSelectedId}
              onReady={(map) => {
                mapRef.current = map
              }}
            />
          ) : (
            <div className="live-ops__map-fallback">
              <div>
                <p className="font-black">Harita servisine şu anda ulaşılamıyor.</p>
                <p className="mt-2 text-sm text-slate-400">
                  Mapbox public token tanımlayın: Ayarlar → Harita & Konum. Liste ve demo marker’lar
                  yine çalışır.
                </p>
              </div>
            </div>
          )}
          {mapError ? (
            <p className="absolute left-3 top-3 z-[2] rounded-xl bg-black/60 px-3 py-2 text-xs text-amber-200">
              {mapError}
            </p>
          ) : null}
          {status && status.connected === false && token ? (
            <p className="absolute left-3 top-3 z-[2] rounded-xl bg-black/60 px-3 py-2 text-xs text-amber-200">
              Harita servisine şu anda ulaşılamıyor.
            </p>
          ) : null}
          <div className="live-ops__controls">
            <button type="button" aria-label="Yakınlaştır" onClick={() => mapRef.current?.zoomIn()}>
              <Plus className="mx-auto h-4 w-4" />
            </button>
            <button type="button" aria-label="Uzaklaştır" onClick={() => mapRef.current?.zoomOut()}>
              <Minus className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Tümünü sığdır"
              onClick={() => fitLiveEntities(mapRef.current, filtered)}
            >
              <Maximize2 className="mx-auto h-4 w-4" />
            </button>
            <button type="button" aria-label="Uydu" onClick={() => setSatellite((value) => !value)}>
              <Satellite className="mx-auto h-4 w-4" />
            </button>
            <button type="button" aria-label="Katmanlar" onClick={() => setLayers(DEFAULT_LAYERS)}>
              <Layers className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Sığdır"
              onClick={() => fitLiveEntities(mapRef.current, filtered)}
            >
              <LocateFixed className="mx-auto h-4 w-4" />
            </button>
          </div>
        </div>
        <LiveDetailPanel
          entity={selected}
          onShowRoute={showRoute}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  )
}
