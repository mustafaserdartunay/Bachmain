import { useEffect, useRef } from 'react'
import { getCustomerBranchDisplay, getCustomerDisplay } from '../../utils/customerDisplay'

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

function createMarkerIcon(L, color = '#2563eb', label = '') {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:9999px;
      background:${color};border:2px solid #fff;
      box-shadow:0 4px 14px rgba(15,23,42,.35);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:10px;font-weight:800;
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export default function FieldSalesMap({
  customers = [],
  routeGeometry = [],
  startPoint = null,
  activeCustomerId = null,
  onCustomerClick,
  className = '',
  emptyMessage = 'Haritada göstermek için müşteri seçin',
  markerColor = '#2563eb',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerGroupRef = useRef(null)
  const routeLayerRef = useRef(null)
  const startMarkerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([39.0, 35.0], 6)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      layerGroupRef.current = L.layerGroup().addTo(map)
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
    const group = layerGroupRef.current
    if (!map || !L || !group) return

    group.clearLayers()
    const bounds = []

    customers.forEach((customer, index) => {
      const coords = getCustomerCoordinates(customer)
      bounds.push([coords.lat, coords.lng])
      const isActive = customer.id === activeCustomerId
      const { branchName, companyName, city, address } = getCustomerBranchDisplay(customer)
      const marker = L.marker([coords.lat, coords.lng], {
        icon: createMarkerIcon(L, isActive ? '#ff4b5c' : markerColor, String(index + 1)),
      })
      marker.bindPopup(`
        <strong>${branchName}</strong><br/>
        <span style="font-size:12px">${companyName}</span><br/>
        ${city ? `<span style="font-size:11px;color:#64748b">${city}</span><br/>` : ''}
        ${address ? `<span style="font-size:11px;color:#64748b">${address}</span>` : ''}
      `)
      marker.on('click', () => onCustomerClick?.(customer))
      marker.addTo(group)
    })

    if (startPoint) {
      if (startMarkerRef.current) {
        map.removeLayer(startMarkerRef.current)
      }
      startMarkerRef.current = L.marker([startPoint.lat, startPoint.lng], {
        icon: createMarkerIcon(L, startPoint.source === 'live' ? '#3b82f6' : '#10b981', startPoint.source === 'live' ? 'C' : 'F'),
      }).addTo(map)
      startMarkerRef.current.bindPopup(
        startPoint.source === 'live' ? 'Canlı konumunuz' : `Firma adresi${startPoint.label ? `<br/><span style="font-size:11px;color:#64748b">${startPoint.label}</span>` : ''}`,
      )
      bounds.push([startPoint.lat, startPoint.lng])
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 })
    }
  }, [customers, activeCustomerId, startPoint, onCustomerClick, markerColor])

  useEffect(() => {
    const L = window.L
    const routeGroup = routeLayerRef.current
    if (!L || !routeGroup) return

    routeGroup.clearLayers()
    if (routeGeometry.length >= 2) {
      L.polyline(routeGeometry, {
        color: '#ff4b5c',
        weight: 4,
        opacity: 0.85,
        dashArray: '8 6',
      }).addTo(routeGroup)
    }
  }, [routeGeometry])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-dark-500/50 bg-dark-900 ${className}`}>
      <div ref={containerRef} className="h-full min-h-[420px] w-full" />
      {!customers.length && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-dark-900/40">
          <p className="rounded-xl border border-dark-500/50 bg-dark-800/90 px-4 py-2 text-xs font-semibold text-gray-400">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  )
}
