import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import useSpeechRecognition from '../../hooks/useSpeechRecognition'
import { parseCustomerVoiceCommand } from '../../utils/parseCustomerVoiceCommand'
import { YF_TEXT_CLASS } from '../../utils/dashboardDesign'

const MIC_IDLE_CLASS =
  'customer-voice-mic inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-transparent text-[var(--muted)] transition-[background-color,color] hover:bg-[rgba(37,99,235,0.16)] hover:text-blue-600'

const MIC_LIVE_CLASS =
  'customer-voice-mic inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 transition-[background-color,color]'

/**
 * Column-header mic: starts listening immediately for the active (hovered/selected) customer.
 */
export function CustomerColumnVoiceMic({
  columnId,
  active = false,
  listening = false,
  processing = false,
  disabled = false,
  onStart,
  title = 'Sesli işlem',
}) {
  return (
    <button
      type="button"
      data-column-voice={columnId}
      className={listening || active ? MIC_LIVE_CLASS : MIC_IDLE_CLASS}
      title={title}
      aria-label={title}
      disabled={disabled || processing}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onStart?.(columnId)
      }}
    >
      {processing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
      ) : listening ? (
        <MicOff className="h-3.5 w-3.5" strokeWidth={2.25} />
      ) : (
        <Mic className="h-3.5 w-3.5" strokeWidth={2.25} />
      )}
    </button>
  )
}

export function CustomerVoiceStatusBar({
  customerLabel,
  listening,
  processing,
  interim,
  transcript,
  message,
  error,
  onStop,
}) {
  if (!listening && !processing && !message && !error && !interim && !transcript) {
    return null
  }

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-2 rounded-[16px] border border-[rgba(255,255,255,0.62)] bg-[rgba(255,255,255,0.38)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] backdrop-blur-[16px]"
      role="status"
      aria-live="polite"
    >
      <span
        className={`relative flex h-2.5 w-2.5 shrink-0 ${listening ? '' : 'opacity-40'}`}
      >
        {listening ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            error ? 'bg-rose-500' : listening ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
        />
      </span>
      <p className={`min-w-0 flex-1 ${YF_TEXT_CLASS}`}>
        {error
          || message
          || (processing
            ? 'Komut işleniyor…'
            : listening
              ? `${customerLabel || 'Müşteri'} · Dinleniyor — örn. “beş bin lira tahsilat yap, ön ödeme alındı”`
              : '')}
        {(interim || transcript) && !error ? (
          <span className="mt-0.5 block truncate text-[12px] text-[var(--ink)]">
            “{interim || transcript}”
          </span>
        ) : null}
      </p>
      {listening ? (
        <button
          type="button"
          onClick={onStop}
          className={`${YF_TEXT_CLASS} rounded-lg px-2 py-1 hover:bg-rose-500/10 hover:text-rose-600`}
        >
          Durdur
        </button>
      ) : null}
    </div>
  )
}

/**
 * Manages speech session scoped to a customer row.
 */
export function useCustomerListVoice({ resolveCustomer, onCommand }) {
  const customerRef = useRef(null)
  const settleTimerRef = useRef(null)
  const handledRef = useRef(false)
  const speechStopRef = useRef(null)
  const [activeColumnId, setActiveColumnId] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [sessionError, setSessionError] = useState('')
  const [activeCustomerLabel, setActiveCustomerLabel] = useState('')

  const handleFinal = useCallback(
    async (text) => {
      if (handledRef.current || processing) return
      const customer = customerRef.current
      if (!customer) {
        setSessionError('Önce bir müşteri satırının üzerine gelin veya satırı seçin.')
        return
      }

      const parsed = parseCustomerVoiceCommand(text)
      if (!parsed.ok) {
        setSessionError(parsed.error || 'Komut anlaşılamadı.')
        return
      }

      handledRef.current = true
      setProcessing(true)
      setSessionError('')
      setMessage(
        parsed.action === 'payment'
          ? `Ödeme hazırlanıyor · ${parsed.amount} ₺`
          : `Tahsilat hazırlanıyor · ${parsed.amount} ₺`,
      )

      try {
        await onCommand?.({ customer, parsed, transcript: text })
        setMessage(
          parsed.action === 'payment'
            ? `Ödeme uygulandı · ${parsed.amount} ₺`
            : `Tahsilat uygulandı · ${parsed.amount} ₺`,
        )
        speechStopRef.current?.()
      } catch (error) {
        handledRef.current = false
        setSessionError(error?.message || 'İşlem başarısız.')
      } finally {
        setProcessing(false)
        setActiveColumnId(null)
      }
    },
    [onCommand, processing],
  )

  const speech = useSpeechRecognition({
    lang: 'tr-TR',
    continuous: true,
    onResult: (text) => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null
        handleFinal(text)
      }, 700)
    },
  })

  speechStopRef.current = speech.stop

  const stop = useCallback(() => {
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }
    speech.stop()
    setActiveColumnId(null)
  }, [speech])

  const startForCustomer = useCallback(
    (customer, columnId = 'name') => {
      if (!customer) {
        setSessionError('Sesli işlem için müşteri satırı gerekli.')
        return
      }
      if (!speech.supported) {
        setSessionError('Bu tarayıcıda konuşma tanıma yok. Chrome ile deneyin.')
        return
      }

      handledRef.current = false
      customerRef.current = customer
      setActiveCustomerLabel(
        customer.company || customer.companyTitle || customer.name || 'Müşteri',
      )
      setActiveColumnId(columnId)
      setSessionError('')
      setMessage('')
      speech.clearError?.()
      speech.start()
    },
    [speech],
  )

  const startFromHeader = useCallback(
    (columnId) => {
      if (speech.listening) {
        stop()
        return
      }
      const customer = resolveCustomer?.()
      startForCustomer(customer, columnId)
    },
    [resolveCustomer, speech.listening, startForCustomer, stop],
  )

  useEffect(() => {
    if (!speech.listening || handledRef.current) return undefined
    const timer = window.setTimeout(() => {
      if (!handledRef.current && speech.transcript) {
        handleFinal(speech.transcript)
      } else if (!handledRef.current) {
        stop()
        setSessionError('Süre doldu. Tekrar mikrofonu deneyin.')
      }
    }, 12000)
    return () => window.clearTimeout(timer)
  }, [handleFinal, speech.listening, speech.transcript, stop])

  useEffect(() => {
    if (handledRef.current && !processing) {
      speech.stop()
    }
  }, [processing, speech])

  useEffect(
    () => () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
      speech.stop()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return {
    supported: speech.supported,
    listening: speech.listening,
    processing,
    interim: speech.interimTranscript,
    transcript: speech.transcript,
    error: sessionError || speech.error,
    message,
    activeColumnId,
    activeCustomerLabel,
    startFromHeader,
    startForCustomer,
    stop,
    setSessionError,
  }
}

export default CustomerColumnVoiceMic
