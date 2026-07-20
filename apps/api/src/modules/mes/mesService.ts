import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  mesBoms,
  mesEvents,
  mesMaintenance,
  mesOeeSamples,
  mesOperators,
  mesRoutings,
  mesScrap,
  mesShifts,
  mesWorkCenters,
} from '../../db/schema/index.js'
import { ingestEvent } from '../workflow/workflowService.js'

async function ensureSeed(companyId: string) {
  const existing = await db
    .select()
    .from(mesWorkCenters)
    .where(and(eq(mesWorkCenters.companyId, companyId), isNull(mesWorkCenters.deletedAt)))
    .limit(1)
  if (existing.length) return

  await db.insert(mesWorkCenters).values([
    {
      companyId,
      code: 'MC-01',
      name: 'Kesim Hattı 1',
      kind: 'machine',
      status: 'running',
      capacityPerHour: '120',
      oee: '78.5',
      energyKw: '14.2',
    },
    {
      companyId,
      code: 'MC-02',
      name: 'Baskı Makinesi A',
      kind: 'machine',
      status: 'idle',
      capacityPerHour: '80',
      oee: '71.0',
      energyKw: '9.4',
    },
    {
      companyId,
      code: 'WC-PACK',
      name: 'Paketleme Hücresi',
      kind: 'cell',
      status: 'running',
      capacityPerHour: '200',
      oee: '84.2',
      energyKw: '4.1',
    },
  ])

  await db.insert(mesOperators).values([
    { companyId, code: 'OP-01', name: 'Ayşe Yılmaz', status: 'busy', skills: ['kesim', 'kalite'] },
    {
      companyId,
      code: 'OP-02',
      name: 'Mehmet Demir',
      status: 'available',
      skills: ['baski', 'laminasyon'],
    },
  ])

  await db.insert(mesShifts).values([
    { companyId, name: 'Gündüz', startTime: '08:00', endTime: '16:00', active: true },
    { companyId, name: 'Akşam', startTime: '16:00', endTime: '00:00', active: true },
  ])
}

export async function overview(companyId: string) {
  await ensureSeed(companyId)
  const centers = await db
    .select()
    .from(mesWorkCenters)
    .where(and(eq(mesWorkCenters.companyId, companyId), isNull(mesWorkCenters.deletedAt)))
  const operators = await db
    .select()
    .from(mesOperators)
    .where(and(eq(mesOperators.companyId, companyId), isNull(mesOperators.deletedAt)))
  const [scrapCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mesScrap)
    .where(and(eq(mesScrap.companyId, companyId), isNull(mesScrap.deletedAt)))
  const [maintOpen] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mesMaintenance)
    .where(
      and(
        eq(mesMaintenance.companyId, companyId),
        eq(mesMaintenance.status, 'open'),
        isNull(mesMaintenance.deletedAt),
      ),
    )

  const running = centers.filter((c) => c.status === 'running').length
  const oeeAvg =
    centers.length === 0 ? 0 : centers.reduce((s, c) => s + Number(c.oee || 0), 0) / centers.length

  return {
    activeProduction: running,
    pendingWorkOrders: 7,
    machineUtilization: Math.round((running / Math.max(1, centers.length)) * 100),
    operatorsOnFloor: operators.filter((o) => o.status !== 'off').length,
    efficiency: Math.round(oeeAvg),
    scrapQty: scrapCount?.count ?? 0,
    qualityScore: 96,
    oee: Math.round(oeeAvg * 10) / 10,
    energyKw: centers.reduce((s, c) => s + Number(c.energyKw || 0), 0),
    maintenanceDue: maintOpen?.count ?? 0,
    completedOrders: 12,
    phase: 'MES-0',
    source: 'mes-0+seed',
  }
}

export async function listWorkCenters(companyId: string) {
  await ensureSeed(companyId)
  return db
    .select()
    .from(mesWorkCenters)
    .where(and(eq(mesWorkCenters.companyId, companyId), isNull(mesWorkCenters.deletedAt)))
}

export async function createWorkCenter(
  companyId: string,
  input: { code: string; name: string; kind?: string },
) {
  const [row] = await db
    .insert(mesWorkCenters)
    .values({
      companyId,
      code: input.code,
      name: input.name,
      kind: input.kind || 'machine',
      status: 'idle',
      oee: '70',
    })
    .returning()
  return row
}

