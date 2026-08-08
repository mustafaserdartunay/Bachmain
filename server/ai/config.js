/**
 * Bach AI V2 — central server configuration.
 * Existing `/api/voice/*` stays parallel; resolve luna/terra/sol via these helpers.
 */

function envString(name, fallback) {
  const raw = process.env[name]
  if (raw == null || String(raw).trim() === '') return fallback
  return String(raw).trim()
}

function envNumber(name, fallback) {
  const raw = process.env[name]
  if (raw == null || String(raw).trim() === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function envFloat(name, fallback) {
  const raw = process.env[name]
  if (raw == null || String(raw).trim() === '') return fallback
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

/** Product model IDs (env overrides). */
export const AI_CONFIG = {
  version: 2,
  models: {
    luna: envString('OPENAI_MODEL_LUNA', envString('OPENAI_MODEL', 'gpt-5.5')),
    terra: envString('OPENAI_MODEL_TERRA', 'gpt-5.5-pro'),
    sol: envString('OPENAI_MODEL_SOL', 'gpt-5.5-pro'),
    realtime: envString('OPENAI_REALTIME_MODEL', 'gpt-realtime-2.1-mini'),
    realtimeComplex: envString('OPENAI_REALTIME_MODEL_COMPLEX', 'gpt-realtime-2.1'),
    /** Voice STT slot until Gemini Live is wired — maps to Luna for chat. */
    geminiLive: envString('OPENAI_MODEL_LUNA', envString('OPENAI_MODEL', 'gpt-5.5')),
  },
}

/**
 * Task → product tier. Resolve concrete model via `resolveTierModel` / `resolveTaskModel`.
 * Keep in sync with `src/ai/v2/config.js`.
 */
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
  /** Direct tier aliases (openaiModels AI_MODEL_TIERS). */
  luna: AI_CONFIG.models.luna,
  terra: AI_CONFIG.models.terra,
  sol: AI_CONFIG.models.sol,
  realtime: AI_CONFIG.models.realtime,
  realtimeComplex: AI_CONFIG.models.realtimeComplex,
  geminiLive: AI_CONFIG.models.geminiLive,
}

/** Speech / Realtime client timing (ms unless noted). */
export const VOICE_CONFIG = {
  speechDetection: {
    shortSilenceMs: envNumber('AI_VOICE_SHORT_SILENCE_MS', 400),
    longSilenceMs: envNumber('AI_VOICE_LONG_SILENCE_MS', 900),
    finalSilenceMs: envNumber('AI_VOICE_FINAL_SILENCE_MS', 1500),
  },
  /** Flat aliases used by Realtime session + wake controllers. */
  shortSilenceTimeoutMs: envNumber('AI_VOICE_SHORT_SILENCE_MS', 400),
  longSilenceTimeoutMs: envNumber('AI_VOICE_LONG_SILENCE_MS', 900),
  finalSilenceTimeoutMs: envNumber('AI_VOICE_FINAL_SILENCE_MS', 1500),
  sessionTimeoutMs: envNumber('AI_VOICE_SESSION_TIMEOUT_MS', 120000),
  interruptThreshold: envFloat('AI_VOICE_INTERRUPT_THRESHOLD', 0.55),
  minimumSpeechDuration: envNumber('AI_VOICE_MIN_SPEECH_MS', 250),
  debug: String(process.env.AI_VOICE_DEBUG || '').toLowerCase() === 'true',
}

/** Local wake-word state machine defaults (Phase 5). */
export const WAKE_WORD_CONFIG = {
  COMMAND_SILENCE_TIMEOUT: envNumber('AI_WAKE_COMMAND_SILENCE_MS', 3000),
  commandSilenceTimeoutMs: envNumber('AI_WAKE_COMMAND_SILENCE_MS', 3000),
  sensitivity: envFloat('AI_WAKE_SENSITIVITY', 0.65),
  minConfidence: envFloat('AI_WAKE_MIN_CONFIDENCE', 0.55),
  cooldownMs: envNumber('AI_WAKE_COOLDOWN_MS', 1200),
  phrases: ['hey bach', 'hey bak', 'bach', 'bak'],
  falsePositiveBlocklist: ['bachmain'],
  blockPhrases: ['bachmain'],
}

export const AI_MODEL_TIERS_V2 = {
  luna: AI_CONFIG.models.luna,
  terra: AI_CONFIG.models.terra,
  sol: AI_CONFIG.models.sol,
  realtime: AI_CONFIG.models.realtime,
  realtimeComplex: AI_CONFIG.models.realtimeComplex,
  'gemini-live': AI_CONFIG.models.geminiLive,
}

/**
 * Resolve a product tier or concrete model id.
 * @param {string} [tierOrModel]
 */
export function resolveTierModel(tierOrModel) {
  const key = String(tierOrModel || 'luna').trim().toLowerCase()
  if (AI_MODEL_TIERS_V2[key]) return String(AI_MODEL_TIERS_V2[key]).trim()
  if (key === 'gemini-live') return String(AI_CONFIG.models.luna).trim()
  // Already a concrete model id (gpt-…)
  if (key.includes('gpt') || key.includes('realtime') || key.includes('o1') || key.includes('o3')) {
    return String(tierOrModel).trim()
  }
  return String(AI_CONFIG.models.luna).trim()
}

/** Resolve MODEL_ROUTER task key → OpenAI model id. */
export function resolveTaskModel(task) {
  const key = String(task || 'intent').trim().toLowerCase()
  const mapped = MODEL_ROUTER[key]
  if (!mapped) return resolveTierModel('luna')
  // Task keys map to tier names; tier keys map to model ids.
  if (['luna', 'terra', 'sol', 'realtime', 'realtimeComplex', 'geminiLive'].includes(mapped)) {
    return resolveTierModel(mapped)
  }
  return String(mapped).trim()
}

/** @deprecated Prefer resolveTierModel / resolveTaskModel */
export function resolveAiV2Model(tierOrTask) {
  return resolveTaskModel(tierOrTask)
}

export default {
  AI_CONFIG,
  MODEL_ROUTER,
  VOICE_CONFIG,
  WAKE_WORD_CONFIG,
  AI_MODEL_TIERS_V2,
  resolveTierModel,
  resolveTaskModel,
  resolveAiV2Model,
}
