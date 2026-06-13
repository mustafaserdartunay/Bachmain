const VOICE_SETTINGS_KEY = 'erlenbox-voice-settings'

const defaultVoiceSettings = {
  enabled: true,
  speakReplies: true,
  apiBaseUrl: '',
  openAiApiKey: '',
}

export function readVoiceSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY) || '{}')
    return { ...defaultVoiceSettings, ...saved }
  } catch {
    return { ...defaultVoiceSettings }
  }
}

export function saveVoiceSettings(partial) {
  const next = { ...readVoiceSettings(), ...partial }
  localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('erlenbox:voice-settings-updated'))
  return next
}

export function getVoiceApiBaseUrl() {
  const saved = readVoiceSettings().apiBaseUrl?.trim()
  if (saved) return saved.replace(/\/$/, '')
  return ''
}

export function getClientOpenAiApiKey() {
  return String(readVoiceSettings().openAiApiKey || '').trim()
}
