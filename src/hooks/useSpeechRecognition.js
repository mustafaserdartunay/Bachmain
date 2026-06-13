import { useCallback, useEffect, useRef, useState } from 'react'

const ERROR_MESSAGES = {
  'not-allowed': 'Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.',
  'service-not-allowed': 'Mikrofon kullanılamıyor. HTTPS veya localhost gerekir.',
  'no-speech': 'Ses algılanmadı. Tekrar deneyin.',
  network: 'Konuşma tanıma ağına ulaşılamadı.',
  aborted: '',
}

export default function useSpeechRecognition({ lang = 'tr-TR', onResult, continuous = true } = {}) {
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  const wantsListeningRef = useRef(false)
  const listeningRef = useRef(false)
  const restartTimerRef = useRef(null)

  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState('')

  onResultRef.current = onResult

  const setListeningState = useCallback((value) => {
    listeningRef.current = value
    setListening(value)
  }, [])

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
  }, [])

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition || listeningRef.current) return

    setError('')
    setTranscript('')
    setInterimTranscript('')

    try {
      recognition.start()
    } catch (startError) {
      if (String(startError?.message || '').includes('already started')) return
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null
        if (wantsListeningRef.current && !listeningRef.current) {
          startRecognition()
        }
      }, 280)
    }
  }, [])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(Boolean(SpeechRecognition))
    if (!SpeechRecognition) return undefined

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setListeningState(true)
      setError('')
    }

    recognition.onend = () => {
      setListeningState(false)
      if (!wantsListeningRef.current) return
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null
        if (wantsListeningRef.current) startRecognition()
      }, 180)
    }

    recognition.onerror = (event) => {
      const code = event?.error || 'unknown'
      if (code === 'aborted') return

      if (code === 'no-speech') {
        if (wantsListeningRef.current) {
          restartTimerRef.current = window.setTimeout(() => {
            restartTimerRef.current = null
            if (wantsListeningRef.current) startRecognition()
          }, 220)
        }
        return
      }

      wantsListeningRef.current = false
      setListeningState(false)
      setError(ERROR_MESSAGES[code] || `Mikrofon hatası: ${code}`)
    }

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const part = event.results[index][0]?.transcript || ''
        if (event.results[index].isFinal) finalText += part
        else interimText += part
      }

      if (interimText) setInterimTranscript(interimText.trim())

      if (finalText.trim()) {
        const clean = finalText.trim()
        setTranscript(clean)
        setInterimTranscript('')
        onResultRef.current?.(clean)
      }
    }

    recognitionRef.current = recognition

    return () => {
      wantsListeningRef.current = false
      clearRestartTimer()
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      try {
        recognition.stop()
      } catch {
        // noop
      }
      recognitionRef.current = null
    }
  }, [clearRestartTimer, continuous, lang, setListeningState, startRecognition])

  const start = useCallback(() => {
    wantsListeningRef.current = true
    startRecognition()
  }, [startRecognition])

  const stop = useCallback(() => {
    wantsListeningRef.current = false
    clearRestartTimer()
    setListeningState(false)
    try {
      recognitionRef.current?.stop()
    } catch {
      // noop
    }
  }, [clearRestartTimer, setListeningState])

  const toggle = useCallback(() => {
    if (wantsListeningRef.current) stop()
    else start()
  }, [start, stop])

  return {
    supported,
    listening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    toggle,
    setTranscript,
    clearError: () => setError(''),
  }
}