export async function listOperators(companyId: string) {
  await ensureSeed(companyId)
  return db
    .select()
    .from(mesOperators)
    .where(and(eq(mesOperators.companyId, companyId), isNull(mesOperators.deletedAt)))
}

export async function createOperator(companyId: string, input: { code: string; name: string }) {
  const [row] = await db
    .insert(mesOperators)
    .values({ companyId, code: input.code, name: input.name, status: 'available' })
    .returning()
  return row
}

export async function listShifts(companyId: string) {
  await ensureSeed(companyId)
  return db
    .select()
    .from(mesShifts)
    .where(and(eq(mesShifts.companyId, companyId), isNull(mesShifts.deletedAt)))
}

export async function listBoms(companyId: string) {
  return db
    .select()
    .from(mesBoms)
    .where(and(eq(mesBoms.companyId, companyId), isNull(mesBoms.deletedAt)))
    .orderBy(desc(mesBoms.createdAt))
}

export async function createBom(
  companyId: string,
  input: { productId: string; name: string; lines?: Record<string, unknown>[] },
) {
  const [row] = await db
    .insert(mesBoms)
    .values({
      companyId,
      productId: input.productId,
      name: input.name,
      lines: input.lines || [],
      status: 'active',
    })
    .returning()
  await ingestEvent(companyId, 'trigger.mes.bom.created', { bomId: row.id })
  return row
}

export async function listRoutings(companyId: string) {
  return db
    .select()
    .from(mesRoutings)
    .where(and(eq(mesRoutings.companyId, companyId), isNull(mesRoutings.deletedAt)))
}

export async function createRouting(
  companyId: string,
  input: { productId: string; name: string; operations?: Record<string, unknown>[] },
) {
  const [row] = await db
    .insert(mesRoutings)
    .values({
      companyId,
      productId: input.productId,
      name: input.name,
      operations: input.operations || [
        { step: 1, name: 'Kesim', workCenterCode: 'MC-01', minutes: 15 },
        { step: 2, name: 'Montaj', workCenterCode: 'MC-02', minutes: 30 },
        { step: 3, name: 'Kalite Kontrol', workCenterCode: 'WC-PACK', minutes: 10 },
      ],
      status: 'active',
    })
    .returning()
  return row
}

export async function listEvents(companyId: string, productionJobId?: string) {
  if (productionJobId) {
    return db
      .select()
      .from(mesEvents)
      .where(
        and(
          eq(mesEvents.companyId, companyId),
          eq(mesEvents.productionJobId, productionJobId),
          isNull(mesEvents.deletedAt),
        ),
      )
      .orderBy(desc(mesEvents.createdAt))
      .limit(200)
  }
  return db
    .select()
    .from(mesEvents)
    .where(and(eq(mesEvents.companyId, companyId), isNull(mesEvents.deletedAt)))
    .orderBy(desc(mesEvents.createdAt))
    .limit(200)
}

export async function operatorAction(
  companyId: string,
  input: {
    action: string
    productionJobId?: string
    workCenterId?: string
    operatorId?: string
    qtyGood?: number
    qtyScrap?: number
    note?: string
  },
) {
  const [event] = await db
    .insert(mesEvents)
    .values({
      companyId,
      action: input.action,
      productionJobId: input.productionJobId,
      workCenterId: input.workCenterId || null,
      operatorId: input.operatorId || null,
      qtyGood: input.qtyGood || 0,
      qtyScrap: input.qtyScrap || 0,
      note: input.note,
      payload: { phase: 'MES-0' },
    })
    .returning()

  if (input.action === 'scrap' && (input.qtyScrap || 0) > 0) {
    await db.insert(mesScrap).values({
      companyId,
      productionJobId: input.productionJobId,
      workCenterId: input.workCenterId || null,
      operatorId: input.operatorId || null,
      qty: input.qtyScrap || 1,
      reason: input.note || 'operator_scrap',
    })
  }

  if (input.workCenterId && (input.action === 'start' || input.action === 'resume')) {
    await db
      .update(mesWorkCenters)
      .set({ status: 'running', updatedAt: new Date() })
      .where(eq(mesWorkCenters.id, input.workCenterId))
  }
  if (input.workCenterId && (input.action === 'pause' || input.action === 'finish')) {
    await db
      .update(mesWorkCenters)
      .set({ status: input.action === 'finish' ? 'idle' : 'idle', updatedAt: new Date() })
      .where(eq(mesWorkCenters.id, input.workCenterId))
  }

  const triggerMap: Record<string, string> = {
    start: 'trigger.production.started',
    finish: 'trigger.production.completed',
    scrap: 'trigger.mes.scrap.reported',
    qc_call: 'trigger.mes.quality.called',
  }
  const eventType = triggerMap[input.action] || 'trigger.mes.operator.action'
  await ingestEvent(companyId, eventType, {
    eventId: event.id,
    action: input.action,
    productionJobId: input.productionJobId,
  })
  await ingestEvent(companyId, 'trigger.mes.operator.action', {
    eventId: event.id,
    action: input.action,
  })

  return event
}

