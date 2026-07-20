import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { twinPreferences, twinSnapshots } from '../../db/schema/index.js'
import {
  buildFactoryState,
  buildFlowState,
  buildOverviewKpis,
  buildWarehouseState,
  VEHICLE_TYPES,
} from './demoState.js'

export async function getPreferences(companyId: string) {
  const [row] = await db
    .select()
    .from(twinPreferences)
    .where(eq(twinPreferences.companyId, companyId))
    .limit(1)
  if (row) return row
  const [created] = await db
    .insert(twinPreferences)
    .values({
      companyId,
      enable3d: false,
      defaultView: 'factory',
      layout: {},
    })
    .returning()
  return created
}

export async function patchPreferences(
  companyId: string,
  patch: { enable3d?: boolean; defaultView?: string; layout?: Record<string, unknown> },
) {
  const current = await getPreferences(companyId)
  const [row] = await db
    .update(twinPreferences)
    .set({
      enable3d: patch.enable3d ?? current.enable3d,
      defaultView: patch.defaultView ?? current.defaultView,
      layout: patch.layout ?? current.layout,
      updatedAt: new Date(),
    })
    .where(eq(twinPreferences.id, current.id))
    .returning()
  return row
}

export async function overview(companyId: string) {
  const prefs = await getPreferences(companyId)
  const kpis = buildOverviewKpis()
  await db.insert(twinSnapshots).values({
    companyId,
    kind: 'overview',
    payload: kpis as unknown as Record<string, unknown>,
  })
  return {
    ...kpis,
    preferences: prefs,
    vehicleTypes: VEHICLE_TYPES,
    sampledAt: new Date().toISOString(),
    source: 'dt-0-demo-adapters',
  }
}

export function factory() {
  return buildFactoryState()
}

export function warehouse() {
  return buildWarehouseState()
}

export function flow() {
  return buildFlowState()
}
