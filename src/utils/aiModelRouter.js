/**
 * BachMain AI task → model tier routing.
 * Concrete IDs resolve in server/openaiModels.js (Luna/Terra/Sol/Gemini Live).
 */

export const AI_TASK_MODELS = {
  voice_conversation: 'gemini-live',
  simple_text: 'luna',
  create_quote: 'luna',
  create_order: 'luna',
  crm: 'luna',
  customer_query: 'luna',
  stock_query: 'luna',
  simple_report: 'luna',
  complex_finance: 'terra',
  admin_report: 'terra',
  complex_analysis: 'sol',
  voice_reply: 'gemini-live',
}

export function resolveAiTaskModel(task) {
  const key = String(task || '').trim()
  return AI_TASK_MODELS[key] || AI_TASK_MODELS.crm
}
