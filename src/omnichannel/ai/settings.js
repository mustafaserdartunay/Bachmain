import { STORAGE_KEYS } from '../schema'

const defaultAiSettings = {
  enabled: true,
  autoReply: false,
  autoReplyMinConfidence: 0.72,
  autoReplyDelayMs: 1500,
  model: 'gpt-5.5',
  companyName: 'Erlenbox',
  brandVoice: 'Profesyonel, sıcak ve çözüm odaklı. Kısa ve net cevaplar ver.',
}

export function readAiSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.aiSettings) || '{}')
    return { ...defaultAiSettings, ...saved }
  } catch {
    return { ...defaultAiSettings }
  }
}

export function saveAiSettings(partial) {
  const next = { ...readAiSettings(), ...partial }
  localStorage.setItem(STORAGE_KEYS.aiSettings, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:omni-ai-settings-updated'))
  return next
}
