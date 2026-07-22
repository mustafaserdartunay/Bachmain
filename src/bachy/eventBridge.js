import { subscribeDomainEvents } from '../workflow/eventBus'
import { EMOTIONS, PRIORITY, BACHY_REACTION_EVENT } from './constants'
import { getBachySettings } from './settingsStore'

const MAP = [
  {
    match: (t) => /critical|error|failed|fail/i.test(t),
    priority: PRIORITY.critical,
    emotion: EMOTIONS.supportive,
    activity: 'take_notes',
    celebrate: false,
    promptHint: 'Kritik bir sistem veya işlem uyarısı var; sakin ve destekleyici ol.',
  },
  {
    match: (t) => /payment|tahsil|overdue|gecik/i.test(t) || t === 'trigger.payment.received',
    priority: (t) => (t === 'trigger.payment.received' ? PRIORITY.success : PRIORITY.overdue),
    emotion: (t) => (t === 'trigger.payment.received' ? EMOTIONS.celebrating : EMOTIONS.supportive),
    activity: (t) => (t === 'trigger.payment.received' ? 'mini_dance' : 'check_watch'),
    celebrate: (t) => t === 'trigger.payment.received',
    promptHint: (t) =>
      t === 'trigger.payment.received'
        ? 'Tahsilat geldi; kısa ve motive edici kutla.'
        : 'Geciken tahsilat için nazik hatırlatma yap.',
  },
  {
    match: (t) => /order\.created|quote\.created|invoice\.issued/i.test(t),
    priority: PRIORITY.order,
    emotion: EMOTIONS.happy,
    activity: 'mini_dance',
    celebrate: true,
    promptHint: 'Yeni satış/işlem oluştu; kısa kutlama.',
  },
  {
    match: (t) => /completed|approved|published|delivered/i.test(t),
    priority: PRIORITY.success,
    emotion: EMOTIONS.celebrating,
    activity: 'mini_dance',
    celebrate: true,
    promptHint: 'Başarılı işlem; alkışla ve kısa tebrik et.',
  },
]

function resolve(rule, eventType, key) {
  const v = rule[key]
  return typeof v === 'function' ? v(eventType) : v
}

export function startBachyEventBridge(engine) {
  return subscribeDomainEvents((detail) => {
    const settings = getBachySettings()
    if (!settings.enabled) return
    const eventType = String(detail?.eventType || '')
    const rule = MAP.find((r) => r.match(eventType))
    if (!rule) return

    const reaction = {
      source: 'eventBus',
      eventType,
      payload: detail?.payload || {},
      priority: resolve(rule, eventType, 'priority'),
      emotion: resolve(rule, eventType, 'emotion'),
      activity: resolve(rule, eventType, 'activity'),
      celebrate: Boolean(resolve(rule, eventType, 'celebrate')) && settings.celebrationAnimations,
      promptHint: resolve(rule, eventType, 'promptHint'),
      speak: engine.canSpeak(),
    }

    engine.setReaction(reaction)
    window.dispatchEvent(new CustomEvent(BACHY_REACTION_EVENT, { detail: reaction }))
  })
}
