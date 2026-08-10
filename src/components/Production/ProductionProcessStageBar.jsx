import { useMemo, useRef } from 'react'
import { Camera, Check, ImagePlus } from 'lucide-react'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
} from '../../utils/productionStagePhotos'

const STAGE_GRADIENTS = [
  HEADER_ACTION_GRADIENTS.cash,
  HEADER_ACTION_GRADIENTS.success,
  HEADER_ACTION_GRADIENTS.expense,
  HEADER_ACTION_GRADIENTS.primary,
  HEADER_ACTION_GRADIENTS.amber,
  HEADER_ACTION_GRADIENTS.violet,
  HEADER_ACTION_GRADIENTS.danger,
  HEADER_ACTION_GRADIENTS.cash,
]

function countPhotosForStage(photos, stageId) {
  return photos.filter((photo) => photo.stageId === stageId).length
}

/**
 * Full-width production stage buttons (header brand gradients) + photo status row.
 */
export default function ProductionProcessStageBar({
  steps = [],
  stagePhotos = [],
  readOnly = false,
  onStageClick,
  onPhotosChange,
}) {
  const fileRefs = useRef({})
  const normalizedPhotos = useMemo(() => normalizeStagePhotos(stagePhotos), [stagePhotos])

  if (!steps.length) {
    return (
      <p className="px-1 text-[12px] font-semibold text-[var(--muted,#64748B)]">
        Süreç tanımlanmadı
      </p>
    )
  }

  async function handleFiles(step, fileList) {
    if (readOnly || typeof onPhotosChange !== 'function') return
    const files = Array.from(fileList || []).filter((file) => file.type?.startsWith('image/'))
    if (!files.length) return
    try {
      const created = []
      for (const file of files) {
        const dataUrl = await readImageFileAsDataUrl(file)
        created.push(
          createStagePhoto({
            dataUrl,
            stageId: step.id,
            stageLabel: step.label,
          }),
        )
      }
      onPhotosChange([...normalizedPhotos, ...created])
    } catch (error) {
      window.alert(error?.message || 'Görsel yüklenemedi.')
    }
  }

  const stageGridClass =
    steps.length <= 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : steps.length <= 6
        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
        : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'

  return (
    <div className="w-full space-y-2" role="list" aria-label="Üretim süreçleri">
      <div className={`grid w-full gap-2 ${stageGridClass}`}>
        {steps.map((step, index) => {
          const gradient = STAGE_GRADIENTS[index % STAGE_GRADIENTS.length]
          const isComplete = Boolean(step.isComplete)
          const isActive = Boolean(step.isActive)
          const isError = Boolean(step.isError)
          const isCancelled = Boolean(step.isCancelled)
          const clickable = !readOnly && typeof onStageClick === 'function'

          let stateClass = 'opacity-55 saturate-75 hover:opacity-90'
          if (isCancelled) stateClass = 'opacity-40 grayscale'
          else if (isError) stateClass = 'ring-2 ring-red-400/70 ring-offset-1'
          else if (isActive) stateClass = 'opacity-100 scale-[1.02] shadow-[0_10px_24px_-10px_rgba(30,35,60,0.55)]'
          else if (isComplete) stateClass = 'opacity-100'

          return (
            <button
              key={step.id || `${step.label}-${index}`}
              type="button"
              role="listitem"
              disabled={!clickable}
              title={step.label}
              onClick={() => onStageClick?.(step.id)}
              className={`group relative flex min-h-[44px] w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br px-2 py-2 text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-all duration-300 ${
                clickable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'
              } ${stateClass} ${gradient}`}
            >
              {isActive ? (
                <span className="absolute inset-0 animate-pulse bg-white/10" aria-hidden />
              ) : null}
              <span className="relative z-[1] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-[10px] font-black backdrop-blur-sm">
                {isComplete ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
              </span>
              <span className="relative z-[1] truncate text-[11px] font-black leading-tight tracking-tight sm:text-[12px]">
                {step.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className={`grid w-full gap-2 ${stageGridClass}`}>
        {steps.map((step, index) => {
          const count = countPhotosForStage(normalizedPhotos, step.id)
          const gradient = STAGE_GRADIENTS[index % STAGE_GRADIENTS.length]
          const canUpload = !readOnly && typeof onPhotosChange === 'function'
          const inputId = `prod-stage-strip-cam-${step.id}`

          return (
            <div key={`photo-${step.id || index}`} className="min-w-0">
              <input
                id={inputId}
                ref={(node) => {
                  fileRefs.current[step.id] = node
                }}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={!canUpload}
                onChange={(event) => {
                  handleFiles(step, event.target.files)
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={!canUpload}
                title={
                  canUpload
                    ? count
                      ? `${step.label}: ${count} fotoğraf — ekle`
                      : `${step.label}: fotoğraf yükle`
                    : `${step.label}: ${count} fotoğraf`
                }
                onClick={() => fileRefs.current[step.id]?.click()}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border,#E2E8F0)] bg-white/80 px-1.5 py-1.5 text-[11px] font-bold transition hover:border-transparent hover:bg-gradient-to-br hover:text-white disabled:cursor-default disabled:opacity-70 dark:bg-white/5 ${
                  count > 0 ? `bg-gradient-to-br text-white ${gradient}` : 'text-[var(--muted,#64748B)]'
                } ${canUpload ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}`}
              >
                {count > 0 ? (
                  <Camera className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                )}
                <span className="tabular-nums">{count > 0 ? `${count} foto` : 'Foto yok'}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
