const STORAGE_KEY = 'erlenbox-depo-workflow-stages'

export const DEFAULT_DEPO_STAGES = []

const LEGACY_STATUS_TO_LABEL = {
  Beklemede: 'Beklemede',
  Paketlendi: 'Paketlendi',
  'Teslime Hazır': 'Teslime Hazır',
  Araçta: 'Araç Teslim',
  'Teslim Edildi': 'Teslim Edildi',
}

function sanitizeStages(stages) {
  return (stages || [])
    .filter((stage) => String(stage?.label || '').trim())
    .map((stage) => ({
      requiresPhoto: false,
      requiresTransport: false,
      isTerminal: false,
      note: '',
      ...stage,
      label: String(stage.label).trim(),
    }))
}

export function loadDepoWorkflowStages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DEPO_STAGES.map((stage) => ({ ...stage }))
    const parsed = JSON.parse(raw)
    const stages = sanitizeStages(parsed)
    return stages.length ? stages : DEFAULT_DEPO_STAGES.map((stage) => ({ ...stage }))
  } catch {
    return DEFAULT_DEPO_STAGES.map((stage) => ({ ...stage }))
  }
}

export function saveDepoWorkflowStages(stages) {
  const next = sanitizeStages(stages)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:depo-workflow-stages-updated'))
  return next
}

export function getDepoStageOptions(stages = loadDepoWorkflowStages()) {
  return stages
}

export function findDepoStageById(stageId, stages = loadDepoWorkflowStages()) {
  return stages.find((stage) => stage.id === stageId) || null
}

export function findDepoStageByLabel(label, stages = loadDepoWorkflowStages()) {
  const clean = String(label || '').trim()
  return stages.find((stage) => stage.label === clean) || null
}

export function resolveDepoStageIdFromLegacyStatus(status, stages = loadDepoWorkflowStages()) {
  const mappedLabel = LEGACY_STATUS_TO_LABEL[status] || status
  return findDepoStageByLabel(mappedLabel, stages)?.id || stages[0]?.id || ''
}

export function depoStageAllowsPhotos(stage) {
  if (!stage) return false
  if (stage.requiresPhoto === true) return true
  if (stage.requiresPhoto === false) return false
  const label = String(stage.label || '').toLocaleLowerCase('tr-TR')
  return label.includes('araç') || label.includes('teslim')
}

export function isDepoTerminalStage(stage) {
  if (!stage) return false
  if (stage.isTerminal === true) return true
  return String(stage.label || '').trim() === 'Teslim Edildi'
}

export function getDepoStageFilterOptions(stages = loadDepoWorkflowStages()) {
  return [
    { label: 'Tümü', color: 'bg-gray-500' },
    ...stages.map((stage) => ({ label: stage.label, color: stage.color || 'bg-gray-500' })),
  ]
}
