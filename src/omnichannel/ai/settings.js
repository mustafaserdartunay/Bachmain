import { STORAGE_KEYS } from '../schema'

/** Bump when fast defaults should merge into saved localStorage. */
export const OMNI_AI_SETTINGS_VERSION = 2

/** Mesaj merkezi / TeamHub — hız odaklı model listesi. */
export const OMNI_MODEL_PRESETS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (en hızlı · önerilen)' },
  { id: 'gpt-4o', label: 'GPT-4o (hızlı · daha kaliteli)' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-5.5', label: 'GPT-5.5 (yavaş · yüksek kalite)' },
  { id: 'gpt-5.5-pro', label: 'GPT-5.5 Pro (en yavaş · en yüksek kalite)' },
]

const defaultAiSettings = {
  settingsVersion: OMNI_AI_SETTINGS_VERSION,
  enabled: true,
  speedProfile: 'fast',
  autoReply: false,
  autoReplyMinConfidence: 0.68,
  autoReplyDelayMs: 800,
  model: 'gpt-4o-mini',
  reasoningEffort: 'low',
  maxOutputTokens: 512,
  maxThreadMessages: 12,
  maxLearningExamples: 6,
  companyName: 'Erlenbox',
  brandVoice: 'Profesyonel, sıcak ve çözüm odaklı. Kısa ve net cevaplar ver.',
}

const FAST_MIGRATION_PATCH = {
  settingsVersion: OMNI_AI_SETTINGS_VERSION,
  speedProfile: 'fast',
  model: 'gpt-4o-mini',
  reasoningEffort: 'low',
  maxOutputTokens: 512,
  maxThreadMessages: 12,
  maxLearningExamples: 6,
  autoReplyDelayMs: 800,
}

function shouldMigrateToFast(saved = {}) {
  const version = Number(saved.settingsVersion || 1)
  if (version >= OMNI_AI_SETTINGS_VERSION) return false
  const model = String(saved.model || defaultAiSettings.model)
  return version < OMNI_AI_SETTINGS_VERSION || model === 'gpt-5.5-pro' || model === 'gpt-5.5'
}

export function readAiSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.aiSettings) || '{}')
    let next = { ...defaultAiSettings, ...saved }

    if (shouldMigrateToFast(saved)) {
      next = { ...next, ...FAST_MIGRATION_PATCH }
      localStorage.setItem(STORAGE_KEYS.aiSettings, JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('bach:omni-ai-settings-updated'))
    }

    return next
  } catch {
    return { ...defaultAiSettings }
  }
}

export function saveAiSettings(partial) {
  const next = {
    ...readAiSettings(),
    ...partial,
    settingsVersion: OMNI_AI_SETTINGS_VERSION,
  }
  localStorage.setItem(STORAGE_KEYS.aiSettings, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:omni-ai-settings-updated'))
  return next
}

export function applyFastOmniAiDefaults() {
  return saveAiSettings(FAST_MIGRATION_PATCH)
}
