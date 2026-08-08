/**
 * BachMain AI task → model tier routing.
 * Concrete IDs resolve in server/openaiModels.js (Luna/Terra/Sol).
 * V2 mirror: `src/ai/v2/config.js` MODEL_ROUTER.
 */

import { MODEL_ROUTER as V2_MODEL_ROUTER, resolveAiV2Tier } from '../ai/v2/config.js'

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
  /** V2 task keys */
  ...Object.fromEntries(
    Object.entries(V2_MODEL_ROUTER).filter(([, v]) => typeof v === 'string' && !String(v).includes('gpt')),
  ),
}

export function resolveAiTaskModel(task) {
  const key = String(task || '').trim()
  if (AI_TASK_MODELS[key]) return AI_TASK_MODELS[key]
  return resolveAiV2Tier(key) || AI_TASK_MODELS.crm
}

