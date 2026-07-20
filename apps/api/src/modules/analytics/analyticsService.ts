import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  analyticsAlerts,
  analyticsDashboards,
  analyticsExports,
  analyticsForecasts,
  analyticsGoals,
  analyticsInsights,
  analyticsKpis,
  analyticsOkrs,
} from '../../db/schema/index.js'
import { ingestEvent } from '../workflow/workflowService.js'

const DEFAULT_LAYOUT = [
  { id: 'w1', type: 'kpi', code: 'sales_today', x: 0, y: 0, w: 3, h: 2 },
  { id: 'w2', type: 'kpi', code: 'orders_open', x: 3, y: 0, w: 3, h: 2 },
  { id: 'w3', type: 'kpi', code: 'cash', x: 6, y: 0, w: 3, h: 2 },
  { id: 'w4', type: 'kpi', code: 'oee', x: 9, y: 0, w: 3, h: 2 },
  { id: 'w5', type: 'chart', chart: 'line', code: 'sales_trend', x: 0, y: 2, w: 8, h: 4 },
  { id: 'w6', type: 'ai', code: 'insights', x: 8, y: 2, w: 4, h: 4 },
]

async function ensureSeed(companyId: string) {
  const [existing] = await db
    .select()
    .from(analyticsDashboards)
    .where(and(eq(analyticsDashboards.companyId, companyId), isNull(analyticsDashboards.deletedAt)))
    .limit(1)
  if (existing) return
  await db.insert(analyticsDashboards).values({
    companyId,
    name: 'Executive Dashboard',
    slug: 'executive',
    kind: 'executive',
    layout: DEFAULT_LAYOUT,
    isDefault: true,
  })
  const kpis = [
    { code: 'sales_today', label: 'Bugünkü Satış', source: 'orders', unit: 'TRY' },
    { code: 'sales_total', label: 'Toplam Satış', source: 'orders', unit: 'TRY' },
    { code: 'orders_open', label: 'Açık Sipariş', source: 'orders', unit: 'count' },
    { code: 'quotes_open', label: 'Açık Teklif', source: 'quotes', unit: 'count' },
    { code: 'cash', label: 'Nakit', source: 'treasury', unit: 'TRY' },
    { code: 'receivables', label: 'Tahsilat / Alacak', source: 'finance', unit: 'TRY' },
    { code: 'oee', label: 'OEE', source: 'mes', unit: 'pct' },
    { code: 'customers', label: 'Müşteri', source: 'crm', unit: 'count' },
  ]
  for (const k of kpis) {
    await db.insert(analyticsKpis).values({ companyId, ...k })
  }
}

export async function overview(companyId: string) {
  await ensureSeed(companyId)
  const [dash] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsDashboards)
    .where(and(eq(analyticsDashboards.companyId, companyId), isNull(analyticsDashboards.deletedAt)))
  const [kpis] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsKpis)
    .where(and(eq(analyticsKpis.companyId, companyId), isNull(analyticsKpis.deletedAt)))
  const [alerts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsAlerts)
    .where(
      and(
        eq(analyticsAlerts.companyId, companyId),
        eq(analyticsAlerts.active, true),
        isNull(analyticsAlerts.deletedAt),
      ),
    )

  return {
    phase: 'AP-0',
    dashboardCount: dash?.count ?? 0,
    kpiCount: kpis?.count ?? 0,
    activeAlerts: alerts?.count ?? 0,
    executive: {
      salesToday: 186400,
      salesTotal: 4250000,
      ordersOpen: 48,
      quotesOpen: 22,
      productionJobs: 31,
      warehouseCritical: 6,
      logisticsInTransit: 14,
      collectionsDue: 312000,
      payables: 198500,
      cash: 1678500,
      profitabilityPct: 18.4,
      scrapPct: 2.1,
      oeePct: 76,
      personnelActive: 84,
      customers: 412,
      dealers: 28,
      activeUsers: 19,
    },
    currency: 'TRY',
    source: 'ap-0-demo+domain-deep-links',
    links: {
      home: '/',
      finance: '/finans',
      mes: '/mes',
      cxc: '/musteri-deneyimi',
      salesReport: '/musteriler/satis-raporu',
      cashFlow: '/nakit/nakit-akisi-raporu',
    },
  }
}

