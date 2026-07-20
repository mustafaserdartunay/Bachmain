import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  workflowEvents,
  workflowRuns,
  workflowRunSteps,
  workflows,
  workflowVersions,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { NODE_CATALOG, NODE_CATEGORIES, WORKFLOW_TEMPLATES } from './catalog.js'

export type GraphJson = { nodes: unknown[]; edges: unknown[] }

function extractTriggerTypes(graph: GraphJson): string[] {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : []
  const types = new Set<string>()
  for (const raw of nodes) {
    const n = raw as { data?: { catalogId?: string; category?: string } }
    const id = n?.data?.catalogId
    if (id && (n.data?.category === 'trigger' || String(id).startsWith('trigger.'))) {
      types.add(id)
    }
  }
  return [...types]
}

export function getCatalog() {
  return { categories: NODE_CATEGORIES, nodes: NODE_CATALOG, templates: WORKFLOW_TEMPLATES }
}

export async function listWorkflows(companyId: string) {
  return db
    .select()
    .from(workflows)
    .where(and(eq(workflows.companyId, companyId), isNull(workflows.deletedAt)))
    .orderBy(desc(workflows.updatedAt))
}

export async function getWorkflow(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(workflows)
    .where(
      and(eq(workflows.id, id), eq(workflows.companyId, companyId), isNull(workflows.deletedAt)),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Workflow bulunamadı', 404)
  const versions = await db
    .select()
    .from(workflowVersions)
    .where(and(eq(workflowVersions.workflowId, id), eq(workflowVersions.companyId, companyId)))
    .orderBy(desc(workflowVersions.version))
  return { workflow: row, versions }
}

export async function createWorkflow(input: {
  companyId: string
  name: string
  description?: string
  graph?: GraphJson
  userId?: string
  branchId?: string | null
  warehouseId?: string | null
  roleCodes?: string[]
  packageCodes?: string[]
}) {
  const graph = input.graph || { nodes: [], edges: [] }
  const [row] = await db
    .insert(workflows)
    .values({
      companyId: input.companyId,
      name: input.name,
      description: input.description || null,
      status: 'draft',
      publishedVersion: null,
      branchId: input.branchId || null,
      warehouseId: input.warehouseId || null,
      roleCodes: input.roleCodes || [],
      packageCodes: input.packageCodes || [],
      triggerTypes: extractTriggerTypes(graph),
      createdBy: input.userId || null,
      updatedBy: input.userId || null,
    })
    .returning()

  await db.insert(workflowVersions).values({
    workflowId: row.id,
    companyId: input.companyId,
    version: 1,
    graph,
    changelog: 'Initial',
    createdBy: input.userId || null,
  })

  return row
}

export async function updateWorkflowMeta(
  companyId: string,
  id: string,
  patch: {
    name?: string
    description?: string | null
    branchId?: string | null
    warehouseId?: string | null
    roleCodes?: string[]
    packageCodes?: string[]
    status?: string
    userId?: string
  },
) {
  const existing = await getWorkflow(companyId, id)
  const [row] = await db
    .update(workflows)
    .set({
      name: patch.name ?? existing.workflow.name,
      description:
        patch.description === undefined ? existing.workflow.description : patch.description,
      branchId: patch.branchId === undefined ? existing.workflow.branchId : patch.branchId,
      warehouseId:
        patch.warehouseId === undefined ? existing.workflow.warehouseId : patch.warehouseId,
      roleCodes: patch.roleCodes ?? existing.workflow.roleCodes,
      packageCodes: patch.packageCodes ?? existing.workflow.packageCodes,
      status: patch.status ?? existing.workflow.status,
      updatedBy: patch.userId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.id, id), eq(workflows.companyId, companyId)))
    .returning()
  return row
}

export async function saveVersion(
  companyId: string,
  workflowId: string,
  graph: GraphJson,
  changelog?: string,
  userId?: string,
) {
  await getWorkflow(companyId, workflowId)
  const versions = await db
    .select({ version: workflowVersions.version })
    .from(workflowVersions)
    .where(eq(workflowVersions.workflowId, workflowId))
    .orderBy(desc(workflowVersions.version))
    .limit(1)
  const next = (versions[0]?.version || 0) + 1
  const [ver] = await db
    .insert(workflowVersions)
    .values({
      workflowId,
      companyId,
      version: next,
      graph,
      changelog: changelog || `v${next}`,
      createdBy: userId || null,
    })
    .returning()

  await db
    .update(workflows)
    .set({
      triggerTypes: extractTriggerTypes(graph),
      updatedBy: userId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.id, workflowId), eq(workflows.companyId, companyId)))

  return ver
}

