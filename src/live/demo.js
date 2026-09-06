import { ISTANBUL, OFFLINE_AFTER_MS } from './constants.js'

const TICK_MS = 4000

function lerp(a, b, t) {
  return a + (b - a) * t
}

function pointOnSegment(from, to, t) {
  return {
    lat: lerp(from.lat, to.lat, t),
    lng: lerp(from.lng, to.lng, t),
    heading: Math.atan2(to.lng - from.lng, to.lat - from.lat) * (180 / Math.PI),
  }
}

function personnelPath(index) {
  const hubs = [
    ISTANBUL.depo,
    ISTANBUL.kadikoy,
    ISTANBUL.uskudar,
    ISTANBUL.atasehir,
    ISTANBUL.maltepe,
  ]
  return [
    hubs[index % hubs.length],
    hubs[(index + 1) % hubs.length],
    hubs[(index + 2) % hubs.length],
  ]
}

export function buildDemoEntities(now = Date.now()) {
  const people = [
    { id: 'demo-p-1', name: 'Mehmet Yılmaz', role: 'Saha Personeli' },
    { id: 'demo-p-2', name: 'Ayşe Demir', role: 'Saha Personeli' },
    { id: 'demo-p-3', name: 'Can Kaya', role: 'Saha Personeli' },
    { id: 'demo-p-4', name: 'Elif Aksoy', role: 'Saha Personeli' },
    { id: 'demo-p-5', name: 'Burak Şahin', role: 'Saha Personeli' },
  ]
  const drivers = [
    { id: 'demo-d-1', name: 'Hakan Öztürk', plate: '34 ABC 123', kind: 'kamyonet' },
    { id: 'demo-d-2', name: 'Selin Arslan', plate: '34 EFG 456', kind: 'kamyon' },
    { id: 'demo-d-3', name: 'Murat Çelik', plate: '34 HIJ 789', kind: 'panelvan' },
  ]
  const vehicles = drivers.map((driver) => ({
    id: `demo-v-${driver.id.slice(-1)}`,
    plate: driver.plate,
    kind: driver.kind,
    driverId: driver.id,
    driverName: driver.name,
  }))

  const deliveries = [
    { id: 'demo-dl-1', title: 'ABC Gıda teslimatı', stop: ISTANBUL.kadikoy, delayed: false },
    { id: 'demo-dl-2', title: 'Ataşehir depo aktarma', stop: ISTANBUL.atasehir, delayed: true },
    { id: 'demo-dl-3', title: 'Üsküdar şube', stop: ISTANBUL.uskudar, delayed: false },
    { id: 'demo-dl-4', title: 'Maltepe müşteri', stop: ISTANBUL.maltepe, delayed: false },
    { id: 'demo-dl-5', title: 'Kadıköy ekspres', stop: ISTANBUL.kadikoy, delayed: false },
    { id: 'demo-dl-6', title: 'Üsküdar soğuk zincir', stop: ISTANBUL.uskudar, delayed: false },
    { id: 'demo-dl-7', title: 'Ataşehir VIP', stop: ISTANBUL.atasehir, delayed: false },
    { id: 'demo-dl-8', title: 'Maltepe iade', stop: ISTANBUL.maltepe, delayed: false },
    { id: 'demo-dl-9', title: 'Kadıköy 2. durak', stop: ISTANBUL.kadikoy, delayed: false },
    { id: 'demo-dl-10', title: 'Depo dönüş', stop: ISTANBUL.depo, delayed: false },
  ]

  const t = (now % (TICK_MS * 40)) / (TICK_MS * 40)

  const personnelEntities = people.map((person, index) => {
    const path = personnelPath(index)
    const seg = Math.floor(t * (path.length - 1))
    const localT = t * (path.length - 1) - seg
    const pos = pointOnSegment(path[seg], path[seg + 1] || path[seg], localT)
    const offline = index === 4
    return {
      id: person.id,
      kind: 'personnel',
      name: person.name,
      subtitle: person.role,
      status: offline ? 'offline' : index === 1 ? 'on_task' : 'active',
      lat: pos.lat,
      lng: pos.lng,
      heading: pos.heading,
      speed: offline ? 0 : 4 + index,
      updatedAt: new Date(offline ? now - OFFLINE_AFTER_MS - 20000 : now).toISOString(),
      task: index === 1 ? 'Müşteri ziyareti' : 'Saha turu',
      nextStop: path[(seg + 1) % path.length].label,
      demo: true,
    }
  })

  const driverEntities = drivers.map((driver, index) => {
    const path = [ISTANBUL.depo, ISTANBUL.atasehir, ISTANBUL.maltepe, ISTANBUL.kadikoy]
    const offRoute = index === 0
    const localT = (t + index * 0.2) % 1
    const pos = pointOnSegment(path[0], offRoute ? ISTANBUL.uskudar : path[1], localT)
    return {
      id: driver.id,
      kind: 'driver',
      name: driver.name,
      subtitle: driver.plate,
      plate: driver.plate,
      vehicleKind: driver.kind,
      status: index === 2 ? 'offline' : 'delivering',
      lat: pos.lat,
      lng: pos.lng,
      heading: pos.heading,
      speed: index === 2 ? 0 : 12,
      updatedAt: new Date(index === 2 ? now - OFFLINE_AFTER_MS - 5000 : now).toISOString(),
      task: deliveries[index]?.title,
      nextStop: path[1].label,
      offRoute,
      delayed: index === 1,
      demo: true,
    }
  })

  const vehicleEntities = vehicles.map((vehicle, index) => ({
    id: vehicle.id,
    kind: 'vehicle',
    name: vehicle.plate,
    subtitle: driverEntities[index]?.name,
    plate: vehicle.plate,
    vehicleKind: vehicle.kind,
    driverId: vehicle.driverId,
    status: driverEntities[index]?.status === 'offline' ? 'offline' : 'active',
    lat: driverEntities[index]?.lat,
    lng: driverEntities[index]?.lng,
    heading: driverEntities[index]?.heading,
    speed: driverEntities[index]?.speed,
    updatedAt: driverEntities[index]?.updatedAt,
    demo: true,
  }))

  const deliveryEntities = deliveries.map((item) => ({
    id: item.id,
    kind: 'delivery',
    name: item.title,
    subtitle: item.stop.label,
    status: item.delayed ? 'delayed' : 'on_task',
    lat: item.stop.lat,
    lng: item.stop.lng,
    delayed: item.delayed,
    demo: true,
    updatedAt: new Date(now).toISOString(),
  }))

  return [...personnelEntities, ...driverEntities, ...vehicleEntities, ...deliveryEntities]
}

export function demoGeofences() {
  return [
    {
      id: 'demo-gf-depo',
      name: 'Merkez Depo',
      kind: 'depo',
      shape: 'circle',
      center: { lat: ISTANBUL.depo.lat, lng: ISTANBUL.depo.lng },
      radiusMeters: 250,
      demo: true,
    },
  ]
}