export async function listDashboards(companyId: string) {
  await ensureSeed(companyId)
  return db
    .select()
    .from(analyticsDashboards)
    .where(and(eq(analyticsDashboards.companyId, companyId), isNull(analyticsDashboards.deletedAt)))
    .orderBy(desc(analyticsDashboards.updatedAt))
}

export async function createDashboard(
  companyId: string,
  input: { name: string; slug: string; kind?: string; layout?: unknown[] },
) {
  const [row] = await db
    .insert(analyticsDashboards)
    .values({
      companyId,
      name: input.name,
      slug: input.slug,
      kind: input.kind || 'custom',
      layout: input.layout || DEFAULT_LAYOUT,
    })
    .returning()
  await ingestEvent(companyId, 'trigger.analytics.dashboard.created', { dashboardId: row.id })
  return row
}

export async function updateLayout(companyId: string, id: string, layout: unknown[]) {
  const [row] = await db
    .update(analyticsDashboards)
    .set({ layout, updatedAt: new Date() })
    .where(
      and(
        eq(analyticsDashboards.id, id),
        eq(analyticsDashboards.companyId, companyId),
        isNull(analyticsDashboards.deletedAt),
      ),
    )
    .returning()
  if (row) {
    await ingestEvent(companyId, 'trigger.analytics.dashboard.layout_saved', { dashboardId: id })
  }
  return row
}

export async function listKpis(companyId: string) {
  await ensureSeed(companyId)
  return db
    .select()
    .from(analyticsKpis)
    .where(and(eq(analyticsKpis.companyId, companyId), isNull(analyticsKpis.deletedAt)))
}

export async function createKpi(
  companyId: string,
  input: { code: string; label: string; source?: string; unit?: string; target?: number },
) {
  const [row] = await db
    .insert(analyticsKpis)
    .values({
      companyId,
      code: input.code,
      label: input.label,
      source: input.source || 'custom',
      unit: input.unit || 'number',
      target: input.target != null ? String(input.target) : null,
    })
    .returning()
  return row
}

export async function listAlerts(companyId: string) {
  return db
    .select()
    .from(analyticsAlerts)
    .where(and(eq(analyticsAlerts.companyId, companyId), isNull(analyticsAlerts.deletedAt)))
}

export async function createAlert(
  companyId: string,
  input: {
    name: string
    kpiCode?: string
    operator?: string
    threshold?: number
    channels?: unknown[]
  },
) {
  const [row] = await db
    .insert(analyticsAlerts)
    .values({
      companyId,
      name: input.name,
      kpiCode: input.kpiCode,
      operator: input.operator || 'gt',
      threshold: input.threshold != null ? String(input.threshold) : null,
      channels: input.channels || ['dashboard'],
      active: true,
    })
    .returning()
  await ingestEvent(companyId, 'trigger.analytics.alert.created', { alertId: row.id })
  return row
}

export async function listGoals(companyId: string) {
  return db
    .select()
    .from(analyticsGoals)
    .where(and(eq(analyticsGoals.companyId, companyId), isNull(analyticsGoals.deletedAt)))
}

export async function createGoal(
  companyId: string,
  input: {
    title: string
    scope?: string
    targetValue?: number
    actualValue?: number
    period?: string
  },
) {
  const [row] = await db
    .insert(analyticsGoals)
    .values({
      companyId,
      title: input.title,
      scope: input.scope || 'company',
      targetValue: input.targetValue != null ? String(input.targetValue) : null,
      actualValue: input.actualValue != null ? String(input.actualValue) : null,
      period: input.period,
    })
    .returning()
  return row
}

export async function listOkrs(companyId: string) {
  return db
    .select()
    .from(analyticsOkrs)
    .where(and(eq(analyticsOkrs.companyId, companyId), isNull(analyticsOkrs.deletedAt)))
}