export async function listScrap(companyId: string) {
  return db
    .select()
    .from(mesScrap)
    .where(and(eq(mesScrap.companyId, companyId), isNull(mesScrap.deletedAt)))
    .orderBy(desc(mesScrap.createdAt))
}

export async function oeeSummary(companyId: string) {
  await ensureSeed(companyId)
  const centers = await listWorkCenters(companyId)
  const samples = centers.map((c) => {
    const availability = 88
    const performance = 82
    const quality = 96
    const oee = Math.round(((availability * performance * quality) / 10000) * 10) / 10
    return {
      workCenterId: c.id,
      code: c.code,
      name: c.name,
      availability,
      performance,
      quality,
      oee: Number(c.oee) || oee,
    }
  })

  for (const s of samples.slice(0, 3)) {
    await db.insert(mesOeeSamples).values({
      companyId,
      workCenterId: s.workCenterId,
      availability: String(s.availability),
      performance: String(s.performance),
      quality: String(s.quality),
      oee: String(s.oee),
    })
  }

  const avg = samples.length
    ? Math.round((samples.reduce((a, s) => a + s.oee, 0) / samples.length) * 10) / 10
    : 0
  return { averageOee: avg, samples, phase: 'MES-0' }
}

export async function listMaintenance(companyId: string) {
  await ensureSeed(companyId)
  const rows = await db
    .select()
    .from(mesMaintenance)
    .where(and(eq(mesMaintenance.companyId, companyId), isNull(mesMaintenance.deletedAt)))
  if (rows.length) return rows
  const centers = await listWorkCenters(companyId)
  if (!centers[0]) return []
  const [row] = await db
    .insert(mesMaintenance)
    .values({
      companyId,
      workCenterId: centers[0].id,
      kind: 'preventive',
      status: 'open',
      title: `${centers[0].name} periyodik yağlama`,
      dueAt: new Date(Date.now() + 3 * 86400000),
    })
    .returning()
  return [row]
}

export async function createMaintenance(
  companyId: string,
  input: { title: string; workCenterId?: string; kind?: string },
) {
  const [row] = await db
    .insert(mesMaintenance)
    .values({
      companyId,
      title: input.title,
      workCenterId: input.workCenterId || null,
      kind: input.kind || 'preventive',
      status: 'open',
    })
    .returning()
  await ingestEvent(companyId, 'trigger.mes.maintenance.opened', { maintenanceId: row.id })
  return row
}

export function aiInsights() {
  return {
    delayRisk: [{ jobRef: 'demo', riskPct: 34, reason: 'MC-02 yükü yüksek' }],
    scrapRisk: [{ productId: 'prd_demo', riskPct: 18, reason: 'Baskı renk sapması trendi' }],
    bottlenecks: [{ workCenter: 'MC-02', utilizationPct: 92 }],
    operatorInsights: [{ code: 'OP-01', throughputIndex: 1.12 }],
    materialAlerts: [{ sku: 'RAW-INK-01', daysLeft: 2 }],
    planSuggestion: 'Teslim tarihi için MC-01 vardiya uzatma önerilir',
    phase: 'MES-0-stub',
  }
}
