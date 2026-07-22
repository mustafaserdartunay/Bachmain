import { EMOTIONS, IDLE_ACTIVITIES, PRIORITY } from './constants'
import { getBachySettings } from './settingsStore'

let lastIdle = null
let lastSpokeAt = 0

function pickIdle(exclude) {
  const pool = IDLE_ACTIVITIES.filter((a) => a !== exclude)
  return pool[Math.floor(Math.random() * pool.length)] || 'wait_user'
}

export function createBehaviorEngine() {
  let emotion = EMOTIONS.idle
  let activity = 'wait_user'
  let priority = PRIORITY.idle
  let reaction = null
  const listeners = new Set()

  function emit() {
    const snapshot = getState()
    listeners.forEach((fn) => fn(snapshot))
  }

  function getState() {
    return { emotion, activity, priority, reaction, at: Date.now() }
  }

  function setReaction(next) {
    const settings = getBachySettings()
    if (!settings.enabled || !settings.motionEnabled) return getState()
    const p = Number(next.priority || 0)
    if (reaction && p < priority && Date.now() - (reaction.at || 0) < 4000) {
      return getState()
    }
    priority = p
    emotion = next.emotion || EMOTIONS.curious
    activity = next.activity || activity
    reaction = { ...next, at: Date.now() }
    emit()
    return getState()
  }

  function clearReaction() {
    reaction = null
    priority = PRIORITY.idle
    emotion = EMOTIONS.idle
    emit()
  }

  function tickIdle() {
    const settings = getBachySettings()
    if (!settings.enabled || !settings.motionEnabled || settings.motionIntensity === 'off') return
    if (reaction && Date.now() - reaction.at < 5000) return
    if (settings.mode === 'minimal') {
      activity = 'wait_user'
      emotion = EMOTIONS.idle
      emit()
      return
    }
    activity = pickIdle(lastIdle)
    lastIdle = activity
    emotion = settings.mode === 'fun' ? EMOTIONS.happy : EMOTIONS.thoughtful
    priority = PRIORITY.idle
    emit()
  }

  function canSpeak() {
    const settings = getBachySettings()
    if (settings.quietMode || settings.speechFrequency === 'silent') return false
    const gaps = { rare: 120000, normal: 45000, frequent: 18000 }
    const gap = gaps[settings.speechFrequency] || 45000
    if (Date.now() - lastSpokeAt < gap) return false
    return true
  }

  function markSpoke() {
    lastSpokeAt = Date.now()
  }

  function subscribe(fn) {
    listeners.add(fn)
    fn(getState())
    return () => listeners.delete(fn)
  }

  return {
    getState,
    setReaction,
    clearReaction,
    tickIdle,
    canSpeak,
    markSpoke,
    subscribe,
  }
}

export { PRIORITY, EMOTIONS }
