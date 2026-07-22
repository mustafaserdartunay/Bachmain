import { sendVoiceChat } from '../utils/voiceApi'
import { buildBachyContext } from './context'

const SYSTEM = `Sen Bachy'sin — BachMain ERP'nin yaşayan AI çalışma arkadaşı.
Maskot değilsin; kullanıcıya yardımcı, neşeli ama abartısız bir işletim asistanısın.
Asla kızgın olma. Kısa konuş (1-2 cümle varsayılan). Hazır kalıp kullanma; bağlama göre üret.`

export async function askBachy({ userText, pathname, engineState, history = [] }) {
  const context = await buildBachyContext({
    pathname,
    emotion: engineState?.emotion,
    activity: engineState?.activity,
    reaction: engineState?.reaction,
  })

  const messages = [
    { role: 'system', content: SYSTEM },
    ...history.slice(-8),
    {
      role: 'user',
      content: userText,
    },
  ]

  const data = await sendVoiceChat({ messages, context })
  return {
    reply:
      data.reply ||
      data.message ||
      data.content ||
      'Şu an yanıt üretemedim; birazdan tekrar deneyelim.',
    actions: data.actions || [],
    raw: data,
  }
}

export async function reactSpeech(engine, pathname) {
  const state = engine.getState()
  if (!state.reaction?.speak || !engine.canSpeak()) return null
  const hint = state.reaction.promptHint || 'Kısa, bağlama uygun bir cümle söyle.'
  const eventType = state.reaction.eventType || 'event'
  try {
    const result = await askBachy({
      userText: `Olay: ${eventType}. Yönerge: ${hint}. Tek cümle veya iki kısa cümle yaz.`,
      pathname,
      engineState: state,
    })
    engine.markSpoke()
    return result.reply
  } catch {
    return null
  }
}
