import { useNavigate } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import ProductionStagePhotoGallery from './ProductionStagePhotoGallery'
import { stageAllowsPhotos } from '../../utils/productionStagePhotos'

function stageStatusMeta(step) {
  if (step.isCancelled) return { label: 'İptal', className: 'bg-red-500/12 text-red-600 ring-red-500/15' }
  if (step.isError) return { label: 'Problem', className: 'bg-orange-500/12 text-orange-600 ring-orange-500/15' }
  if (step.isActive) return { label: 'Devam Ediyor', className: 'bg-blue-500/12 text-blue-600 ring-blue-500/20' }
  if (step.isComplete) return { label: 'Tamamlandı', className: 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/20' }
  return { label: 'Bekliyor', className: 'bg-slate-500/10 text-slate-500 ring-slate-400/15' }
}

function cardTone(step) {
  if (step.isActive) return 'border-blue-400/35 shadow-[0_10px_28px_rgba(59,130,246,0.10)]'
  if (step.isComplete) return 'border-emerald-400/30 shadow-[0_10px_28px_rgba(16,185,129,0.08)]'
  return 'border-[rgba(140,145,165,0.22)] shadow-[0_8px_22px_rgba(15,23,42,0.04)]'
}

export default function ProductionStageMiniCards({
  steps = [],
  stagePhotos = [],
  producedLabel = '',
  readOnly = false,
  onStageClick,
  onPhotosChange,
  showEditProcesses = true,
}) {
  const navigate = useNavigate()

  if (!steps.length) {
    return (
      <p className="text-[13px] font-semibold text-[var(--muted)]">Süreç kartı yok.</p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[14px] font-bold text-[var(--ink)]">Süreç Detayları</h4>
        {showEditProcesses ? (
          <button
            type="button"
            onClick={() => navigate('/ayarlar/etiketler')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(140,145,165,0.22)] bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--muted)] transition-colors hover:border-blue-400/35 hover:text-blue-600"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Süreçleri Düzenle
          </button>
        ) : null}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((step, index) => {
          const status = stageStatusMeta(step)
          const allowsPhotos = stageAllowsPhotos(step.label)
          const clickable = !readOnly && typeof onStageClick === 'function'
          const pending = !step.isComplete && !step.isActive

          return (
            <article
              key={step.id}
              className={`w-[210px] shrink-0 rounded-2xl border bg-white/90 p-3 transition-transform hover:-translate-y-0.5 ${cardTone(step)} ${
                pending ? 'bg-[#fbfbfc]' : ''
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onStageClick?.(step.id)}
                  className={`min-w-0 text-left ${clickable ? 'hover:opacity-80' : ''}`}
                >
                  <p className="text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">
                    {index + 1}.
                  </p>
                  <p className="truncate text-[14px] font-bold text-[var(--ink)]">{step.label}</p>
                </button>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${status.className}`}>
                  {status.label}
                </span>
              </div>

              {producedLabel ? (
                <p className="mb-2 text-[12px] font-semibold text-[var(--muted)]">
                  Adet: <span className="tabular-nums font-bold text-[var(--ink)]">{producedLabel}</span>
                </p>
              ) : (
                <p className="mb-2 text-[12px] font-semibold text-[var(--muted)]">Adet: —</p>
              )}

              {allowsPhotos ? (
                <ProductionStagePhotoGallery
                  stageId={step.id}
                  stageLabel={step.label}
                  allPhotos={stagePhotos}
                  readOnly={readOnly}
                  onPhotosChange={onPhotosChange}
                  compactCard
                />
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-[rgba(140,145,165,0.28)] bg-[#f7f8fa] text-[12px] font-semibold text-[var(--muted)]">
                  Fotoğraf gerekmiyor
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
