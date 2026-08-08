import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import useVoiceRecorder from '../../hooks/useVoiceRecorder'
import { parseCustomerVoiceCommand } from '../../utils/parseCustomerVoiceCommand'
import { sendVoiceChat } from '../../utils/voiceApi'
import { resolveAiTaskModel } from '../../utils/aiModelRouter'
import {
  buildCustomerVoiceContext,
  executeVoiceActions,
} from '../../utils/voiceActions'
import { YF_TEXT_CLASS } from '../../utils/dashboardDesign'

const MIC_IDLE_CLASS =
  'customer-voice-mic inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-transparent text-[var(--muted)] transition-[background-color,color] hover:bg-[rgba(37,99,235,0.16)] hover:text-blue-600'

const MIC_LIVE_CLASS =
  'customer-voice-mic inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 transition-[background-color,color]'

/**
 * Row mic at the start of the cari name — OpenAI Whisper + Luna CRM.
 */
export function CustomerColumnVoiceMic({
  customerId,
  active = false,
  listening = false,
  processing = false,
  disabled = false,
  onStart,
  title = 'Sesli cari işlem (mikrofon)',
}) {
  return (
    <button
      type="button"
      data-row-voice={customerId || undefined}
      className={listening || active ? MIC_LIVE_CLASS : MIC_IDLE_CLASS}
      title={title}
      aria-label={title}
      disabled={disabled || (processing && !active)}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onStart?.(customerId)
      }}
    >
      {processing && active ? (
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
  recording,
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
        className={`relative flex h-2.5 w-2.5 shrink-0 ${listening || recording ? '' : 'opacity-40'}`}
      >
        {listening || recording ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            error ? 'bg-rose-500' : listening || recording ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
        />
      </span>
      <p className={`min-w-0 flex-1 ${YF_TEXT_CLASS}`}>
        {error
          || message
          || (processing
            ? 'OpenAI · ses yazıya çevriliyor / Luna komutu işliyor…'
            : recording
              ? `${customerLabel || 'Müşteri'} · Kaydediliyor — bitince mikrofona tekrar basın (örn. “beş bin lira tahsilat yap, ön ödeme alındı”)`
              : '')}
        {(interim || transcript) && !error ? (
          <span className="mt-0.5 block truncate text-[12px] text-[var(--ink)]">
            “{interim || transcript}”
          </span>
        ) : null}
      </p>
      {recording ? (
        <button
          type="button"
          onClick={onStop}
          className={`${YF_TEXT_CLASS} rounded-lg px-2 py-1 hover:bg-rose-500/10 hover:text-rose-600`}
        >
          Bitir
        </button>
      ) : null}
    </div>
  )
}

/**
 * Manages OpenAI voice session scoped to a customer row.
 * STT: existing OpenAI transcribe · CRM intent: Luna.
 */
export function useCustomerListVoice({ onCommand, onSettled } = {}) {
  const navigate = useNavigate()
  const customerRef = useRef(null)
  const handledRef = useRef(false)
  const [activeCustomerId, setActiveCustomerId] = useState(null)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [sessionError, setSessionError] = useState('')
  const [activeCustomerLabel, setActiveCustomerLabel] = useState('')
  const [transcript, setTranscript] = useState('')

  const runLocalCommand = useCallback(
    async (customer, text) => {
      const parsed = parseCustomerVoiceCommand(text)
      if (!parsed.ok) return false

      setMessage(
        parsed.action === 'payment'
          ? `Ödeme hazırlanıyor · ${parsed.amount} ₺`
          : `Tahsilat hazırlanıyor · ${parsed.amount} ₺`,
      )
      await onCommand?.({ customer, parsed, transcript: text })
      setMessage(
        parsed.action === 'payment'
          ? `Ödeme uygulandı · ${parsed.amount} ₺`
          : `Tahsilat uygulandı · ${parsed.amount} ₺`,
      )
      return true
    },
    [onCommand],
  )

  const runLunaCommand = useCallback(
    async (customer, text) => {
      setMessage('Luna · CRM komutu çözülüyor…')
      const context = await buildCustomerVoiceContext(customer, '/musteriler')
      const result = await sendVoiceChat({
        messages: [{ role: 'user', content: text }],
        context,
        model: resolveAiTaskModel('crm'),
      })

      const actions = Array.isArray(result.actions) ? result.actions : []
      if (!actions.length) {
        setSessionError(result.message || 'Komut anlaşılamadı. Örn: “beş bin lira tahsilat yap”.')
        return
      }

      const logs = await executeVoiceActions(actions, navigate)
      setMessage(result.message || logs[0] || 'İşlem tamamlandı.')
      onSettled?.({ customer, actions, logs, reply: result.message })
    },
    [navigate, onSettled],
  )

  const handleTranscript = useCallback(
    async (text) => {
      const clean = String(text || '').trim()
      const customer = customerRef.current
      if (!clean || !customer || handledRef.current) return

      handledRef.current = true
      setAiProcessing(true)
      setSessionError('')
      setTranscript(clean)
      setMessage(`Algılandı: “${clean}”`)

      try {
        const localOk = await runLocalCommand(customer, clean)
        if (!localOk) {
          await runLunaCommand(customer, clean)
        }
      } catch (error) {
        handledRef.current = false
        setSessionError(error?.message || 'Sesli işlem başarısız.')
      } finally {
        setAiProcessing(false)
        setActiveCustomerId(null)
      }
    },
    [runLocalCommand, runLunaCommand],
  )

  const recorder = useVoiceRecorder({
    onResult: handleTranscript,
    maxDurationMs: 45000,
  })

  const stop = useCallback(() => {
    recorder.stop()
    if (!recorder.processing && !aiProcessing) {
      setActiveCustomerId(null)
    }
  }, [aiProcessing, recorder])

  const startForCustomer = useCallback(
    (customer) => {
      if (!customer) {
        setSessionError('Sesli işlem için müşteri satırı gerekli.')
        return
      }

      const sameRow = customerRef.current?.id === customer.id
      if (recorder.recording && sameRow) {
        recorder.stop()
        return
      }

      if (recorder.recording) {
        recorder.stop()
      }

      if (!recorder.supported) {
        setSessionError('Bu tarayıcıda mikrofon kaydı yok. Chrome ile deneyin.')
        return
      }

      handledRef.current = false
      customerRef.current = customer
      setActiveCustomerLabel(
        customer.company || customer.companyTitle || customer.name || 'Müşteri',
      )
      setActiveCustomerId(customer.id)
      setSessionError('')
      setMessage('')
      setTranscript('')
      recorder.clearError?.()
      recorder.start()
    },
    [recorder],
  )

  useEffect(() => {
    if (recorder.error) setSessionError(recorder.error)
  }, [recorder.error])

  return {
    supported: recorder.supported,
    listening: recorder.listening || aiProcessing,
    recording: recorder.recording,
    processing: recorder.processing || aiProcessing,
    interim: '',
    transcript,
    error: sessionError,
    message,
    activeCustomerId,
    activeCustomerLabel,
    startForCustomer,
    stop,
    setSessionError,
  }
}

export default CustomerColumnVoiceMic
