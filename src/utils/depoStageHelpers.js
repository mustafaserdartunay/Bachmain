import { resolveProductionStageActiveIndex } from './workflowStages'
import {
  depoStageAllowsPhotos,
  findDepoStageById,
  isDepoTerminalStage,
  loadDepoWorkflowStages,
} from './depoWorkflowStages'
import { normalizeStagePhotos } from './productionStagePhotos'

export function getDepoItemStageProgress(item, stages = loadDepoWorkflowStages()) {
  const { productionStages, activeIndex } = resolveProductionStageActiveIndex(
    { currentStageId: item?.currentStageId },
    stages,
  )
  return productionStages.map((stage, index) => ({
    ...stage,
    completed: activeIndex >= 0 && index < activeIndex,
    active: activeIndex >= 0 && index === activeIndex,
    pending: activeIndex < 0 || index > activeIndex,
  }))
}

export function getDepoItemMinimalSteps(item, stages = loadDepoWorkflowStages()) {
  return getDepoItemStageProgress(item, stages).map((stage) => ({
    id: stage.id,
    label: stage.label,
    color: stage.color,
    requiresPhoto: stage.requiresPhoto,
    requiresTransport: stage.requiresTransport,
    isTerminal: stage.isTerminal,
    count: stage.completed || stage.active ? 1 : 0,
    total: 1,
    isActive: stage.active,
    isComplete: stage.completed,
  }))
}

export function getDepoItemActiveStage(item, stages = loadDepoWorkflowStages()) {
  return getDepoItemStageProgress(item, stages).find((stage) => stage.active) || null
}

export function getDepoItemStatusLabel(item, stages = loadDepoWorkflowStages()) {
  const active = getDepoItemActiveStage(item, stages)
  return active?.label || item?.status || stages[0]?.label || 'Beklemede'
}

export function getDepoStagePhoto(item, stageId) {
  return normalizeStagePhotos(item?.stagePhotos).find((photo) => photo.stageId === stageId) || null
}

export function depoStepAllowsPhotos(step) {
  if (!step) return false
  if (step.requiresPhoto === true) return true
  if (step.requiresPhoto === false) return false
  return depoStageAllowsPhotos(step)
}

export function canAdvanceDepoItemToStage(item, stageId, stages = loadDepoWorkflowStages()) {
  const target = findDepoStageById(stageId, stages)
  if (!target) return { ok: false, reason: 'Aşama bulunamadı.' }
  if (target.requiresPhoto && !getDepoStagePhoto(item, stageId)) {
    return { ok: false, reason: `${target.label} için fotoğraf yükleyin.` }
  }
  if (target.requiresTransport) {
    if (!item.transportType || !item.vehicleId || !item.driverId) {
      return { ok: false, reason: 'Araç teslimi için nakliye, araç ve şoför seçin.' }
    }
  }
  return { ok: true }
}

export function isDepoItemDelivered(item, stages = loadDepoWorkflowStages()) {
  const active = getDepoItemActiveStage(item, stages)
  if (active && isDepoTerminalStage(active)) return true
  return getDepoItemStatusLabel(item, stages) === 'Teslim Edildi'
}
