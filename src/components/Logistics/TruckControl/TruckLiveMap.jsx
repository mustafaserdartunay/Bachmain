import { useEffect, useRef } from 'react'
import {
  getGoogleMapsMapId,
  hasGoogleMapsBrowserKey,
  importGoogleMapsLibraries,
} from '../../../utils/googleMapsLoader'
import { decodeEncodedPolyline } from '../../../utils/googleRoutesClient'
import { TCC_MUTED, TCC_YFB } from './truckControlUi'

function stopColor(status) {
  if (status === 'delivered') return '#10b981'
  if (status === 'delayed' || status === 'failed') return '#e11d48'
  if (status === 'in_transit' || status === 'approaching' || status === 'on_site') return '#3b82f6'
  return '#94a3b8'
}

function createOverlayClass(google) {
  return class HtmlOverlay extends google.maps.OverlayView {
    constructor({ position, html, zIndex = 10, onClick, rotate = 0 }) {
      super()
      this.position = position
      this.html = html
      this.zIndex = zIndex
      this.onClick = onClick
      this.rotate = rotate
      this.div = null
    }

    onAdd() {
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.zIndex = String(this.zIndex)
      div.style.cursor = this.onClick ? 'pointer' : 'default'
      div.innerHTML = this.html
      if (this.onClick) div.addEventListener('click', this.onClick)
      this.div = div
      const panes = this.getPanes()
      if (!panes?.overlayMouseTarget) return
      panes.overlayMouseTarget.appendChild(div)
    }

    draw() {
      if (!this.div) return
      const projection = this.getProjection()
      if (!projection) return
      const point = projection.fromLatLngToDivPixel(this.position)
      if (!point) return
      this.div.style.left = `${point.x}px`
      this.div.style.top = `${point.y}px`
      this.div.style.transform = `translate(-50%, -100%) rotate(${this.rotate || 0}deg)`
    }

    onRemove() {
      this.div?.remove()
      this.div = null
    }

    setRotate(deg) {
      this.rotate = deg
      this.draw()
    }
  }
}

function truckHtml(plate, statusLabel) {
  return `<div class="tcc-truck-marker">
    <div class="tcc-truck-marker-icon">🚛</div>
    <div style="background:#fff;border-radius:8px;padding:2px 6px;font-size:11px;font-weight:700;color:#1e293b;box-shadow:0 4px 10px rgba(15,23,42,.18);white-space:nowrap">${plate || 'TIR'} · ${statusLabel || ''}</div>
  </div>`
}

function stopHtml(seq, color) {
  return `<div class="tcc-stop-marker" style="background:${color}">${String(seq).padStart(2, '0')}</div>`
}

