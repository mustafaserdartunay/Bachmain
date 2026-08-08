/**
 * Bach AI V2 — smart end-of-speech (VAD + silence tiers).
 * SHORT / LONG / FINAL; timer resets on speech; debug events only when enabled.
 */

import { VOICE_CONFIG } from './config.js'

export const EOS_LEVEL = {
  SHORT: 'SHORT',
  LONG: 'LONG',
  FINAL: 'FINAL',
}

export function createEndOfSpeechController(options = {}) {
  const cfg = {
    shortMs: options.shortMs ?? VOICE_CONFIG.shortSilenceTimeoutMs ?? 400,
    longMs: options.longMs ?? VOICE_CONFIG.longSilenceTimeoutMs ?? 900,
    finalMs: options.finalMs ?? VOICE_CONFIG.finalSilenceTimeoutMs ?? 1500,
    minSpeechMs: options.minSpeechMs ?? VOICE_CONFIG.minimumSpeechDuration ?? 250,
    interruptThreshold: options.interruptThreshold ?? VOICE_CONFIG.interruptThreshold ?? 0.55,
    debug: Boolean(options.debug ?? VOICE_CONFIG.debug),
  }

  let speaking = false
  let speechStartedAt = 0
  let shortTimer = null
  let longTimer = null
  let finalTimer = null
  const listeners = new Set()

  function emit(event, payload = {}) {
    if (cfg.debug && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.debug('[BachAI eos]', event, payload)
    }
    listeners.forEach((fn) => {
      try {
        fn(event, payload)
      } catch {
        /* ignore */
      }
    })
  }

  function clearTimers() {
    ;[shortTimer, longTimer, finalTimer].forEach((id) => {
      if (id) window.clearTimeout(id)
    })
    shortTimer = longTimer = finalTimer = null
    emit('timer_cancelled')
  }

  function armTimers() {
    clearTimers()
    emit('timer_armed', { shortMs: cfg.shortMs, longMs: cfg.longMs, finalMs: cfg.finalMs })
    shortTimer = window.setTimeout(() => emit('silence', { level: EOS_LEVEL.SHORT }), cfg.shortMs)
    longTimer = window.setTimeout(() => emit('silence', { level: EOS_LEVEL.LONG }), cfg.longMs)
    finalTimer = window.setTimeout(() => {
      speaking = false
      emit('silence', { level: EOS_LEVEL.FINAL })
      emit('end_of_speech')
    }, cfg.finalMs)
  }

  return {
    onEvent(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    /** Feed RMS / energy 0–1 from local VAD. */
    ingestEnergy(level) {
      const energy = Number(level) || 0
      if (energy >= cfg.interruptThreshold) {
        if (!speaking) {
          speaking = true
          speechStartedAt = Date.now()
          emit('speech_started', { energy })
        } else {
          emit('speech_continued', { energy })
        }
        armTimers()
        return
      }
      if (speaking) {
        const elapsed = Date.now() - speechStartedAt
        if (elapsed < cfg.minSpeechMs) {
          // Blip — ignore
          return
        }
        // Silence path handled by timers already armed
      }
    },
    markSpeech() {
      speaking = true
      speechStartedAt = Date.now()
      emit('speech_started')
      armTimers()
    },
    forceFinal() {
      clearTimers()
      speaking = false
      emit('silence', { level: EOS_LEVEL.FINAL })
      emit('end_of_speech')
    },
    reset() {
      clearTimers()
      speaking = false
      speechStartedAt = 0
    },
    isSpeaking: () => speaking,
  }
}

export default createEndOfSpeechController
