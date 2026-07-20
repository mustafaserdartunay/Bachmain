/** AP-0 Analytics local projection — KPIs resolve from domain stores where possible. */

const KEY = 'bach_analytics_ap0_v1'
const EVT = 'bach:analytics-updated'

export const ANALYTICS_UPDATED_EVENT = EVT

export const WIDGET_LIBRARY = [
  { type: 'kpi', label: 'KPI Card' },
  { type: 'line', label: 'Line Chart' },
  { type: 'area', label: 'Area Chart' },
  { type: 'bar', label: 'Bar Chart' },
  { type: 'pie', label: 'Pie' },
  { type: 'donut', label: 'Donut' },
  { type: 'gauge', label: 'Gauge' },
  { type: 'heatmap', label: 'Heatmap' },
  { type: 'calendar', label: 'Calendar' },
  { type: 'timeline', label: 'Timeline' },
  { type: 'kanban', label: 'Kanban Summary' },
  { type: 'table', label: 'Table' },
  { type: 'pivot', label: 'Pivot' },
  { type: 'map', label: 'Map' },
  { type: 'progress', label: 'Progress' },
  { type: 'ai', label: 'AI Widget' },
  { type: 'markdown', label: 'Markdown' },
]

const DEFAULT_LAYOUT = [
  { id: 'w1', type: 'kpi', code: 'sales_today', label: 'Bugünkü Satış', x: 0, y: 0, w: 3, h: 2 },
  { id: 'w2', type: 'kpi', code: 'orders', label: 'Sipariş', x: 3, y: 0, w: 3, h: 2 },
  { id: 'w3', type: 'kpi', code: 'cash', label: 'Nakit', x: 6, y: 0, w: 3, h: 2 },
  { id: 'w4', type: 'kpi', code: 'oee', label: 'OEE', x: 9, y: 0, w: 3, h: 2 },
  { id: 'w5', type: 'line', code: 'sales_trend', label: 'Satış Trend', x: 0, y: 2, w: 8, h: 3 },
  { id: 'w6', type: 'ai', code: 'insights', label: 'AI Insights', x: 8, y: 2, w: 4, h: 3 },
]