export async function publishVersion(
  companyId: string,
  workflowId: string,
  version: number,
  userId?: string,
) {
  const { versions } = await getWorkflow(companyId, workflowId)
  if (!versions.some((v) => v.version === version)) {
    throw new AppError('NOT_FOUND', `Sürüm v${version} yok`, 404)
  }
  const [row] = await db
    .update(workflows)
    .set({
      status: 'published',
      publishedVersion: version,
      updatedBy: userId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.id, workflowId), eq(workflows.companyId, companyId)))
    .returning()
  return row
}

export async function rollbackVersion(
  companyId: string,
  workflowId: string,
  version: number,
  userId?: string,
) {
  return publishVersion(companyId, workflowId, version, userId)
}

/** Topological-ish simulation: walk nodes in graph order, log steps (no side effects). */
export async function simulateWorkflow(
  companyId: string,
  workflowId: string,
  input?: { version?: number; payload?: Record<string, unknown>; userId?: string },
) {
  const { workflow, versions } = await getWorkflow(companyId, workflowId)
  const version = input?.version || workflow.publishedVersion || versions[0]?.version || 1
  const ver = versions.find((v) => v.version === version)
  if (!ver) throw new AppError('NOT_FOUND', 'Sürüm bulunamadı', 404)

  const graph = (ver.graph || { nodes: [], edges: [] }) as GraphJson
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : []
  const started = Date.now()

  const [run] = await db
    .insert(workflowRuns)
    .values({
      workflowId,
      companyId,
      version,
      mode: 'simulation',
      status: 'running',
      triggerType: extractTriggerTypes(graph)[0] || null,
      triggerPayload: input?.payload || {},
    })
    .returning()

  const stepRows: {
    nodeId: string
    catalogId: string | null
    status: string
    durationMs: number
  }[] = []
  for (const raw of nodes) {
    const n = raw as { id?: string; data?: { catalogId?: string } }
    const t0 = Date.now()
    const catalogId = n.data?.catalogId || null
    // Simulation: conditions always pass; waits skip; actions succeed as stub
    const status = 'success'
    const durationMs = Math.max(1, Date.now() - t0)
    stepRows.push({ nodeId: String(n.id || 'unknown'), catalogId, status, durationMs })
    await db.insert(workflowRunSteps).values({
      runId: run.id,
      companyId,
      nodeId: String(n.id || 'unknown'),
      catalogId,
      status,
      startedAt: new Date(t0),
      finishedAt: new Date(),
      durationMs,
      output: { simulated: true, catalogId },
    })
  }

  const finished = Date.now()
  const [done] = await db
    .update(workflowRuns)
    .set({
      status: 'completed',
      finishedAt: new Date(),
      durationMs: finished - started,
      updatedAt: new Date(),
    })
    .where(eq(workflowRuns.id, run.id))
    .returning()

  return { run: done, steps: stepRows }
}

export async function listRuns(companyId: string, workflowId: string) {
  await getWorkflow(companyId, workflowId)
  const runs = await db
    .select()
    .from(workflowRuns)
    .where(and(eq(workflowRuns.workflowId, workflowId), eq(workflowRuns.companyId, companyId)))
    .orderBy(desc(workflowRuns.startedAt))
    .limit(50)
  return runs
}

export async function ingestEvent(
  companyId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
) {
  const [ev] = await db
    .insert(workflowEvents)
    .values({
      companyId,
      eventType,
      payload,
      status: 'pending',
    })
    .returning()

  // WF-0: mark processed after matching published workflows (no live actions yet)
  const published = await db
    .select()
    .from(workflows)
    .where(
      and(
        eq(workflows.companyId, companyId),
        eq(workflows.status, 'published'),
        isNull(workflows.deletedAt),
      ),
    )

  const matched = published.filter((w) => {
    const types = Array.isArray(w.triggerTypes) ? w.triggerTypes : []
    return types.includes(eventType)
  })

  await db
    .update(workflowEvents)
    .set({
      status: 'processed',
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workflowEvents.id, ev.id))

  return { event: ev, matchedWorkflowIds: matched.map((m) => m.id) }
}
