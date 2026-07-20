const STORE_KEY = 'bach-workflows-v1'
const RUNS_KEY = 'bach-workflow-runs-v1'
const EVENT_KEY = 'bach-workflow-events-v1'

function uid(prefix = 'wf') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function listLocalWorkflows() {
  return readJson(STORE_KEY, []).filter((w) => !w.deletedAt)
}

export function getLocalWorkflow(id) {
  return listLocalWorkflows().find((w) => w.id === id) || null
}

export function saveLocalWorkflow(workflow) {
  const rows = readJson(STORE_KEY, [])
  const idx = rows.findIndex((w) => w.id === workflow.id)
  const next = {
    ...workflow,
    updatedAt: new Date().toISOString(),
  }
  if (idx >= 0) rows[idx] = next
  else rows.unshift(next)
  writeJson(STORE_KEY, rows)
  window.dispatchEvent(new CustomEvent('bach:workflows-updated'))
  return next
}

export function createLocalWorkflow({
  name,
  description = '',
  graph = { nodes: [], edges: [] },
  templateId = null,
}) {
  const now = new Date().toISOString()
  const row = {
    id: uid('wf'),
    name: name || 'Yeni Workflow',
    description,
    status: 'draft',
    publishedVersion: null,
    currentVersion: 1,
    versions: [
      {
        version: 1,
        graph,
        changelog: templateId ? `Template: ${templateId}` : 'Initial',
        createdAt: now,
      },
    ],
    templateId,
    branchId: null,
    warehouseId: null,
    roleCodes: [],
    packageCodes: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  return saveLocalWorkflow(row)
}

export function saveLocalVersion(id, graph, changelog = '') {
  const row = getLocalWorkflow(id)
  if (!row) return null
  const nextVersion = (row.currentVersion || row.versions?.length || 0) + 1
  const versions = [
    ...(row.versions || []),
    {
      version: nextVersion,
      graph,
      changelog: changelog || `v${nextVersion}`,
      createdAt: new Date().toISOString(),
    },
  ]
  return saveLocalWorkflow({
    ...row,
    currentVersion: nextVersion,
    versions,
  })
}

export function publishLocalWorkflow(id, version) {
  const row = getLocalWorkflow(id)
  if (!row) return null
  const ver = version || row.currentVersion
  if (!row.versions?.some((v) => v.version === ver)) return null
  return saveLocalWorkflow({
    ...row,
    status: 'published',
    publishedVersion: ver,
  })
}

export function rollbackLocalWorkflow(id, version) {
  return publishLocalWorkflow(id, version)
}

export function getLocalGraph(id, version) {
  const row = getLocalWorkflow(id)
  if (!row) return { nodes: [], edges: [] }
  const ver =
    version ||
    row.publishedVersion ||
    row.currentVersion ||
    row.versions?.[row.versions.length - 1]?.version
  const snap =
    row.versions?.find((v) => v.version === ver) || row.versions?.[row.versions.length - 1]
  return snap?.graph || { nodes: [], edges: [] }
}

export function listLocalRuns(workflowId) {
  const all = readJson(RUNS_KEY, [])
  return all
    .filter((r) => r.workflowId === workflowId)
    .sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))
}

export function appendLocalRun(run) {
  const all = readJson(RUNS_KEY, [])
  all.unshift(run)
  writeJson(RUNS_KEY, all.slice(0, 200))
  window.dispatchEvent(new CustomEvent('bach:workflow-runs-updated'))
  return run
}

/** Local simulation — no irreversible side effects */
export function simulateLocalWorkflow(id, { version, payload = {} } = {}) {
  const row = getLocalWorkflow(id)
  if (!row) return null
  const graph = getLocalGraph(id, version)
  const startedAt = new Date().toISOString()
  const t0 = Date.now()
  const steps = (graph.nodes || []).map((n) => {
    const started = Date.now()
    return {
      nodeId: n.id,
      catalogId: n.data?.catalogId || null,
      status: 'success',
      durationMs: Math.max(1, Date.now() - started),
      output: { simulated: true },
    }
  })
  const run = {
    id: uid('run'),
    workflowId: id,
    version: version || row.currentVersion,
    mode: 'simulation',
    status: 'completed',
    triggerType:
      steps.find((s) => String(s.catalogId || '').startsWith('trigger.'))?.catalogId || null,
    triggerPayload: payload,
    steps,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
  }
  return appendLocalRun(run)
}

export function appendLocalEvent(eventType, payload = {}) {
  const ev = {
    id: uid('evt'),
    eventType,
    payload,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const all = readJson(EVENT_KEY, [])
  all.unshift(ev)
  writeJson(EVENT_KEY, all.slice(0, 500))
  return ev
}

export function matchPublishedWorkflows(eventType) {
  return listLocalWorkflows().filter((w) => {
    if (w.status !== 'published') return false
    const graph = getLocalGraph(w.id, w.publishedVersion)
    return (graph.nodes || []).some((n) => n.data?.catalogId === eventType)
  })
}
