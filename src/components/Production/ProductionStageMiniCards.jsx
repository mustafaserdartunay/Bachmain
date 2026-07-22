import { useRef, useState } from 'react'
import { Camera, FileText, NotebookPen, QrCode, Settings2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProductionStagePhotoGallery from './ProductionStagePhotoGallery'
import ProductionStageQrModal from './ProductionStageQrModal'

function stageStatusMeta(step) {
  if (step.isCancelled) return { label: 'İptal', className: 'bg-red-50 text-red-600' }
  if (step.isError) return { label: 'Problem', className: 'bg-orange-50 text-orange-600' }
  if (step.isActive) return { label: 'Devam Ediyor', className: 'bg-blue-50 text-blue-600' }
  if (step.isComplete) return { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-600' }
  return { label: 'Bekliyor', className: 'bg-slate-50 text-slate-500' }
}

function ActionIcon({ title, onClick, disabled, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)] transition duration-200 hover:scale-110 hover:border-blue-300 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export default function ProductionStageMiniCards({
  steps = [],
  stagePhotos = [],
  producedLabel = '',
  readOnly = false,
  jobId = '',
  lineItemId = '',
  onStageClick,
  onPhotosChange,
  onStageNote,
  showEditProcesses = true,
}) {
  const navigate = useNavigate()
  const noteRef = useRef(null)
  const [qrStage, setQrStage] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteStage, setNoteStage] = useState(null)

  if (!steps.length) {
    return (
      <div className="rounded-[18px] border border-dashed border-[var(--border,#CBD5E1)] bg-[var(--surface-raised,#F8FAFC)] px-4 py-8 text-center">
        <p className="text-[13px] font-semibold text-[var(--muted,#64748B)]">
          Henüz üretim süreci tanımlanmamış.
        </p>
        <button
          type="button"
          onClick={() => navigate('/ayarlar/etiketler')}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent,#2563EB)] px-3 py-2 text-[12px] font-bold text-white"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Süreçleri Düzenle
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[13px] font-black uppercase tracking-wide text-[var(--muted,#64748B)]">
          Süreç Detayları
        </h4>
        {showEditProcesses ? (
          <button
            type="button"
            onClick={() => navigate('/ayarlar/etiketler')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border,#E2E8F0)] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[var(--muted,#64748B)] hover:border-blue-300 hover:text-blue-600"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Süreçleri Düzenle
          </button>
        ) : null}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const status = stageStatusMeta(step)
          const clickable = !readOnly && typeof onStageClick === 'function'
          const ringClass = step.isComplete
            ? 'ring-emerald-200'
            : step.isActive
              ? 'ring-blue-200'
              : 'ring-transparent'

          return (
            <article
              key={step.id}
              className={`w-[220px] shrink-0 rounded-[18px] border border-[var(--border,#E2E8F0)] bg-white/90 p-3 shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition duration-300 hover:scale-[1.015] hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-2 ${ringClass}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onStageClick?.(step.id)}
                  className={`min-w-0 text-left ${clickable ? 'hover:opacity-80' : ''}`}
                  title={clickable ? `${step.label} aşamasına al` : step.label}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${
                        step.isComplete
                          ? 'bg-emerald-500'
                          : step.isActive
                            ? 'bg-[var(--accent,#2563EB)]'
                            : 'bg-slate-300'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className="truncate text-[12px] font-black text-[var(--ink,#0F172A)]">
                      {step.label}
                    </p>
                  </div>
                </button>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <p className="mb-2 text-[12px] font-semibold text-[var(--muted,#64748B)]">
                Adet:{' '}
                <span className="tabular-nums font-bold text-[var(--ink,#0F172A)]">
                  {producedLabel || '—'}
                </span>
              </p>

              <ProductionStagePhotoGallery
                stageId={step.id}
                stageLabel={step.label}
                allPhotos={stagePhotos}
                readOnly={readOnly}
                onPhotosChange={onPhotosChange}
              />

              <div className="mt-2 flex items-center justify-center gap-1.5">
                <ActionIcon
                  title="Fotoğraf"
                  disabled={readOnly}
                  onClick={() => document.getElementById(`prod-stage-cam-${step.id}`)?.click()}
                >
                  <Camera className="h-3.5 w-3.5" />
                </ActionIcon>
                <ActionIcon
                  title="Not"
                  disabled={readOnly}
                  onClick={() => {
                    setNoteStage(step)
                    setNoteDraft('')
                    window.setTimeout(() => noteRef.current?.focus(), 40)
                  }}
                >
                  <NotebookPen className="h-3.5 w-3.5" />
                </ActionIcon>
                <ActionIcon
                  title="Dosya"
                  disabled={readOnly}
                  onClick={() => window.alert('Belge yükleme yakında.')}
                >
                  <FileText className="h-3.5 w-3.5" />
                </ActionIcon>
                <ActionIcon title="QR" onClick={() => setQrStage(step)}>
                  <QrCode className="h-3.5 w-3.5" />
                </ActionIcon>
                <ActionIcon
                  title="Sil / Sıfırla"
                  disabled={readOnly || !step.isComplete}
                  onClick={() => onStageClick?.(steps[Math.max(0, index - 1)]?.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionIcon>
              </div>
            </article>
          )
        })}
      </div>

      {noteStage ? (
        <div className="rounded-[18px] border border-[var(--border)] bg-white p-3 shadow-sm">
          <p className="mb-2 text-[12px] font-black text-[var(--ink)]">{noteStage.label} notu</p>
          <textarea
            ref={noteRef}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            rows={3}
            className="form-input w-full text-[13px]"
            placeholder="Operatör, makine, vardiya veya kalite notu…"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-[var(--muted)]"
              onClick={() => setNoteStage(null)}
            >
              Vazgeç
            </button>
            <button
              type="button"
              className="rounded-lg bg-[var(--accent,#2563EB)] px-3 py-1.5 text-[12px] font-bold text-white"
              onClick={() => {
                onStageNote?.(noteStage.id, noteDraft)
                setNoteStage(null)
              }}
            >
              Kaydet
            </button>
          </div>
        </div>
      ) : null}

      <ProductionStageQrModal
        open={Boolean(qrStage)}
        onClose={() => setQrStage(null)}
        jobId={jobId}
        lineItemId={lineItemId}
        stageId={qrStage?.id || ''}
        stageLabel={qrStage?.label || ''}
      />
    </div>
  )
}
