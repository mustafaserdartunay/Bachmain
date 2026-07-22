import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import QRCode from 'qrcode'

export default function ProductionStageQrModal({
  open,
  onClose,
  jobId = '',
  lineItemId = '',
  stageId = '',
  stageLabel = '',
}) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const payload = JSON.stringify({
      type: 'bachmain-production-stage',
      jobId,
      lineItemId,
      stageId,
      stageLabel,
      path: `/uretim/${jobId}?line=${lineItemId}&stage=${stageId}`,
    })
    let cancelled = false
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [open, jobId, lineItemId, stageId, stageLabel])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-[18px] border border-[var(--border,#E2E8F0)] bg-white p-5 shadow-[0_24px_64px_rgba(15,23,42,0.2)] dark:bg-[var(--surface,#0F172A)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Süreç QR kodu"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-[var(--muted,#64748B)]">
              Süreç QR
            </p>
            <h3 className="text-[16px] font-black text-[var(--ink,#0F172A)]">
              {stageLabel || 'Süreç'}
            </h3>
            <p className="mt-0.5 text-[12px] font-semibold text-[var(--muted,#64748B)]">
              Mobilde okutunca bu sürece açılır
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] p-2 text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-center rounded-[14px] bg-[var(--surface-raised,#F8FAFC)] p-4">
          {dataUrl ? (
            <img src={dataUrl} alt={`${stageLabel} QR`} className="h-[220px] w-[220px]" />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center text-[13px] font-semibold text-[var(--muted)]">
              QR hazırlanıyor…
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-[11px] font-semibold tabular-nums text-[var(--muted)]">
          {jobId} · {stageId}
        </p>
      </div>
    </div>
  )
}
