/**
 * Bach AI V2 — thin React hook for local wake-word + privacy UI state.
 * Does not stream audio to the cloud while IDLE / listening for wake.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createWakeWordController } from './wakeWord'
import { WAKE_STATES } from './config'

export function useBachWakeWord({ enabled = false, onCommandReady, onWake } = {}) {
  const [state, setState] = useState(WAKE_STATES.IDLE)
  const [listeningBadge, setListeningBadge] = useState(false)
  const controllerRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.stop?.()
      setState(WAKE_STATES.IDLE)
      setListeningBadge(false)
      return undefined
    }

    const ctrl = createWakeWordController()
    controllerRef.current = ctrl
    const off = ctrl.onEvent((event, payload) => {
      if (event === 'state') {
        setState(payload.state)
        setListeningBadge(
          payload.state === WAKE_STATES.LISTENING_FOR_WAKE_WORD ||
            payload.state === WAKE_STATES.LISTENING_COMMAND ||
            payload.state === WAKE_STATES.WAKE_DETECTED,
        )
      }
      if (event === 'wake_detected') onWake?.(payload)
      if (event === 'final_silence') {
        ctrl.markProcessing()
        onCommandReady?.()
      }
    })
    ctrl.startListeningForWake()
    return () => {
      off()
      ctrl.stop()
    }
  }, [enabled, onCommandReady, onWake])

  const ingestTranscript = useCallback((text, opts) => {
    return controllerRef.current?.ingestTranscript(text, opts) || { wake: false }
  }, [])

  return {
    state,
    listeningBadge,
    ingestTranscript,
    complete: () => controllerRef.current?.complete?.(),
    fail: (msg) => controllerRef.current?.fail?.(msg),
    stop: () => controllerRef.current?.stop?.(),
  }
}

export default useBachWakeWord
