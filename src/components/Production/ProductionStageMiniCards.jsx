import ProductionStagePhotoGallery from './ProductionStagePhotoGallery'
import { stageAllowsPhotos } from '../../utils/productionStagePhotos'

function stageStatusMeta(step) {
  if (step.isCancelled) return { label: 'İptal', className: 'bg-red-500/15 text-red-600' }
  if (step.isError) return { label: 'Problem', className: 'bg-orange-500/15 text-orange-600' }
  if (step.isActive) return { label: 'Devam Ediyor', className: 'bg-blue-500/15 text-blue-600' }
  if (step.isComplete) return { label: 'Tamamlandı', className: 'bg-emerald-500/15 text-emerald-600' }
  return { label: 'Bekliyor', className: 'bg-slate-500/10 text-slate-500' }
}

export default function ProductionStageMiniCards({
  steps = [],
  stagePhotos = [],
  producedLabel = '',
  readOnly = false,
  onStageClick,
  onPhotosChange,
}) {
  if (!steps.length) {
    return (
      <p className="text-[13px] font-semibold text-[var(--muted)]">Süreç kartı yok.</p>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {steps.map((step) => {
        const status = stageStatusMeta(step)
        const allowsPhotos = stageAllowsPhotos(step.label)
        const clickable = !readOnly && typeof onStageClick === 'function'

        return (
          <article
            key={step.id}
            className="w-[200px] shrink-0 rounded-2xl border border-[var(--border)] bg-white/70 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStageClick?.(step.id)}
                className={`min-w-0 text-left text-[14px] font-bold uppercase tracking-wide text-[var(--ink)] ${
                  clickable ? 'hover:text-[var(--bach-navy,#203375)]' : ''
                }`}
              >
                {step.label}
              </button>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${status.className}`}>
                {status.label}
              </span>
            </div>

            {producedLabel ? (
              <p className="mb-2 text-[12px] font-semibold text-[var(--muted)]">
                Adet: <span className="tabular-nums text-[var(--ink)]">{producedLabel}</span>
              </p>
            ) : null}

            {allowsPhotos ? (
              <ProductionStagePhotoGallery
                stageId={step.id}
                stageLabel={step.label}
                allPhotos={stagePhotos}
                readOnly={readOnly}
                onPhotosChange={onPhotosChange}
              />
            ) : (
              <p className="text-[12px] text-[var(--muted)]">Fotoğraf gerekmiyor</p>
            )}
          </article>
        )
      })}
    </div>
  )
}
