import {
  getOrderStageOptions,
  getProductionStageOptions,
  loadWorkflowStages,
  saveWorkflowStages,
  DEFAULT_ORDER_STAGE_ID,
} from './workflowStages'
import { loadOrders, saveOrders } from './ordersStore'
import { loadProductionJobs, saveProductionJobs } from './productionStore'
import { loadQuotes, saveQuotes } from './quotesStore'
import { deriveJobSummary, ensureLineItems } from './productionLineItems'

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
    // Remap line/quantity-row stage ids to the live settings list (add/delete safe).
    const lineItems = ensureLineItems({ ...job, stages: savedStages }, savedStages)
    const summary = deriveJobSummary({ ...job, lineItems, stages: savedStages }, savedStages)
    let currentStageId = summary.currentStageId || job.currentStageId || ''
    if (!currentStageId || !productionStages.some((stage) => stage.id === currentStageId)) {
      currentStageId = defaultProductionStageId
    }
    const stage =
      productionStages.find((item) => item.id === currentStageId)?.label || summary.stage || job.stage || ''
    return {
      ...job,
      ...summary,
      stages: savedStages,
      lineItems,
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