export default function TruckLiveMap({
  origin,
  stops = [],
  gpsFix,
  plannedPolyline,
  historyPolyline,
  historyPath,
  mapType,
  traffic,
  showStops,
  showHistory,
  focusStopId,
  routeLoading,
  routeError,
  snapshotStale,
  plate,
  statusLabel,
  onSelectStop,
  onSelectTruck,
  mapApiRef,
}) {
  const hostRef = useRef(null)
  const mapRef = useRef(null)
  const googleRef = useRef(null)
  const overlaysRef = useRef([])
  const polylinesRef = useRef([])
  const trafficRef = useRef(null)
  const OverlayRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    if (!hasGoogleMapsBrowserKey()) return undefined

    importGoogleMapsLibraries()
      .then(({ google, maps }) => {
        if (cancelled || !hostRef.current || mapRef.current) return
        const MapCtor = maps.Map || google.maps.Map
        const mapId = getGoogleMapsMapId()
        const center =
          origin?.lat != null ? { lat: origin.lat, lng: origin.lng } : { lat: 39.93, lng: 32.86 }
        const map = new MapCtor(hostRef.current, {
          center,
          zoom: 7,
          mapId: mapId || undefined,
          gestureHandling: 'greedy',
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          mapTypeId: 'roadmap',
        })
        mapRef.current = map
        googleRef.current = google
        OverlayRef.current = createOverlayClass(google)
        trafficRef.current = new google.maps.TrafficLayer()
        if (mapApiRef) {
          mapApiRef.current = {
            fitAll() {
              const bounds = new google.maps.LatLngBounds()
              if (origin?.lat != null) bounds.extend(origin)
              stops.forEach((stop) => {
                if (stop.lat != null) bounds.extend({ lat: stop.lat, lng: stop.lng })
              })
              if (gpsFix) bounds.extend({ lat: gpsFix.lat, lng: gpsFix.lng })
              if (!bounds.isEmpty()) map.fitBounds(bounds, 48)
            },
            focusTruck() {
              if (gpsFix) map.panTo({ lat: gpsFix.lat, lng: gpsFix.lng })
            },
            focusStop(stop) {
              if (stop?.lat != null) {
                map.panTo({ lat: stop.lat, lng: stop.lng })
                map.setZoom(Math.max(map.getZoom() || 8, 12))
              }
            },
            setType(type) {
              map.setMapTypeId(type)
            },
            setTraffic(on) {
              trafficRef.current.setMap(on ? map : null)
            },
          }
        }
      })
      .catch((error) => {
        console.warn('[truck-control] map init', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const google = googleRef.current
    const Overlay = OverlayRef.current
    if (!map || !google || !Overlay) return

    overlaysRef.current.forEach((item) => item.setMap(null))
    overlaysRef.current = []
    polylinesRef.current.forEach((item) => item.setMap(null))
    polylinesRef.current = []

    const plannedPath = decodeEncodedPolyline(plannedPolyline)
    if (plannedPath.length) {
      const line = new google.maps.Polyline({
        path: plannedPath,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      })
      polylinesRef.current.push(line)
    }

    const historyPts = showHistory
      ? Array.isArray(historyPath) && historyPath.length
        ? historyPath.filter((p) => p?.lat != null && p?.lng != null)
        : decodeEncodedPolyline(historyPolyline)
      : []
    if (historyPts.length) {
      polylinesRef.current.push(
        new google.maps.Polyline({
          path: historyPts,
          strokeColor: '#64748b',
          strokeOpacity: 0.7,
          strokeWeight: 3,
          icons: [
            {
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
              offset: '0',
              repeat: '12px',
            },
          ],
          map,
        }),
      )
    }

    if (origin?.lat != null) {
      const overlay = new Overlay({
        position: new google.maps.LatLng(origin.lat, origin.lng),
        html: `<div class="tcc-stop-marker" style="background:#1e293b;border-radius:8px">D</div>`,
        zIndex: 20,
      })
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    }

    if (showStops) {
      stops.forEach((stop) => {
        if (stop.lat == null || stop.lng == null) return
        const overlay = new Overlay({
          position: new google.maps.LatLng(stop.lat, stop.lng),
          html: stopHtml(stop.seq, stopColor(stop.status)),
          zIndex: focusStopId === stop.id ? 40 : 25,
          onClick: () => onSelectStop?.(stop),
        })
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
    }

    if (gpsFix) {
      const overlay = new Overlay({
        position: new google.maps.LatLng(gpsFix.lat, gpsFix.lng),
        html: truckHtml(plate, statusLabel),
        zIndex: 50,
        rotate: Number(gpsFix.heading) || 0,
        onClick: () => onSelectTruck?.(),
      })
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    }

    trafficRef.current?.setMap(traffic ? map : null)
    map.setMapTypeId(mapType || 'roadmap')

    const focus = stops.find((stop) => stop.id === focusStopId)
    if (focus?.lat != null) {
      map.panTo({ lat: focus.lat, lng: focus.lng })
    }
  }, [
    origin,
    stops,
    gpsFix,
    plannedPolyline,
    historyPolyline,
    historyPath,
    mapType,
    traffic,
    showStops,
    showHistory,
    focusStopId,
    plate,
    statusLabel,
  ])

  if (!hasGoogleMapsBrowserKey()) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className={TCC_YFB}>Harita anahtarı yok</p>
        <p className={TCC_MUTED}>
          Canlı rota için `VITE_GOOGLE_MAPS_API_KEY` tanımlayın. Sahte harita üretilmez.
        </p>
      </div>
    )
  }

  return (
    <>
      <div ref={hostRef} className="tcc-map-canvas" />
      {routeLoading ? (
        <div className="tcc-map-overlay left-1/2 top-3 -translate-x-1/2 rounded-full border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_90%,transparent)] px-3 py-1">
          <p className={TCC_MUTED}>Rota hesaplanıyor...</p>
        </div>
      ) : null}
      {routeError ? (
        <div className="tcc-map-overlay left-1/2 top-3 -translate-x-1/2 rounded-full border border-rose-200 bg-white/80 px-3 py-1">
          <p className={`${TCC_MUTED} text-rose-600`}>{routeError}</p>
        </div>
      ) : null}
      {snapshotStale && !routeLoading ? (
        <div className="tcc-map-overlay bottom-3 left-3 rounded-full border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_90%,transparent)] px-3 py-1">
          <p className={TCC_MUTED}>Son hesaplanan rota</p>
        </div>
      ) : null}
    </>
  )
}
