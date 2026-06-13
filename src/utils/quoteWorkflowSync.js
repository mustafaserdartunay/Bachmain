import { loadQuotes, saveQuotes } from './quotesStore'
import {
  findWorkflowStage,
  loadWorkflowStages,
  resolveProductionActiveStage,
} from './workflowStages'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatActivityDate() {
  return new Date().toLocaleString('tr-TR')
}

function findQuoteIndex(quotes, sharedCode) {
  const code = String(sharedCode || '').trim()
  if (!code) return -1
  return quotes.findIndex((quote) => quote.id === code || quote.orderId === code)
}

function appendActivity(quote, text) {
  const lastText = (quote.activities || []).at(-1)?.text
  if (lastText === text) return quote.activities || []
  return [
    ...(quote.activities || []),
    { id: createId('act'), date: formatActivityDate(), text },
  ]
}

function resolveOrderStage(order) {
  const stages = loadWorkflowStages()
  return findWorkflowStage(stages, order.currentStageId)
}

export function syncQuoteFromOrder(order) {
  const sharedCode = order?.quoteId || order?.id
  if (!sharedCode || !order?.currentStageId) return null

  const quotes = loadQuotes()
  const index = findQuoteIndex(quotes, sharedCode)
  if (index === -1) return null

  const quote = quotes[index]
  const stage = resolveOrderStage(order)
  if (!stage) return null

  if (quote.currentStageId === stage.id && quote.orderId === order.id) {
    return quote
  }

  const stages = loadWorkflowStages()
  quotes[index] = {
    ...quote,
    currentStageId: stage.id,
    orderId: order.id,
    stages,
    activities: appendActivity(quote, `Sipariş süreci "${stage.label}" olarak güncellendi.`),
  }

  saveQuotes(quotes)
  return quotes[index]
}

export function syncQuoteFromProduction(job) {
  const sharedCode = job?.orderId || job?.id
  if (!sharedCode) return null

  const quotes = loadQuotes()
  const index = findQuoteIndex(quotes, sharedCode)
  if (index === -1) return null

  const quote = quotes[index]
  const stages = loadWorkflowStages()
  const activeStage = resolveProductionActiveStage(job, stages)
  if (!activeStage) return null

  const stageLabel = activeStage.label

  if (quote.currentStageId === activeStage.id && quote.productionStage === stageLabel) {
    return quote
  }

  quotes[index] = {
    ...quote,
    currentStageId: activeStage.id,
    orderId: sharedCode,
    productionStage: stageLabel,
    stages,
    activities: appendActivity(quote, `Üretim süreci "${stageLabel}" olarak güncellendi.`),
  }

  saveQuotes(quotes)
  return quotes[index]
}
