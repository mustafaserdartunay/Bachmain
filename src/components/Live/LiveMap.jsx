import { useEffect, useRef } from 'react'
import { MAPBOX_STYLES } from '../../live/constants'
import { getStoredAppearance } from '../../utils/appearanceMode'

let mapboxPromise = null

function loadMapboxGl() {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl)
  if (mapboxPromise) return mapboxPromise
  mapboxPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-mapbox-css]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css'
      link.setAttribute('data-mapbox-css', 'true')
      document.head.appendChild(link)
    }
    const existing = document.querySelector('script[data-mapbox-js]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.mapboxgl))
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js'
    script.setAttribute('data-mapbox-js', 'true')
    script.onload = () => resolve(window.mapboxgl)
    script.onerror = reject
    document.body.appendChild(script)
  })
  return mapboxPromise
}

const KIND_COLOR = {
  personnel: '#38bdf8',
  driver: '#22c55e',
  vehicle: '#a78bfa',
  delivery: '#f59e0b',
  customer: '#f43f5e',
}

function toFeatureCollection(entities) {
  return {
    type: 'FeatureCollection',
    features: entities
      .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng))
      .map((row) => ({
        type: 'Feature',
        properties: {
          id: row.id,
          kind: row.kind,
          heading: Number(row.heading) || 0,
          pulse: row.status === 'active' || row.status === 'delivering' || row.status === 'on_task',
        },
        geometry: { type: 'Point', coordinates: [row.lng, row.lat] },
      })),
  }
}

export default function LiveMap({
  token,
  entities = [],
  geofences = [],
  routeGeometry = [],
  selectedId,
  satellite,
  onSelect,
  onReady,
}) {
  const rootRef = useRef(null)
  const mapRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Map instance is created once per token/style; entity updates go through sources.
  useEffect(() => {
    if (!token || !rootRef.current) return undefined
    let cancelled = false
    const appearance = getStoredAppearance()
    loadMapboxGl()
      .then((mapboxgl) => {
        if (cancelled || mapRef.current) return
        mapboxgl.accessToken = token
        const map = new mapboxgl.Map({
          container: rootRef.current,
          style: satellite
            ? MAPBOX_STYLES.satellite
            : MAPBOX_STYLES[appearance] || MAPBOX_STYLES.day,
          center: [29.04, 41.01],
          zoom: 11,
          attributionControl: true,
        })
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
        map.on('load', () => {
          map.addSource('live-entities', {
            type: 'geojson',
            data: toFeatureCollection(entities),
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 48,
          })
          map.addLayer({
            id: 'live-clusters',
            type: 'circle',
            source: 'live-entities',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#38bdf8',
              'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
              'circle-opacity': 0.85,
            },
          })
          map.addLayer({
            id: 'live-cluster-count',
            type: 'symbol',
            source: 'live-entities',
            filter: ['has', 'point_count'],
            layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
            paint: { 'text-color': '#0b1220' },
          })
          map.addLayer({
            id: 'live-points',
            type: 'circle',
            source: 'live-entities',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': [
                'match',
                ['get', 'kind'],
                'personnel',
                KIND_COLOR.personnel,
                'driver',
                KIND_COLOR.driver,
                'vehicle',
                KIND_COLOR.vehicle,
                'delivery',
                KIND_COLOR.delivery,
                KIND_COLOR.customer,
              ],
              'circle-radius': 7,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          })
          map.addSource('live-route', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
          })
          map.addLayer({
            id: 'live-route-line',
            type: 'line',
            source: 'live-route',
            paint: { 'line-color': '#38bdf8', 'line-width': 4, 'line-opacity': 0.85 },
          })
          map.addSource('live-geofences', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
          map.addLayer({
            id: 'live-geofence-fill',
            type: 'fill',
            source: 'live-geofences',
            paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.08 },
          })
          map.addLayer({
            id: 'live-geofence-line',
            type: 'line',
            source: 'live-geofences',
            paint: { 'line-color': '#22c55e', 'line-width': 2 },
          })
          map.on('click', 'live-points', (event) => {
            const id = event.features?.[0]?.properties?.id
            if (id) onSelectRef.current?.(id)
          })
          map.on('click', 'live-clusters', (event) => {
            const feature = event.features?.[0]
            const clusterId = feature?.properties?.cluster_id
            const source = map.getSource('live-entities')
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return
              map.easeTo({ center: feature.geometry.coordinates, zoom })
            })
          })
          mapRef.current = map
          onReady?.(map)
        })
      })
      .catch(() => {
        mapRef.current = null
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init-only
  }, [token, satellite])

  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource?.('live-entities')
    if (source) source.setData(toFeatureCollection(entities))
  }, [entities])

  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource?.('live-route')
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: routeGeometry || [] },
      })
    }
  }, [routeGeometry])

  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource?.('live-geofences')
    if (!source) return
    source.setData({
      type: 'FeatureCollection',
      features: (geofences || [])
        .filter((fence) => fence.shape === 'circle' && fence.center)
        .map((fence) => ({
          type: 'Feature',
          properties: { id: fence.id },
          geometry: {
            type: 'Polygon',
            coordinates: [circlePolygon(fence.center, fence.radiusMeters || 200)],
          },
        })),
    })
  }, [geofences])

  useEffect(() => {
    const selected = entities.find((row) => row.id === selectedId)
    if (!selected || !mapRef.current) return
    mapRef.current.easeTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(mapRef.current.getZoom(), 13),
    })
  }, [selectedId, entities])

  return <div ref={rootRef} className="live-ops__map" />
}

function circlePolygon(center, radiusMeters, steps = 64) {
  const coords = []
  const km = radiusMeters / 6371000
  const lat = (center.lat * Math.PI) / 180
  const lng = (center.lng * Math.PI) / 180
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * 2 * Math.PI
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(km) + Math.cos(lat) * Math.sin(km) * Math.cos(bearing),
    )
    const lng2 =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(km) * Math.cos(lat),
        Math.cos(km) - Math.sin(lat) * Math.sin(lat2),
      )
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
  }
  return coords
}

export function fitLiveEntities(map, entities) {
  if (!map || !entities?.length || !window.mapboxgl) return
  const bounds = new window.mapboxgl.LngLatBounds()
  entities.forEach((row) => bounds.extend([row.lng, row.lat]))
  map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 600 })
}
