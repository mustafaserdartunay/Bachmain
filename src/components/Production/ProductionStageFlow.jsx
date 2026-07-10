import { Check, Settings2 } from 'lucide-react'
import { useState } from 'react'
import {
  formatQty,
  getGlobalMinimalStageSteps,
  getLineMinimalStageSteps,
} from '../../utils/productionQuantityMetrics'
import { getLineStageProgress } from '../../utils/productionLineItems'
import { PhotoLightbox, ProductionStageColumnPhotos } from './ProductionLineItemStagePhotos'

function resolveWorkflowStageSegmentStyle(step, { barHeight, isDark = false }) {
  const stageColor = step.color || 'bg-gray-500'
  const reached = step.isActive || step.isComplete

  return {
    stageColor,
    surfaceLayerClass: reached ? 'opacity-100' : 'opacity-25',
    shellClass: [
      barHeight,
      step.isActive ? '-translate-y-px ring-2 ring-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]' : '',
    ]
      .filter(Boolean)
      .join(' '),
    labelClass: reached ? 'text-white' : isDark ? 'text-gray-400' : 'text-[var(--text-soft)]',
  }
}

const trackToneClass = {
  active: 'border-[var(--border)] bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_6%,var(--surface-raised))] to-[var(--surface-raised)]',
  finished: 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-[var(--surface-raised)]',
  pending: 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-[var(--surface-raised)]',
  excess: 'border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-[var(--surface-raised)]',
}

const trackLabelClass = {
  active: 'text-[var(--text-muted)]',
  finished: 'text-emerald-700',
  pending: 'text-amber-700',
  excess: 'text-sky-700',
}

