import { Check, ChevronRight } from 'lucide-react'
import { ProductionStageColumnPhotos } from './ProductionLineItemStagePhotos'
import { getCrmSoftStyleForColor } from '../../utils/crmStageStyles'
import { stageAllowsPhotos } from '../../utils/productionStagePhotos'

function stepAllowsPhotos(step) {
  if (step?.requiresPhoto === true) return true
  if (step?.requiresPhoto === false) return false
  return stageAllowsPhotos(step?.label)
}

function StageSegment({
  step,
  index,
  stagePhotos,
  readOnly,
  onPhotosChange,
  onPreview,
  onStageClick,
}) {
  const isFirst = index === 0
  const reached = step.isActive || step.isComplete
  const allowsPhotos = stepAllowsPhotos(step)
  const isClickable = !readOnly && typeof onStageClick === 'function'
  const style = getCrmSoftStyleForColor(step.color, index)
  const activeSurface = style.surfaceActive

  return (
    <div
      className={`relative min-w-0 flex-1 ${step.isActive ? 'z-10' : ''}`}
      title={isClickable ? `${step.label} aşamasına al` : step.label}
    >
      {!isFirst && (
        <span
          className={`absolute -left-px top-1/2 z-0 h-px w-1 -translate-y-1/2 ${
            reached ? 'bg-dark-500/45' : 'bg-dark-500/20'
          }`}
          aria-hidden
        />
      )}

      <button
        type="button"
        disabled={!isClickable}
        onClick={() => onStageClick?.(step.id)}
        className={`relative flex h-9 w-full min-w-0 items-center overflow-hidden rounded-lg border px-1 transition-[border-color,box-shadow,opacity,background-color] duration-200 ${
          step.isActive
            ? `${style.borderActive} shadow-sm ring-1 ${style.ring}`
            : reached
              ? style.border
              : 'border-dark-500/40'
        } ${
          isClickable
            ? 'cursor-pointer hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30'
            : 'cursor-default'
        }`}
      >
        {!step.isActive && (
          <div className={`absolute inset-0 bg-gray-100 dark:bg-dark-700/70 ${!reached ? 'opacity-70' : ''}`} />
        )}
        {step.isActive && (
          <>
            <div className={`absolute inset-0 ${activeSurface}`} />
            <div className={`absolute inset-0 ${style.accent} opacity-[0.14]`} />
          </>
        )}
        {step.isComplete && !step.isActive && (
          <div className={`absolute inset-0 ${style.surface} opacity-70`} />
        )}
        <div className={`absolute inset-x-0 bottom-0 h-1 ${style.accent} ${step.isActive ? 'opacity-100' : reached ? 'opacity-80' : 'opacity-30'}`} />

        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-start gap-1 px-1.5">
          {step.isActive && (
            <span className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${style.accent} text-white/95 shadow-sm`}>
              <ChevronRight className="h-2 w-2" strokeWidth={3} />
            </span>
          )}
          {step.isComplete && !step.isActive && (
            <span className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${style.accent} text-white/95 shadow-sm`}>
              <Check className="h-1.5 w-1.5" strokeWidth={3} />
            </span>
          )}

          <span
            className={`min-w-0 flex-1 truncate text-left text-[7px] font-bold uppercase leading-none tracking-[0.04em] text-black ${
              step.isActive ? 'font-black tracking-[0.06em]' : ''
            }`}
          >
            {step.label}
          </span>

          {allowsPhotos && (
            <ProductionStageColumnPhotos
              stageId={step.id}
              stageLabel={step.label}
              allPhotos={stagePhotos}
              readOnly={readOnly}
              theme="dark"
              inline
              compact
              onPhotosChange={onPhotosChange}
              onPreview={onPreview}
            />
          )}
        </div>
      </button>
    </div>
  )
}

export default function ProductionListJobStageRail({
  steps = [],
  className = '',
  stagePhotos = [],
  readOnly = false,
  onPhotosChange,
  onPreview,
  onStageClick,
}) {
  if (!steps.length) return null

  return (
    <div className={`flex min-w-0 gap-0.5 overflow-visible ${className}`}>
      {steps.map((step, index) => (
        <StageSegment
          key={step.id}
          step={step}
          index={index}
          stagePhotos={stagePhotos}
          readOnly={readOnly}
          onPhotosChange={onPhotosChange}
          onPreview={onPreview}
          onStageClick={onStageClick}
        />
      ))}
    </div>
  )
}
