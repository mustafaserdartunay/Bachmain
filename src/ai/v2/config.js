/**
 * Bach AI V2 — client-safe mirror of server/ai/config.js.
 * No secrets. Keep MODEL_ROUTER + defaults in sync with the server file.
 */

export const AI_CONFIG = {
  version: 2,
  models: {
    luna: 'gpt-5.5',
    terra: 'gpt-5.5-pro',
    sol: 'gpt-5.5-pro',
    realtime: 'gpt-realtime-2.1-mini',
    realtimeComplex: 'gpt-realtime-2.1',
  },
}

export const MODEL_ROUTER = {
  intent: 'luna',
  simple_command: 'luna',
  offer_draft: 'luna',
  customer_lookup: 'luna',
  stock_lookup: 'luna',
  account_balance: 'luna',
  finance_report: 'terra',
  executive_summary: 'terra',
  complex_analysis: 'sol',
  realtime_default: 'realtime',
  realtime_complex: 'realtimeComplex',
}

export const VOICE_CONFIG = {
  speechDetection: {
    shortSilenceMs: 400,
    longSilenceMs: 900,
    finalSilenceMs: 1500,
  },
  shortSilenceTimeoutMs: 400,
  longSilenceTimeoutMs: 900,
  finalSilenceTimeoutMs: 1500,
  sessionTimeoutMs: 120000,
  interruptThreshold: 0.55,
  minimumSpeechDuration: 250,
  debug: false,
}

export const WAKE_WORD_CONFIG = {
  COMMAND_SILENCE_TIMEOUT: 3000,
  commandSilenceTimeoutMs: 3000,
  sensitivity: 0.65,
  minConfidence: 0.55,
  cooldownMs: 1200,
  phrases: ['hey bach', 'hey bak', 'bach', 'bak'],
  falsePositiveBlocklist: ['bachmain'],
  blockPhrases: ['bachmain'],
}

/** Wake-word state machine (Phase 5). */
export const WAKE_STATES = {
  IDLE: 'IDLE',
  LISTENING_FOR_WAKE_WORD: 'LISTENING_FOR_WAKE_WORD',
  WAKE_DETECTED: 'WAKE_DETECTED',
  LISTENING_COMMAND: 'LISTENING_COMMAND',
  PROCESSING: 'PROCESSING',
  RESPONDING: 'RESPONDING',
  COOLDOWN: 'COOLDOWN',
  ERROR: 'ERROR',
}

export function resolveAiV2Tier(task) {
  const key = String(task || 'intent').trim().toLowerCase()
  return MODEL_ROUTER[key] || 'luna'
}

export function resolveAiV2ModelId(task) {
  const tier = resolveAiV2Tier(task)
  return AI_CONFIG.models[tier] || AI_CONFIG.models.luna
}

export default {
  AI_CONFIG,
  MODEL_ROUTER,
  VOICE_CONFIG,
  WAKE_WORD_CONFIG,
  WAKE_STATES,
  resolveAiV2Tier,
  resolveAiV2ModelId,
}
