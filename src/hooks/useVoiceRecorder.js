import { useCallback, useEffect, useRef, useState } from 'react'
import { checkVoiceApiHealth, transcribeVoiceBlob } from '../utils/voiceApi'
import { getClientOpenAiApiKey } from '../utils/voiceSettings'

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function stopStream(stream) {
  stream?.getTracks?.().forEach((track) => track.stop())
}

export default function useVoiceRecorder({ onResult, maxDurationMs = 90000 } = {}) {
  const onResultRef = useRef(onResult)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const mimeTypeRef = useRef('audio/webm')
  const stopTimerRef = useRef(null)
  const activeRef = useRef(false)

  const [supported, setSupported] = useState(false)
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  onResultRef.current = onResult

  useEffect(() => {
    const ok = Boolean(
      typeof navigator !== 'undefined'
      && navigator.mediaDevices?.getUserMedia
      && typeof MediaRecorder !== 'undefined',
    )
    setSupported(ok)
    mimeTypeRef.current = pickRecorderMimeType()

    return () => {
      activeRef.current = false
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
      try {
        recorderRef.current?.stop()
      } catch {
        // noop
      }
      stopStream(streamRef.current)
      streamRef.current = null
      recorderRef.current = null
    }
  }, [])

  const transcribeChunks = useCallback(async () => {
    const chunks = chunksRef.current
    chunksRef.current = []

    if (!chunks.length) {
      setError('Ses algılanmadı. Tekrar deneyin.')
      return
    }

    const mimeType = mimeTypeRef.current || 'audio/webm'
    const blob = new Blob(chunks, { type: mimeType })

    if (blob.size < 800) {
      setError('Ses çok kısa. Biraz daha konuşup tekrar deneyin.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const result = await transcribeVoiceBlob(blob, mimeType)
      const text = String(result?.text || '').trim()
      if (!text) {
        setError('Konuşma anlaşılamadı. Tekrar deneyin.')
        return
      }
      await onResultRef.current?.(text)
    } catch (transcribeError) {
      setError(transcribeError.message || 'Ses tanıma başarısız.')
    } finally {
      setProcessing(false)
    }
  }, [])

  const stop = useCallback(() => {
    activeRef.current = false
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }

    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setRecording(false)
      return
    }

    recorder.onstop = async () => {
      setRecording(false)
      stopStream(streamRef.current)
      streamRef.current = null
      recorderRef.current = null
      await transcribeChunks()
    }

    try {
      recorder.stop()
    } catch {
      setRecording(false)
    }
  }, [transcribeChunks])

  const start = useCallback(async () => {
    if (!supported || recording || processing) return

    const apiKey = getClientOpenAiApiKey()
    try {
      const health = await checkVoiceApiHealth()
      if (!health?.hasApiKey && !apiKey) {
        setError('OpenAI API anahtarı eksik. Ayarlar > Sesli AI bölümünden sk-... anahtarını girin veya .env dosyası oluşturun.')
        return
      }
    } catch {
      setError('Sesli asistan sunucusuna ulaşılamıyor. npm run dev çalışıyor mu?')
      return
    }

    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const mimeType = pickRecorderMimeType()
      mimeTypeRef.current = mimeType || 'audio/webm'
      chunksRef.current = []

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onerror = () => {
        activeRef.current = false
        setRecording(false)
        setError('Ses kaydı sırasında hata oluştu.')
        stopStream(stream)
      }

      streamRef.current = stream
      recorderRef.current = recorder
      activeRef.current = true
      recorder.start(250)
      setRecording(true)

      stopTimerRef.current = window.setTimeout(() => {
        if (activeRef.current) stop()
      }, maxDurationMs)
    } catch (mediaError) {
      activeRef.current = false
      setRecording(false)

      if (mediaError?.name === 'NotAllowedError') {
        setError('Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.')
      } else if (mediaError?.name === 'NotFoundError') {
        setError('Mikrofon bulunamadı.')
      } else {
        setError(mediaError?.message || 'Mikrofon açılamadı.')
      }
    }
  }, [maxDurationMs, processing, recording, stop, supported])

  const toggle = useCallback(() => {
    if (recording) stop()
    else start()
  }, [recording, start, stop])

  return {
    supported,
    recording,
    processing,
    listening: recording || processing,
    error,
    start,
    stop,
    toggle,
    clearError: () => setError(''),
  }
}
