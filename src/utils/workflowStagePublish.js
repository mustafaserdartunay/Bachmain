import {
  DEFAULT_ORDER_STAGE_ID,
  getOrderStageOptions,
  getProductionStageOptions,
  loadWorkflowStages,
  saveWorkflowStages,
} from './workflowStages'
import { loadOrders, saveOrders } from './ordersStore'
import { loadProductionJobs, saveProductionJobs } from './productionStore'
import { loadQuotes, saveQuotes } from './quotesStore'

export function publishWorkflowStages(stages) {
  const savedStages = saveWorkflowStages(stages)

  const quotes = loadQuotes().map((quote) => ({ ...quote, stages: savedStages }))
  saveQuotes(quotes, { silent: true })

  const orderStageIds = new Set(getOrderStageOptions(savedStages).map((stage) => stage.id))
  const defaultOrderStageId = getOrderStageOptions(savedStages)[0]?.id || DEFAULT_ORDER_STAGE_ID
  const orders = loadOrders().map((order) => {
    let currentStageId = order.currentStageId ?? ''
    if (!currentStageId || !orderStageIds.has(currentStageId)) {
      currentStageId = defaultOrderStageId
    }
    return { ...order, stages: savedStages, currentStageId }
  })
  saveOrders(orders)

  const productionStages = getProductionStageOptions(savedStages)
  const defaultProductionStageId = productionStages[0]?.id || ''
  const jobs = loadProductionJobs().map((job) => {
    let currentStageId = job.currentStageId ?? ''
    if (!currentStageId || !productionStages.some((stage) => stage.id === currentStageId)) {
      currentStageId = defaultProductionStageId
    }
    const stage = productionStages.find((item) => item.id === currentStageId)?.label || job.stage || ''
    return {
      ...job,
      stages: savedStages,
      currentStageId,
      stage,
    }
  })
  saveProductionJobs(jobs)

  return savedStages
}

export function ensureWorkflowStagesInitialized() {
  loadWorkflowStages()
}
