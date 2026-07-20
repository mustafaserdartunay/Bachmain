const KEY = 'bach_mes_0_v1'
const EVT = 'bach:mes-updated'

function blank() {
  return {
    workCenters: [
      {
        id: 'wc1',
        code: 'MC-01',
        name: 'Kesim Hattı 1',
        status: 'running',
        oee: 78.5,
        energyKw: 14.2,
      },
      {
        id: 'wc2',
        code: 'MC-02',
        name: 'Baskı Makinesi A',
        status: 'idle',
        oee: 71,
        energyKw: 9.4,
      },
      {
        id: 'wc3',
        code: 'WC-PACK',
        name: 'Paketleme Hücresi',
        status: 'running',
        oee: 84.2,
        energyKw: 4.1,
      },
    ],
    operators: [
      { id: 'op1', code: 'OP-01', name: 'Ayşe Yılmaz', status: 'busy' },
      { id: 'op2', code: 'OP-02', name: 'Mehmet Demir', status: 'available' },
    ],
    shifts: [
      { id: 'sh1', name: 'Gündüz', startTime: '08:00', endTime: '16:00' },
      { id: 'sh2', name: 'Akşam', startTime: '16:00', endTime: '00:00' },
    ],
    boms: [],
    routings: [],
    events: [],
    scrap: [],
    maintenance: [
      { id: 'mt1', title: 'MC-01 periyodik yağlama', status: 'open', kind: 'preventive' },
    ],
  }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    return { ...blank(), ...JSON.parse(raw) }
  } catch {
    return blank()
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT))
  return state
}

export function ensureMesSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function mesOverviewLocal(jobStats = {}) {
  const s = read()
  const running = s.workCenters.filter((c) => c.status === 'running').length
  const oee =
    s.workCenters.reduce((a, c) => a + Number(c.oee || 0), 0) / Math.max(1, s.workCenters.length)
  return {
    activeProduction: jobStats.active ?? running,
    pendingWorkOrders: jobStats.pending ?? 0,
    machineUtilization: Math.round((running / Math.max(1, s.workCenters.length)) * 100),
    operatorsOnFloor: s.operators.filter((o) => o.status !== 'off').length,
    efficiency: Math.round(oee),
    scrapQty: s.scrap.reduce((a, x) => a + (x.qty || 0), 0),
    qualityScore: 96,
    oee: Math.round(oee * 10) / 10,
    energyKw: s.workCenters.reduce((a, c) => a + Number(c.energyKw || 0), 0),
    maintenanceDue: s.maintenance.filter((m) => m.status === 'open').length,
    completedOrders: jobStats.completed ?? 0,
  }
}

export function listWorkCentersLocal() {
  return read().workCenters
}

export function listOperatorsLocal() {
  return read().operators
}

export function listShiftsLocal() {
  return read().shifts
}

export function listBomsLocal() {
  return read().boms
}

export function addBomLocal(name, productId) {
  const s = read()
  const row = {
    id: `bom_${Date.now().toString(36)}`,
    name,
    productId,
    lines: [{ sku: 'RAW-01', qty: 1 }],
  }
  s.boms.unshift(row)
  write(s)
  return row
}

export function listRoutingsLocal() {
  return read().routings
}

export function addRoutingLocal(name, productId) {
  const s = read()
  const row = {
    id: `rt_${Date.now().toString(36)}`,
    name,
    productId,
    operations: [
      { step: 1, name: 'Kesim' },
      { step: 2, name: 'Montaj' },
      { step: 3, name: 'Kalite Kontrol' },
    ],
  }
  s.routings.unshift(row)
  write(s)
  return row
}

export function listEventsLocal() {
  return read().events
}

export function operatorActionLocal(action, extras = {}) {
  const s = read()
  const event = {
    id: `ev_${Date.now().toString(36)}`,
    action,
    at: new Date().toISOString(),
    ...extras,
  }
  s.events.unshift(event)
  if (action === 'scrap') {
    s.scrap.unshift({
      id: `sc_${Date.now().toString(36)}`,
      qty: extras.qtyScrap || 1,
      reason: extras.note || 'fire',
      productionJobId: extras.productionJobId,
    })
  }
  if (extras.workCenterId && (action === 'start' || action === 'resume')) {
    const i = s.workCenters.findIndex((c) => c.id === extras.workCenterId)
    if (i >= 0) s.workCenters[i] = { ...s.workCenters[i], status: 'running' }
  }
  if (extras.workCenterId && (action === 'pause' || action === 'finish')) {
    const i = s.workCenters.findIndex((c) => c.id === extras.workCenterId)
    if (i >= 0) s.workCenters[i] = { ...s.workCenters[i], status: 'idle' }
  }
  write(s)
  return event
}

export function listScrapLocal() {
  return read().scrap
}

export function listMaintenanceLocal() {
  return read().maintenance
}

export function aiInsightsLocal() {
  return {
    delayRisk: [{ jobRef: 'aktif iş', riskPct: 34, reason: 'MC-02 yükü yüksek' }],
    scrapRisk: [{ productId: '—', riskPct: 18, reason: 'Baskı renk sapması' }],
    bottlenecks: [{ workCenter: 'MC-02', utilizationPct: 92 }],
    planSuggestion: 'Teslim için MC-01 vardiya uzatma önerilir',
  }
}

export { EVT as MES_UPDATED_EVENT }
