import { useNavigate } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import ProductionStagePhotoGallery from './ProductionStagePhotoGallery'

function stageStatusMeta(step) {
  if (step.isCancelled) return { label: 'İptal', className: 'bg-red-50 text-red-600' }
  if (step.isError) return { label: 'Problem', className: 'bg-orange-50 text-orange-600' }
  if (step.isActive) return { label: 'Devam Ediyor', className: 'bg-blue-50 text-blue-600' }
  if (step.isComplete) return { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-600' }
  return { label: 'Beklemede', className: 'bg-slate-50 text-slate-500' }
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
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-8 text-center">
        <p className="text-[13px] font-semibold text-[#64748B]">Henüz üretim süreci tanımlanmamış.</p>
        <button
          type="button"
          onClick={() => navigate('/ayarlar/etiketler')}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-2 text-[12px] font-bold text-white"
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
        <h4 className="text-[13px] font-black uppercase tracking-wide text-[#64748B]">Süreç Detayları</h4>
        {showEditProcesses ? (
          <button
            type="button"
            onClick={() => navigate('/ayarlar/etiketler')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#64748B] hover:border-blue-300 hover:text-blue-600"
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

          return (
            <article
              key={step.id}
              className="w-[200px] shrink-0 rounded-[14px] border border-[#E2E8F0] bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onStageClick?.(step.id)}
                  className={`min-w-0 text-left ${clickable ? 'hover:opacity-80' : ''}`}
                  title={clickable ? `${step.label} aşamasına al` : step.label}
                >
                  <p className="text-[12px] font-black text-[#0F172A]">
                    <span className="text-[#94A3B8]">{index + 1}</span>{' '}
                    {step.label}
                  </p>
                </button>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <p className="mb-2 text-[12px] font-semibold text-[#64748B]">
                Adet: <span className="tabular-nums font-bold text-[#0F172A]">{producedLabel || '—'}</span>
              </p>

              <ProductionStagePhotoGallery
                stageId={step.id}
                stageLabel={step.label}
                allPhotos={stagePhotos}
                readOnly={readOnly}
                onPhotosChange={onPhotosChange}
              />
            </article>
          )
        })}
      </div>
    </div>
  )
}
