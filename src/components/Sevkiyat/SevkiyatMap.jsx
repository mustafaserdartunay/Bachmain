import { useEffect, useRef } from 'react'

let leafletPromise = null

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.setAttribute('data-leaflet-css', 'true')
      document.head.appendChild(link)
    }

    const existing = document.querySelector('script[data-leaflet-js]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.setAttribute('data-leaflet-js', 'true')
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.body.appendChild(script)
  })

  return leafletPromise
}

function stopIcon(L, index) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:9999px;
      background:#10b981;border:2px solid #fff;
      box-shadow:0 6px 18px rgba(16,185,129,.4);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:11px;font-weight:800;
    ">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function vehicleIcon(L) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:12px;
      background:#3b82f6;border:2px solid #fff;
      box-shadow:0 8px 24px rgba(59,130,246,.45);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
    ">🚚</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function hqIcon(L) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:8px;
      background:#1e293b;border:2px solid #64748b;
      box-shadow:0 4px 14px rgba(15,23,42,.35);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:11px;font-weight:800;
    ">D</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

/**
 * Sevkiyat haritası — HQ, duraklar, canlı araç konumu.
 */
export default function SevkiyatMap({
  hq = null,
  stops = [],
  livePosition = null,
  routeGeometry = null,
  className = '',
  emptyMessage = 'Haritada gösterilecek durak yok',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const map = L.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([41.015, 28.979], 11)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
        }).addTo(map)
        layerRef.current = L.layerGroup().addTo(map)
        mapRef.current = map
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const L = window.L
    const layer = layerRef.current
    if (!map || !L || !layer) return

    layer.clearLayers()
    const bounds = []

    if (hq?.lat != null) {
      L.marker([hq.lat, hq.lng], { icon: hqIcon(L) })
        .bindPopup(`<strong>Depo / Merkez</strong><br/>${hq.label || ''}`)
        .addTo(layer)
      bounds.push([hq.lat, hq.lng])
    }

    stops.forEach((stop, index) => {
      if (stop.lat == null || stop.lng == null) return
      L.marker([stop.lat, stop.lng], { icon: stopIcon(L, index) })
        .bindPopup(
          `<strong>${index + 1}. ${stop.customerLabel || 'Durak'}</strong><br/>${stop.address || ''}`,
        )
        .addTo(layer)
      bounds.push([stop.lat, stop.lng])
    })

    if (livePosition?.lat != null) {
      L.marker([livePosition.lat, livePosition.lng], { icon: vehicleIcon(L) })
        .bindPopup('<strong>Araç</strong><br/>Canlı konum')
        .addTo(layer)
      bounds.push([livePosition.lat, livePosition.lng])
    }

    if (Array.isArray(routeGeometry) && routeGeometry.length >= 2) {
      L.polyline(routeGeometry, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.75,
      }).addTo(layer)
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 })
    }
  }, [hq, stops, livePosition, routeGeometry])

  const hasPoints =
    hq?.lat != null ||
    stops.some((s) => s.lat != null) ||
    livePosition?.lat != null

  return (
    <div className={`relative overflow-hidden rounded-[20px] border border-[var(--glass-border)] ${className}`}>
      <div ref={containerRef} className="h-[280px] w-full bg-[var(--ds-surface-muted)]" />
      {!hasPoints ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--glass-bg)]/80">
          <p className="text-[14px] font-normal text-[var(--muted)]">{emptyMessage}</p>
        </div>
      ) : null}
    </div>
  )
}