export default function ProductionStageFlow({
  stages = [],
  trackLabel,
  trackQuantity,
  tone = 'active',
  onStageClick,
  compact = false,
}) {
  if (stages.length === 0) return null

  const dotSize = compact ? 'h-7 w-7 text-[11px]' : 'h-10 w-10 text-[13px]'
  const labelSize = compact ? 'text-[11px]' : 'text-[12px] sm:text-[13px]'
  const dotRowH = compact ? 'h-7' : 'h-10'
  const lineClass = compact ? 'h-px' : 'h-1'
  const checkSize = compact ? 'h-3 w-3' : 'h-4 w-4'

  const stepsRow = (
    <div
      className="grid w-full gap-x-0"
      style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
    >
      {stages.map((stage, stageIndex) => (
        <div key={stage.id} className="relative flex min-w-0 flex-col items-center">
          <div className={`relative ${dotRowH} w-full`}>
            {stageIndex > 0 && (
              <div
                className={`absolute left-0 top-1/2 w-1/2 -translate-y-1/2 rounded-full ${lineClass} ${
                  stage.completed || stages[stageIndex - 1]?.completed ? 'bg-emerald-400' : 'bg-[var(--border)]'
                }`}
              />
            )}
            {stageIndex < stages.length - 1 && (
              <div
                className={`absolute right-0 top-1/2 w-1/2 -translate-y-1/2 rounded-full ${lineClass} ${
                  stage.completed ? 'bg-emerald-400' : 'bg-[var(--border)]'
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => onStageClick?.(stage.id)}
              disabled={!onStageClick}
              className={`group absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-black transition-all duration-300 ${dotSize} ${
                onStageClick ? 'cursor-pointer' : 'cursor-default'
              } ${
                stage.completed
                  ? 'bg-emerald-500 text-white shadow-[0_0_0_4px_color-mix(in_srgb,emerald_500_20%,transparent)]'
                  : stage.active
                    ? 'bg-[var(--accent)] text-white shadow-[0_0_0_5px_color-mix(in_srgb,var(--accent)_22%,transparent)] scale-105'
                    : 'border-2 border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-soft)] group-hover:border-[var(--accent)]/50'
              }`}
              title={onStageClick ? `${stage.label} aşamasına geç` : stage.label}
            >
              {stage.completed ? <Check className={checkSize} strokeWidth={3} /> : stageIndex + 1}
            </button>
          </div>
          <span
            className={`mt-2.5 w-full px-0.5 text-center font-bold leading-snug ${labelSize} ${
              stage.active ? 'text-[var(--accent)]' : stage.completed ? 'text-[var(--text-strong)]' : 'text-[var(--text-soft)]'
            }`}
          >
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div className={`rounded-3xl border p-4 shadow-[var(--shadow)] sm:p-5 ${trackToneClass[tone] || trackToneClass.active}`}>
      {(trackLabel || trackQuantity > 0) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)]/60 pb-3">
          {trackLabel && (
            <p className={`text-[13px] font-black uppercase tracking-[0.14em] ${trackLabelClass[tone] || trackLabelClass.active}`}>
              {trackLabel}
            </p>
          )}
          {trackQuantity > 0 && (
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1 text-xs font-black tabular-nums text-[var(--text-strong)]">
              {formatQty(trackQuantity)} adet
            </span>
          )}
        </div>
      )}
      {compact ? (
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-max">{stepsRow}</div>
        </div>
      ) : (
        stepsRow
      )}
    </div>
  )
}

export function ProductionMinimalStageRail({
  steps = [],
  onStageClick,
  compact = false,
  size,
  showProducts = false,
  hideMetrics = false,
  fluid = false,
}) {
  if (steps.length === 0) return null

  const resolvedSize = size || (compact ? 'compact' : 'default')
  const sizeStyles = {
    compact: {
      dotSize: 'h-2 w-2',
      dotRowH: 'h-2',
      labelClass: 'text-[10px]',
      productClass: 'text-[7px]',
      stepW: showProducts ? 'min-w-[100px]' : 'min-w-[52px]',
      labelMaxW: 'max-w-[84px]',
      productMaxW: 'max-w-[120px]',
      labelMinH: 'min-h-[26px]',
      productMinH: 'min-h-[28px]',
      lineClass: 'h-px',
      dotRing: 'ring-[3px]',
      labelMt: 'mt-1.5',
      productMt: 'mt-1',
      productGap: 'gap-x-1.5 gap-y-0.5',
      productChip: false,
    },
    default: {
      dotSize: 'h-2.5 w-2.5',
      dotRowH: 'h-2.5',
      labelClass: 'text-[11px]',
      productClass: 'text-[10px]',
      stepW: showProducts ? 'min-w-[100px]' : 'min-w-[64px]',
      labelMaxW: 'max-w-[84px]',
      productMaxW: 'max-w-[120px]',
      labelMinH: 'min-h-[30px]',
      productMinH: 'min-h-[32px]',
      lineClass: 'h-px',
      dotRing: 'ring-[3px]',
      labelMt: 'mt-1.5',
      productMt: 'mt-1',
      productGap: 'gap-x-1.5 gap-y-0.5',
      productChip: false,
    },
    large: {
      dotSize: 'h-4 w-4',
      dotRowH: 'h-4',
      labelClass: 'text-[13px]',
      productClass: 'text-[12px]',
      stepW: showProducts ? 'min-w-[152px]' : 'min-w-[88px]',
      labelMaxW: 'max-w-[140px]',
      productMaxW: 'max-w-[168px]',
      labelMinH: 'min-h-[44px]',
      productMinH: 'min-h-[56px]',
      lineClass: 'h-0.5',
      dotRing: 'ring-[4px]',
      labelMt: 'mt-2.5',
      productMt: 'mt-2',
      productGap: 'gap-1',
      productChip: true,
    },
  }[resolvedSize]

  const {
    dotSize,
    dotRowH,
    labelClass,
    productClass,
    stepW,
    labelMaxW,
    productMaxW,
    labelMinH,
    productMinH,
    lineClass,
    dotRing,
    labelMt,
    productMt,
    productGap,
    productChip,
  } = sizeStyles

  function segmentFillClass(fromStep) {
    if (fromStep?.isComplete) return 'bg-emerald-500'
    if (fromStep?.isActive) return 'bg-[var(--accent)]'
    return 'bg-[color-mix(in_srgb,var(--border)_85%,transparent)]'
  }

  function renderStep(step, index, isFluid = false) {
    const fluidRowH = 'h-10'
    const dotRowHeight = isFluid ? fluidRowH : dotRowH
    const fluidLabelClass = 'text-[13px] sm:text-xs'
    const resolvedLabelClass = isFluid ? fluidLabelClass : labelClass
    const resolvedLineClass = isFluid ? 'h-1.5 rounded-full' : lineClass

    const fluidNodeClass = step.isActive
      ? 'h-8 w-8 border-[3px] border-[var(--surface-raised)] bg-[var(--accent)] text-white shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent),0_4px_14px_color-mix(in_srgb,var(--accent)_35%,transparent)] scale-110'
      : step.isComplete
        ? 'h-7 w-7 border-[3px] border-[var(--surface-raised)] bg-emerald-500 text-white shadow-[0_2px_8px_color-mix(in_srgb,emerald_500_40%,transparent)]'
        : 'h-7 w-7 border-2 border-[var(--border)] bg-[var(--surface-raised)] text-[12px] font-black text-[var(--text-soft)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'

    return (
      <div key={step.id} className={isFluid ? 'relative min-w-0' : `flex items-start ${stepW} shrink-0`}>
        <div className="flex w-full flex-col items-center">
          <div className={`relative ${dotRowHeight} w-full`}>
            {index > 0 && (
              <div
                className={`absolute left-0 top-1/2 z-0 w-1/2 -translate-y-1/2 ${resolvedLineClass} ${segmentFillClass(steps[index - 1])}`}
              />
            )}
            {index < steps.length - 1 && (
              <div
                className={`absolute right-0 top-1/2 z-0 w-1/2 -translate-y-1/2 ${resolvedLineClass} ${
                  step.isComplete ? 'bg-emerald-500' : 'bg-[color-mix(in_srgb,var(--border)_85%,transparent)]'
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => onStageClick?.(step.id)}
              disabled={!onStageClick}
              title={step.label}
              className={`absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-300 ${
                onStageClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              } ${
                isFluid
                  ? fluidNodeClass
                  : `${dotSize} ${
                      step.isActive
                        ? `bg-[var(--accent)] ${dotRing} ring-[color-mix(in_srgb,var(--accent)_22%,transparent)]`
                        : step.isComplete
                          ? 'bg-emerald-500'
                          : `border border-[var(--border)] bg-[var(--surface-raised)]`
                    } ${!step.isActive && !step.isComplete && step.color ? step.color : ''}`
              }`}
            >
              {isFluid && step.isComplete ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : isFluid && !step.isActive ? (
                index + 1
              ) : isFluid && step.isActive ? (
                <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
              ) : null}
            </button>
          </div>
          <div className={`${isFluid ? 'mt-3 min-h-[40px]' : labelMt} flex w-full ${isFluid ? '' : labelMinH} items-start justify-center ${isFluid ? 'px-1' : labelMaxW}`}>
            <p
              className={`line-clamp-2 text-center font-bold leading-snug ${resolvedLabelClass} ${
                step.isActive
                  ? 'text-[var(--accent)]'
                  : step.isComplete
                    ? 'text-emerald-600'
                    : 'text-[var(--text-soft)]'
              } ${isFluid && step.isActive ? 'font-black' : ''}`}
            >
              {step.label}
            </p>
          </div>
          {showProducts && step.products?.length > 0 ? (
            <div className={`${productMt} flex w-full ${productMinH} ${fluid ? 'px-0.5' : productMaxW} flex-wrap content-start justify-center ${productGap}`}>
              {step.products.map((product) => (
                <span
                  key={product.id}
                  className={`whitespace-nowrap font-semibold text-[var(--text-muted)] ${productClass} ${
                    productChip
                      ? 'rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5'
                      : ''
                  }`}
                  title={product.quantity ? `${product.name} · ${formatQty(product.quantity)} adet` : product.name}
                >
                  {product.name}
                </span>
              ))}
            </div>
          ) : showProducts ? (
            <div className={`${productMt} flex w-full ${productMinH} items-start justify-center ${fluid ? 'px-0.5' : productMaxW}`}>
              <p className={`text-[var(--text-soft)] ${productClass}`}>—</p>
            </div>
          ) : !hideMetrics ? (
            <p className={`mt-0.5 font-bold tabular-nums text-[var(--text-soft)] ${labelClass}`}>
              {formatQty(step.count)}
              <span className="font-normal opacity-70">/{formatQty(step.total)}</span>
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  if (fluid) {
    return (
      <div className="relative px-0.5 py-1">
        <div
          className="relative grid w-full gap-x-0"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, index) => renderStep(step, index, true))}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-start px-1">
        {steps.map((step, index) => renderStep(step, index, false))}
      </div>
    </div>
  )
}

export function ProductionLineItemStageTrackInline({ steps = [], theme = 'light', showLabels = true }) {
  if (steps.length === 0) return null

  const isDark = theme === 'dark'
  const barHeight = showLabels ? (isDark ? 'h-7' : 'h-8') : isDark ? 'h-3' : 'h-4'

  return (
    <div
      className="grid min-w-0 flex-1 gap-x-0.5"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => {
        const isFirst = index === 0
        const isLast = index === steps.length - 1
        const radiusClass =
          steps.length === 1
            ? 'rounded-full'
            : isFirst
              ? 'rounded-l-full'
              : isLast
                ? 'rounded-r-full'
                : 'rounded-sm'
        const { stageColor, surfaceLayerClass, shellClass, labelClass } = resolveWorkflowStageSegmentStyle(step, {
          barHeight,
          isDark,
        })

        return (
          <div key={step.id} className="flex min-w-0 items-stretch">
            <div
              className={`relative flex w-full min-w-0 items-center justify-center overflow-hidden px-1 transition-all duration-300 ${radiusClass} ${shellClass}`}
              title={step.label}
            >
              <div className={`absolute inset-0 ${stageColor} ${surfaceLayerClass} transition-opacity duration-300`} />
              {showLabels && (
                <span
                  className={`relative z-10 line-clamp-2 w-full text-center font-bold leading-tight ${labelClass} ${
                    isDark ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-[12px]'
                  } ${step.isActive ? 'font-black' : ''}`}
                >
                  {step.label}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ProductionLineItemStageTrack({
  steps = [],
  stagePhotos = [],
  readOnly = false,
  onStagePhotosChange,
  theme = 'light',
}) {
  const [previewPhoto, setPreviewPhoto] = useState(null)

  if (steps.length === 0) return null

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)]/70 bg-[color-mix(in_srgb,var(--surface-muted)_55%,var(--surface-raised))] p-2.5 sm:p-3">
      <div
        className="grid gap-x-1"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const isFirst = index === 0
          const isLast = index === steps.length - 1
          const radiusClass =
            steps.length === 1
              ? 'rounded-full'
              : isFirst
                ? 'rounded-l-full'
                : isLast
                  ? 'rounded-r-full'
                  : 'rounded-sm'
          const { stageColor, surfaceLayerClass, shellClass } = resolveWorkflowStageSegmentStyle(step, {
            barHeight: step.isActive ? 'h-[18px]' : 'h-4',
          })

          return (
            <div key={step.id} className="flex min-w-0 flex-col items-stretch">
              <div
                className={`relative w-full overflow-hidden transition-all duration-300 ${radiusClass} ${shellClass}`}
                title={step.label}
              >
                <div className={`absolute inset-0 ${stageColor} ${surfaceLayerClass} transition-opacity duration-300`} />
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="mt-3 grid gap-x-1 items-stretch"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, minHeight: '5.5rem' }}
      >
        {steps.map((step) => (
          <div key={`${step.id}-meta`} className="flex h-full min-w-0 flex-col items-center px-0.5">
            <div className="flex w-full flex-col items-center gap-1">
              <p
                className={`line-clamp-2 text-center text-[12px] font-bold leading-snug sm:text-[13px] ${
                  step.isActive
                    ? 'font-black text-[var(--text-strong)]'
                    : step.isComplete
                      ? 'text-[var(--text-strong)]'
                      : 'text-[var(--text-soft)]'
                }`}
              >
                {step.label}
              </p>
              {step.products?.length > 0 && (
                <div className="flex w-full flex-col items-center gap-0.5">
                  {step.products.map((product) => (
                    <span
                      key={product.id}
                      className="max-w-full truncate rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]"
                      title={product.name}
                    >
                      {product.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-auto flex w-full flex-col items-center pt-2">
              <ProductionStageColumnPhotos
                stageId={step.id}
                stageLabel={step.label}
                allPhotos={stagePhotos}
                readOnly={readOnly}
                theme={theme}
                onPhotosChange={onStagePhotosChange}
                onPreview={setPreviewPhoto}
              />
            </div>
          </div>
        ))}
      </div>
      </div>
      <PhotoLightbox photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </>
  )
}

export function ProductionGlobalStageRail({ stageStats = [] }) {
  return (
    <ProductionMinimalStageRail
      steps={getGlobalMinimalStageSteps(stageStats)}
      showProducts
      size="large"
    />
  )
}

export function ProductionLineItemTopStageStrip({
  lineItem,
  productionStages,
  rowCount = 0,
  readOnly = false,
  onStagePhotosChange,
}) {
  if (!productionStages.length) return null

  const steps = getLineMinimalStageSteps(lineItem, productionStages)

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-muted)]/25 px-4 py-3">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[var(--text-soft)]">
          Genel süreç · teslimat satırlarından
        </p>
        <span className="text-[12px] font-semibold tabular-nums text-[var(--text-muted)]">
          {rowCount} teslimat · {productionStages.length} aşama
        </span>
      </div>
      <ProductionLineItemStageTrack
        steps={steps}
        stagePhotos={lineItem.stagePhotos}
        readOnly={readOnly}
        onStagePhotosChange={onStagePhotosChange}
      />
    </div>
  )
}

export function QuantityRowVerticalStages({ stages = [], onStageClick }) {
  if (!stages.length) return null

  return (
    <div className="space-y-1">
      {stages.map((stage, index) => (
        <button
          key={stage.id}
          type="button"
          disabled={!onStageClick}
          onClick={() => onStageClick?.(stage.id)}
          title={onStageClick ? `${stage.label} aşamasına geç` : stage.label}
          className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
            onStageClick ? 'cursor-pointer hover:border-[var(--accent)]/40 hover:bg-[var(--surface-muted)]' : 'cursor-default'
          } ${
            stage.active
              ? 'border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-raised))]'
              : stage.completed
                ? 'border-emerald-500/25 bg-emerald-500/5'
                : 'border-[var(--border)] bg-[var(--surface-raised)]'
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
              stage.completed
                ? 'bg-emerald-500 text-white'
                : stage.active
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-soft)]'
            }`}
          >
            {stage.completed ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
          </span>
          <span
            className={`min-w-0 flex-1 text-[12px] font-bold leading-snug ${
              stage.active ? 'text-[var(--accent)]' : stage.completed ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {stage.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export function ProductionLineItemProcessSidebar({
  lineItem,
  productionStages,
  tracks,
  onStageChange,
  productionClosed,
}) {
  if (!productionStages.length || !tracks.length) return null

  function resolveStageClick(track) {
    if (productionClosed || track.tone === 'pending') return undefined
    return onStageChange
  }

  return (
    <aside className="border-r border-[var(--border)] bg-gradient-to-b from-[var(--surface-muted)]/40 to-[var(--surface)] p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-raised))] text-[var(--accent)]">
          <Settings2 className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[var(--text-strong)]">Üretim süreci</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {productionClosed ? 'Kilitli · geri al ile düzenle' : 'Aşamayı seçerek ilerlet'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tracks.map((track) => {
          const stages = track.stages?.length
            ? track.stages
            : getLineStageProgress(lineItem, productionStages)

          return (
            <div
              key={track.id}
              className={`rounded-xl border p-2.5 ${trackToneClass[track.tone] || trackToneClass.active}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className={`text-[11px] font-black uppercase tracking-wider ${trackLabelClass[track.tone] || trackLabelClass.active}`}>
                  {track.label}
                </p>
                {track.quantity > 0 && (
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 py-0.5 text-[11px] font-black tabular-nums text-[var(--text-strong)]">
                    {formatQty(track.quantity)}
                  </span>
                )}
              </div>
              <QuantityRowVerticalStages stages={stages} onStageClick={resolveStageClick(track)} />
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export function QuantityProgressBar({ ordered, produced, delivered, productionClosed, size = 'md' }) {
  const producedPct = ordered ? Math.min(100, (produced / ordered) * 100) : 0
  const deliveredPct = ordered ? Math.min(100, (delivered / ordered) * 100) : 0
  const remaining = Math.max(0, ordered - produced)
  const excess = Math.max(0, produced - ordered)
  const barH = size === 'sm' ? 'h-2' : 'h-2.5'

  return (
    <div className="space-y-2.5">
      <div className={`relative overflow-hidden rounded-full bg-[var(--surface-muted)] ${barH}`}>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[color-mix(in_srgb,var(--accent)_80%,white)] transition-all duration-700 ease-out"
          style={{ width: `${producedPct}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${deliveredPct}%` }}
        />
        {productionClosed && remaining > 0 && ordered > 0 && (
          <div
            className="absolute inset-y-0 rounded-full border border-dashed border-amber-400/60 bg-amber-400/20"
            style={{ left: `${producedPct}%`, width: `${Math.min(100 - producedPct, (remaining / ordered) * 100)}%` }}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold">
        <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Üretim {formatQty(produced)}
        </span>
        <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Teslim {formatQty(delivered)}
        </span>
        {remaining > 0 && (
          <span className="text-amber-600">Kalan {formatQty(remaining)}</span>
        )}
        {excess > 0 && (
          <span className="text-sky-600">Fazla +{formatQty(excess)}</span>
        )}
      </div>
    </div>
  )
}

export function ProgressRing({ value, label, sublabel, size = 88, stroke = 6, tone = 'accent' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (value / 100) * c
  const colorClass = tone === 'emerald' ? 'text-emerald-500' : 'text-[var(--accent)]'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-[var(--surface-muted)]"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            className={`${colorClass} transition-all duration-700 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black tabular-nums leading-none text-[var(--text-strong)]">%{value}</span>
        </div>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">{label}</p>
      {sublabel && <p className="text-[11px] font-semibold text-[var(--text-muted)]">{sublabel}</p>}
    </div>
  )
}
