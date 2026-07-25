const PANELS_KEY = 'bach-custom-process-panels'
const STAGES_KEY = 'bach-custom-process-stage-lists'

export const CUSTOM_PROCESS_PANELS_EVENT = 'bach:custom-process-panels-updated'
export const CUSTOM_PROCESS_STAGES_EVENT = 'bach:custom-process-stages-updated'

/** Option-list style sections on LabelsSettingsPage */
export const OPTION_SECTION_IDS = ['status', 'customer', 'category', 'cash', 'tags', 'salesRep']

/** Stage-list style sections (workflow tabs) */
export const STAGE_SECTION_IDS = ['quote', 'order', 'depo', 'production']

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value, eventName, detail) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
  return value
}

function emptyPanels() {
  return {
    status: [],
    customer: [],
    category: [],
    cash: [],
    tags: [],
    salesRep: [],
    quote: [],
    order: [],
    depo: [],
    production: [],
  }
}

export function loadCustomProcessPanels() {
  const saved = readJson(PANELS_KEY, null)
  return { ...emptyPanels(), ...(saved || {}) }
}

export function getCustomProcessPanels(sectionId) {
  return loadCustomProcessPanels()[sectionId] || []
}

export function addCustomProcessPanel(sectionId, title) {
  const clean = String(title || '').trim()
  if (!clean) return loadCustomProcessPanels()

  const current = loadCustomProcessPanels()
  const list = current[sectionId] || []
  const isStageSection = STAGE_SECTION_IDS.includes(sectionId)
  const id = createId(isStageSection ? 'cseg' : 'cpanel')
  const fieldKey = isStageSection ? null : `custom-${id}`
  const nextPanel = {
    id,
    title: clean,
    description: 'Özel süreç listesi.',
    fieldKey,
    kind: isStageSection ? 'stages' : 'options',
  }
  const next = {
    ...current,
    [sectionId]: [...list, nextPanel],
  }
  writeJson(PANELS_KEY, next, CUSTOM_PROCESS_PANELS_EVENT, { sectionId, panelId: id })

  if (isStageSection) {
    saveCustomStageList(id, [])
  }

  return next
}

export function removeCustomProcessPanel(sectionId, panelId) {
  const current = loadCustomProcessPanels()
  const list = current[sectionId] || []
  const removed = list.find((panel) => panel.id === panelId)
  const next = {
    ...current,
    [sectionId]: list.filter((panel) => panel.id !== panelId),
  }
  writeJson(PANELS_KEY, next, CUSTOM_PROCESS_PANELS_EVENT, { sectionId, panelId })

  if (removed?.kind === 'stages' || STAGE_SECTION_IDS.includes(sectionId)) {
    const stages = loadAllCustomStageLists()
    if (stages[panelId]) {
      delete stages[panelId]
      writeJson(STAGES_KEY, stages, CUSTOM_PROCESS_STAGES_EVENT, { panelId })
    }
  }

  return { next, removed }
}

export function renameCustomProcessPanel(sectionId, panelId, title) {
  const clean = String(title || '').trim()
  if (!clean) return loadCustomProcessPanels()
  const current = loadCustomProcessPanels()
  const next = {
    ...current,
    [sectionId]: (current[sectionId] || []).map((panel) =>
      panel.id === panelId ? { ...panel, title: clean } : panel,
    ),
  }
  return writeJson(PANELS_KEY, next, CUSTOM_PROCESS_PANELS_EVENT, { sectionId, panelId })
}

function loadAllCustomStageLists() {
  return readJson(STAGES_KEY, {})
}

export function loadCustomStageList(panelId) {
  const all = loadAllCustomStageLists()
  return Array.isArray(all[panelId]) ? all[panelId] : []
}

export function saveCustomStageList(panelId, stages) {
  const all = loadAllCustomStageLists()
  const next = { ...all, [panelId]: Array.isArray(stages) ? stages : [] }
  writeJson(STAGES_KEY, next, CUSTOM_PROCESS_STAGES_EVENT, { panelId })
  return next[panelId]
}

export function isCustomStageSourceId(sourceId) {
  return String(sourceId || '').startsWith('cseg-')
}
