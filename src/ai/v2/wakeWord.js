/**
 * Bach AI V2 — local wake-word detector (no cloud while idle).
 */

import { WAKE_STATES, WAKE_WORD_CONFIG, VOICE_CONFIG } from './config.js'

export { WAKE_STATES }

function normalize(text) {
  return String(text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[!?.,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchWakePhrase(rawText, config = WAKE_WORD_CONFIG) {
  const text = normalize(rawText)
  if (!text) return { matched: false, reason: 'empty' }

  for (const blocked of config.blockPhrases || []) {
    if (text.includes(normalize(blocked))) {
      return { matched: false, reason: 'blocked_phrase', phrase: blocked }
    }
  }

  const phrases = [...(config.phrases || [])].sort((a, b) => b.length - a.length)
  for (const phrase of phrases) {
    const p = normalize(phrase)
    if (!p) continue
    if (text === p || text.startsWith(`${p} `) || text.endsWith(` ${p}`) || text.includes(` ${p} `)) {
      return { matched: true, phrase: p, confidence: text === p ? 1 : 0.85 }
    }
  }
  return { matched: false, reason: 'no_match' }
}

export function createWakeWordController(options = {}) {
  const config = { ...WAKE_WORD_CONFIG, ...options.wakeConfig }
  const voiceConfig = { ...VOICE_CONFIG, ...options.voiceConfig }
  let state = WAKE_STATES.IDLE
  let silenceTimer = null
  let cooldownUntil = 0
  const listeners = new Set()

  function emit(event, payload = {}) {
    if (voiceConfig.debug || options.debug) {
      // eslint-disable-next-line no-console
      console.debug('[BachAI wake]', event, payload)
    }
    listeners.forEach((fn) => {
      try {
        fn(event, payload)
      } catch {
        /* ignore */
      }
    })
  }

  function setState(next, payload = {}) {
    state = next
    emit('state', { state: next, ...payload })
  }

  function clearSilence() {
    if (silenceTimer) {
      window.clearTimeout(silenceTimer)
      silenceTimer = null
      emit('timer_cancelled')
    }
  }

  function armSilence(onFinal) {
    clearSilence()
    const ms = config.commandSilenceTimeoutMs || voiceConfig.finalSilenceTimeoutMs || 3000
    emit('timer_armed', { ms })
    silenceTimer = window.setTimeout(() => {
      silenceTimer = null
      emit('final_silence')
      onFinal?.()
    }, ms)
  }

  return {
    getState: () => state,
    onEvent(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    startListeningForWake() {
      if (Date.now() < cooldownUntil) {
        setState(WAKE_STATES.COOLDOWN)
        return
      }
      setState(WAKE_STATES.LISTENING_FOR_WAKE_WORD)
    },
    ingestTranscript(text, { isFinal = false } = {}) {
      if (state === WAKE_STATES.LISTENING_FOR_WAKE_WORD) {
        const hit = matchWakePhrase(text, config)
        if (!hit.matched) {
          emit('wake_reject', hit)
          return { wake: false }
        }
        if ((hit.confidence || 0) < (config.minConfidence || 0.55)) {
          emit('wake_reject', { ...hit, reason: 'low_confidence' })
          return { wake: false }
        }
        setState(WAKE_STATES.WAKE_DETECTED, { phrase: hit.phrase })
        setState(WAKE_STATES.LISTENING_COMMAND)
        emit('wake_detected', hit)
        return { wake: true, phrase: hit.phrase }
      }

      if (state === WAKE_STATES.LISTENING_COMMAND) {
        emit(isFinal ? 'speech_stopped' : 'speech_started', { text })
        armSilence(() => {
          setState(WAKE_STATES.PROCESSING)
        })
        return { wake: false, commandPartial: text }
      }

      return { wake: false }
    },
    markProcessing() {
      clearSilence()
      setState(WAKE_STATES.PROCESSING)
    },
    markResponding() {
      setState(WAKE_STATES.RESPONDING)
    },
    complete() {
      clearSilence()
      cooldownUntil = Date.now() + (config.cooldownMs || 2500)
      setState(WAKE_STATES.COOLDOWN)
      window.setTimeout(() => {
        if (state === WAKE_STATES.COOLDOWN) setState(WAKE_STATES.LISTENING_FOR_WAKE_WORD)
      }, config.cooldownMs || 2500)
    },
    fail(message) {
      clearSilence()
      setState(WAKE_STATES.ERROR, { message })
    },
    stop() {
      clearSilence()
      setState(WAKE_STATES.IDLE)
    },
  }
}

export default createWakeWordController