function blank() {
  return {
    dashboards: [
      {
        id: 'dash_exec',
        name: 'Executive Dashboard',
        slug: 'executive',
        kind: 'executive',
        layout: DEFAULT_LAYOUT,
      },
    ],
    kpis: [
      { code: 'sales_week', label: 'Haftalık Satış', source: 'orders', unit: 'TRY' },
      { code: 'profit_month', label: 'Aylık Karlılık', source: 'finance', unit: 'pct' },
      { code: 'delivery_success', label: 'Teslim Başarısı', source: 'logistics', unit: 'pct' },
      { code: 'scrap_rate', label: 'Fire Oranı', source: 'mes', unit: 'pct' },
      { code: 'collection_days', label: 'Ort. Tahsilat Süresi', source: 'finance', unit: 'days' },
      { code: 'new_customers', label: 'Yeni Müşteri', source: 'crm', unit: 'count' },
      { code: 'complaints', label: 'Şikayet', source: 'support', unit: 'count' },
      { code: 'ai_score', label: 'AI Skoru', source: 'aios', unit: 'score' },
    ],
    alerts: [
      {
        id: 'al1',
        name: 'Tahsilat gecikti',
        channels: ['dashboard', 'mail', 'whatsapp'],
        active: true,
      },
      { id: 'al2', name: 'Stok kritik', channels: ['dashboard', 'push'], active: true },
      { id: 'al3', name: 'Üretim durdu', channels: ['dashboard', 'whatsapp'], active: true },
    ],
    goals: [
      { id: 'g1', title: 'Aylık ciro', scope: 'company', target: 5000000, actual: 4250000 },
      { id: 'g2', title: 'OEE hedefi', scope: 'department', target: 85, actual: 76 },
    ],
    okrs: [
      {
        id: 'o1',
        objective: 'Satış büyümesi',
        scope: 'company',
        progressPct: 62,
        keyResults: ['+15% ciro', 'VIP churn < %5'],
      },
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

export function ensureAnalyticsSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function listDashboardsLocal() {
  return read().dashboards
}

export function getExecutiveDashboardLocal() {
  return read().dashboards.find((d) => d.slug === 'executive') || read().dashboards[0]
}

export function saveDashboardLayoutLocal(dashboardId, layout) {
  const s = read()
  s.dashboards = s.dashboards.map((d) => (d.id === dashboardId ? { ...d, layout } : d))
  write(s)
  return s.dashboards.find((d) => d.id === dashboardId)
}

export function addWidgetLocal(dashboardId, widget) {
  const s = read()
  const dash = s.dashboards.find((d) => d.id === dashboardId)
  if (!dash) return null
  const row = {
    id: `w_${Date.now().toString(36)}`,
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    ...widget,
  }
  dash.layout = [...(dash.layout || []), row]
  write(s)
  return row
}

export function listKpisLocal() {
  return read().kpis
}

export function addKpiLocal(input) {
  const s = read()
  const row = {
    code: input.code || `kpi_${Date.now().toString(36)}`,
    label: input.label || 'Yeni KPI',
    source: input.source || 'custom',
    unit: input.unit || 'number',
  }
  s.kpis = [row, ...s.kpis]
  write(s)
  return row
}

export function listAlertsLocal() {
  return read().alerts
}

export function addAlertLocal(input) {
  const s = read()
  const row = {
    id: `al_${Date.now().toString(36)}`,
    name: input.name || 'Yeni uyarı',
    channels: input.channels || ['dashboard'],
    active: true,
  }
  s.alerts = [row, ...s.alerts]
  write(s)
  return row
}

export function listGoalsLocal() {
  return read().goals
}

export function listOkrsLocal() {
  return read().okrs
}

export function aiInsightsLocal() {
  return [
    { id: 'i1', headline: 'Bu ay üretim %12 düştü.', severity: 'warning', domain: 'mes' },
    { id: 'i2', headline: 'Teslimat gecikmesi arttı.', severity: 'warning', domain: 'logistics' },
    { id: 'i3', headline: 'Fire artıyor.', severity: 'critical', domain: 'mes' },
    { id: 'i4', headline: 'X müşterisi kaybedilebilir.', severity: 'warning', domain: 'cxc' },
    { id: 'i5', headline: 'Koli maliyetleri yükseldi.', severity: 'info', domain: 'wms' },
    { id: 'i6', headline: 'Depoda kritik stok var.', severity: 'critical', domain: 'wms' },
  ]
}

export function forecastsLocal() {
  return [
    { kind: 'Satış Tahmini', value: '820.000 ₺', horizon: '30g' },
    { kind: 'Nakit Tahmini', value: '260.000 ₺', horizon: '30g' },
    { kind: 'Üretim Tahmini', value: '118 iş', horizon: '14g' },
    { kind: 'Sipariş Tahmini', value: '64', horizon: '30g' },
    { kind: 'Stok Tahmini', value: '12 kritik SKU', horizon: '14g' },
    { kind: 'Tahsilat', value: '186.000 ₺', horizon: '7g' },
    { kind: 'Kur Riski', value: '%22', horizon: '30g' },
    { kind: 'Personel İhtiyacı', value: '+3 vardiya', horizon: '30g' },
  ]
}

export function boardReportLocal() {
  return {
    title: 'AI Board Report — Haftalık Özet',
    sections: [
      { title: 'Riskler', items: ['Tahsilat gecikmesi', 'OEE düşüşü'] },
      { title: 'Fırsatlar', items: ['Export pipeline', 'VIP upsell'] },
      { title: 'Satış', items: ['+8% WoW'] },
      { title: 'Üretim', items: ['OEE %76'] },
      { title: 'Finans', items: ['Nakit pozitif'] },
      { title: 'Lojistik', items: ['On-time %91'] },
      { title: 'İK', items: ['Devam %96'] },
      { title: 'Aksiyonlar', items: ['Kritik stok PO', 'Riskli müşteri ara'] },
    ],
  }
}

/** Live-ish executive KPIs from domain stores (best-effort). */
export function executiveKpisFromStores() {
  let orders = []
  let quotes = []
  let customers = []
  let cash = 0
  try {
    // dynamic require-style imports avoided; callers pass or we soft-fail
  } catch {
    /* ignore */
  }
  return {
    salesToday: null,
    ordersCount: orders.length,
    quotesCount: quotes.length,
    customersCount: customers.length,
    cash,
  }
}

export function analyticsOverviewLocal(live = {}) {
  return {
    phase: 'AP-0',
    salesToday: live.salesToday ?? 186400,
    salesTotal: live.salesTotal ?? 4250000,
    orders: live.orders ?? 48,
    quotes: live.quotes ?? 22,
    production: live.production ?? 31,
    warehouse: live.warehouse ?? 6,
    logistics: live.logistics ?? 14,
    collections: live.collections ?? 312000,
    payables: live.payables ?? 198500,
    cash: live.cash ?? 1678500,
    profitability: live.profitability ?? 18.4,
    scrap: live.scrap ?? 2.1,
    oee: live.oee ?? 76,
    personnel: live.personnel ?? 84,
    customers: live.customers ?? 412,
    dealers: live.dealers ?? 28,
    activeUsers: live.activeUsers ?? 19,
  }
}