export async function createOkr(
  companyId: string,
  input: { objective: string; scope?: string; keyResults?: unknown[]; progressPct?: number },
) {
  const [row] = await db
    .insert(analyticsOkrs)
    .values({
      companyId,
      objective: input.objective,
      scope: input.scope || 'company',
      keyResults: input.keyResults || [],
      progressPct: input.progressPct ?? 0,
    })
    .returning()
  return row
}

export async function insights(companyId: string) {
  const rows = await db
    .select()
    .from(analyticsInsights)
    .where(and(eq(analyticsInsights.companyId, companyId), isNull(analyticsInsights.deletedAt)))
    .orderBy(desc(analyticsInsights.createdAt))
    .limit(20)
  if (rows.length) return rows
  return [
    {
      id: 'demo-1',
      headline: 'Bu ay üretim %12 düştü.',
      severity: 'warning',
      domain: 'mes',
    },
    {
      id: 'demo-2',
      headline: 'Teslimat gecikmesi arttı.',
      severity: 'warning',
      domain: 'logistics',
    },
    {
      id: 'demo-3',
      headline: 'Fire artıyor.',
      severity: 'critical',
      domain: 'mes',
    },
    {
      id: 'demo-4',
      headline: 'X müşterisi kaybedilebilir.',
      severity: 'warning',
      domain: 'cxc',
    },
    {
      id: 'demo-5',
      headline: 'Depoda kritik stok var.',
      severity: 'critical',
      domain: 'wms',
    },
  ]
}

export async function forecasts(companyId: string) {
  const rows = await db
    .select()
    .from(analyticsForecasts)
    .where(and(eq(analyticsForecasts.companyId, companyId), isNull(analyticsForecasts.deletedAt)))
  if (rows.length) return rows
  return [
    { kind: 'sales', horizon: '30d', value: '820000', unit: 'TRY' },
    { kind: 'cash', horizon: '30d', value: '260000', unit: 'TRY' },
    { kind: 'production', horizon: '14d', value: '118', unit: 'jobs' },
    { kind: 'orders', horizon: '30d', value: '64', unit: 'count' },
    { kind: 'stock', horizon: '14d', value: '12', unit: 'critical_skus' },
    { kind: 'collections', horizon: '7d', value: '186000', unit: 'TRY' },
    { kind: 'fx_risk', horizon: '30d', value: '22', unit: 'pct' },
  ]
}

export async function createExport(companyId: string, input: { format?: string; source?: string }) {
  const [row] = await db
    .insert(analyticsExports)
    .values({
      companyId,
      format: input.format || 'csv',
      source: input.source || 'overview',
      status: 'queued',
    })
    .returning()
  await ingestEvent(companyId, 'trigger.analytics.export.queued', { exportId: row.id })
  return row
}

export function boardReport() {
  return {
    title: 'Yönetim Kurulu Özeti',
    period: 'Haftalık',
    sections: [
      { id: 'risks', title: 'Riskler', items: ['Tahsilat gecikmesi', 'OEE düşüşü'] },
      {
        id: 'opportunities',
        title: 'Fırsatlar',
        items: ['Q3 export pipeline', 'VIP müşteri upsell'],
      },
      { id: 'sales', title: 'Satış', items: ['+8% WoW', 'Teklif dönüşüm %24'] },
      { id: 'production', title: 'Üretim', items: ['OEE %76', 'Fire %2.1'] },
      { id: 'finance', title: 'Finans', items: ['Nakit pozitif', 'Alacak yaşlandırma'] },
      { id: 'logistics', title: 'Lojistik', items: ['On-time %91'] },
      { id: 'hr', title: 'İK', items: ['Devam %96'] },
      {
        id: 'actions',
        title: 'Önerilen aksiyonlar',
        items: ['Kritik stok PO', 'Riskli müşteri ara'],
      },
    ],
    formats: ['pdf', 'pptx'],
    phase: 'AP-0-stub',
  }
}
