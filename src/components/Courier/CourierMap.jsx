import { useEffect, useRef } from 'react'
import { getVehicleTypeMeta } from '../../utils/courierStore'

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

function vehicleIcon(L, vehicleType, active = false) {
  const meta = getVehicleTypeMeta(vehicleType)
  const size = active ? 38 : 32
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:14px;
      background:${meta.color};border:2px solid ${active ? '#fff' : 'rgba(255,255,255,.85)'};
      box-shadow:0 8px 24px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
      font-size:${active ? 18 : 16}px;
      transform:rotate(${active ? 8 : 0}deg);
    ">${meta.emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function destinationIcon(L) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;border-radius:9999px;
      background:#10b981;border:3px solid #fff;
      box-shadow:0 6px 18px rgba(16,185,129,.45);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:12px;font-weight:900;
    ">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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

export default function CourierMap({
  hq = null,
  dispatches = [],
  activeDispatchId = null,
  showAllVehicles = true,
  onDispatchClick,
  className = '',
  emptyMessage = 'Haritada gösterilecek gönderi yok',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const vehicleLayerRef = useRef(null)
  const markerLayerRef = useRef(null)
  const routeLayerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([41.015, 28.979], 11)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map)

      vehicleLayerRef.current = L.layerGroup().addTo(map)
      markerLayerRef.current = L.layerGroup().addTo(map)
      routeLayerRef.current = L.layerGroup().addTo(map)
      mapRef.current = map
    }).catch(() => {})

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
    const vehicleLayer = vehicleLayerRef.current
    const markerLayer = markerLayerRef.current
    const routeLayer = routeLayerRef.current
    if (!map || !L || !vehicleLayer || !markerLayer || !routeLayer) return

    vehicleLayer.clearLayers()
    markerLayer.clearLayers()
    routeLayer.clearLayers()

    const bounds = []
    const active = dispatches.find((item) => item.id === activeDispatchId)

    if (hq) {
      const hqMarker = L.marker([hq.lat, hq.lng], { icon: hqIcon(L) })
      hqMarker.bindPopup(`<strong>Merkez Depo</strong><br/><span style="font-size:11px;color:#94a3b8">${hq.label || ''}</span>`)
      hqMarker.addTo(markerLayer)
      bounds.push([hq.lat, hq.lng])
    }

    dispatches.forEach((dispatch) => {
      const isActive = dispatch.id === activeDispatchId
      if (!showAllVehicles && !isActive) return

      const pos = dispatch.livePosition || dispatch.destination
      if (!pos?.lat || !pos?.lng) return

      bounds.push([pos.lat, pos.lng])

      const vehicleMarker = L.marker([pos.lat, pos.lng], {
        icon: vehicleIcon(L, dispatch.vehicleType, isActive),
      })
      const typeMeta = getVehicleTypeMeta(dispatch.vehicleType)
      vehicleMarker.bindPopup(`
        <strong>${dispatch.courierName || 'Kurye'}</strong><br/>
        <span style="font-size:11px;color:#64748b">${typeMeta.label} · ${dispatch.referenceNo || dispatch.trackingToken}</span><br/>
        <span style="font-size:11px;color:#64748b">${dispatch.customerName || ''}</span>
      `)
      vehicleMarker.on('click', () => onDispatchClick?.(dispatch))
      vehicleMarker.addTo(vehicleLayer)

      if (dispatch.destination) {
        const destMarker = L.marker([dispatch.destination.lat, dispatch.destination.lng], {
          icon: destinationIcon(L),
          opacity: isActive ? 1 : 0.65,
        })
        destMarker.bindPopup(`
          <strong>Teslimat Noktası</strong><br/>
          <span style="font-size:11px;color:#64748b">${dispatch.customerName || ''}</span><br/>
          <span style="font-size:11px;color:#64748b">${dispatch.address || ''}</span>
        `)
        destMarker.addTo(markerLayer)
        bounds.push([dispatch.destination.lat, dispatch.destination.lng])
      }

      if (isActive && Array.isArray(dispatch.routeGeometry) && dispatch.routeGeometry.length >= 2) {
        L.polyline(dispatch.routeGeometry, {
          color: typeMeta.color,
          weight: 5,
          opacity: 0.9,
          dashArray: '10 8',
        }).addTo(routeLayer)
      }
    })

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [52, 52], maxZoom: 14 })
    } else if (active?.livePosition) {
      map.setView([active.livePosition.lat, active.livePosition.lng], 13)
    }
  }, [hq, dispatches, activeDispatchId, showAllVehicles, onDispatchClick])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-dark-500/50 bg-dark-900 shadow-card ${className}`}>
      <div ref={containerRef} className="h-full min-h-[520px] w-full" />
      {!dispatches.length && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-dark-900/50">
          <p className="rounded-xl border border-dark-500/50 bg-dark-800/90 px-4 py-2 text-xs font-semibold text-gray-400">
            {emptyMessage}
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-dark-500/45 bg-dark-900/85 px-3 py-2 backdrop-blur-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Canlı Filo Haritası</p>
        <p className="mt-0.5 text-xs font-bold text-emerald-300">{dispatches.length} aktif gönderi</p>
      </div>
    </div>
  )
}
