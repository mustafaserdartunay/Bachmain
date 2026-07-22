import { buildRichVoiceContext } from '../utils/voiceActions'
import { getBachySettings } from './settingsStore'
import { readCompanySettings } from '../utils/companySettings'

export async function buildBachyContext({ pathname, emotion, activity, reaction }) {
  const rich = await buildRichVoiceContext(pathname || window.location.pathname)
  const company = readCompanySettings()
  const settings = getBachySettings()
  return {
    ...rich,
    assistant: 'Bachy',
    role: 'BachMain living AI operating companion',
    language: 'tr-TR',
    companyName: company.companyName || company.shortName || 'BachMain',
    currentPage: pathname || window.location.pathname,
    emotion,
    activity,
    lastReaction: reaction
      ? { eventType: reaction.eventType, promptHint: reaction.promptHint }
      : null,
    mode: settings.mode,
    adviceIntensity: settings.adviceIntensity,
    rules: [
      'Never be angry or rude.',
      'Be concise, warm, professional.',
      'Use ERP context; do not invent fake numbers when unsure.',
      'Speak Turkish unless user writes otherwise.',
      'Do not spam; keep proactive tips short.',
    ],
  }
}
