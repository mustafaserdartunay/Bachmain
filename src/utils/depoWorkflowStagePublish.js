import { loadDepoItems, saveDepoState, loadDepoState } from './depoStore'
import {
  findDepoStageByLabel,
  loadDepoWorkflowStages,
  resolveDepoStageIdFromLegacyStatus,
  saveDepoWorkflowStages,
} from './depoWorkflowStages'

function migrateDepoItemsToStages(stages) {
  const state = loadDepoState()
  const items = (state.items || []).map((item) => {
    const currentStageId = item.currentStageId
      || resolveDepoStageIdFromLegacyStatus(item.status, stages)
      || stages[0]?.id
        || ''
    const stage = stages.find((entry) => entry.id === currentStageId)
      || findDepoStageByLabel(item.status, stages)
    return {
      ...item,
      currentStageId: stage?.id || currentStageId,
      status: stage?.label || item.status,
      stagePhotos: Array.isArray(item.stagePhotos) ? item.stagePhotos : [],
    }
  })
  saveDepoState({ ...state, items })
}

export function publishDepoWorkflowStages(stages) {
  const next = saveDepoWorkflowStages(stages)
  migrateDepoItemsToStages(next)
  window.dispatchEvent(new CustomEvent('bach:depo-updated'))
  return next
}
