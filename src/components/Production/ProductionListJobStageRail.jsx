import { Check } from 'lucide-react'
import { ProductionStageColumnPhotos } from './ProductionLineItemStagePhotos'
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
  const stageColor = step.color || 'bg-gray-500'
  const isClickable = !readOnly && typeof onStageClick === 'function'

  return (
    <div
      className={`group relative min-w-0 flex-1 ${step.isActive ? 'z-10' : ''}`}
      title={isClickable ? `${step.label} aşamasına al` : step.label}
    >
      {!isFirst && (
        <span
          className={`absolute -left-px top-1/2 z-0 h-px w-1 -translate-y-1/2 ${
            reached ? 'bg-white/25' : 'bg-white/8'
          }`}
          aria-hidden
        />
      )}

      <button
        type="button"
        disabled={!isClickable}
        onClick={() => onStageClick?.(step.id)}
        className={`relative flex h-8 min-w-0 w-full items-center overflow-hidden rounded-lg border px-1.5 text-left transition-[border-color,box-shadow,opacity] duration-200 ${
          step.isActive
            ? 'border-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/20'
            : reached
              ? 'border-white/15'
              : 'border-white/8'
        } ${!reached ? 'opacity-45' : ''} ${
          isClickable
            ? 'cursor-pointer hover:border-white/28 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40'
            : 'cursor-default'
        }`}
      >
        <div className={`absolute inset-0 ${stageColor} ${reached ? 'opacity-90' : 'opacity-55'}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/14 via-transparent to-black/22" />

        <div className="relative z-10 flex min-w-0 flex-1 items-center justify-center gap-0.5">
          {step.isComplete && !step.isActive && (
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/90">
              <Check className="h-2 w-2" strokeWidth={3} />
            </span>
          )}

          <span
            className={`min-w-0 flex-1 truncate text-center text-[7px] font-bold uppercase leading-none tracking-[0.06em] ${
              reached ? 'text-white' : 'text-white/75'
            } ${step.isActive ? 'font-black tracking-[0.08em]' : ''}`}
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

        {step.isActive && (
          <span className="absolute bottom-0 left-2 right-2 h-px rounded-full bg-white/70" aria-hidden />
        )}
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
