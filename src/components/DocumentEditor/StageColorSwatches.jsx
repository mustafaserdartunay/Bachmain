import { stageColors } from './stageColors'

export default function StageColorSwatches({
  value,
  onChange,
  size = 'md',
  direction = 'horizontal',
  fill = false,
  readOnly = false,
  columns = 1,
  centered = false,
  nowrap = false,
}) {
  const dotClass = size === 'sm' ? 'h-2.5 w-2.5' : size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3'
  const colCount = Math.max(1, Number(columns) || 1)
  const gridColsClass = colCount >= 3 ? 'grid-cols-3' : colCount === 2 ? 'grid-cols-2' : ''

  let layoutClass = 'flex flex-wrap items-center gap-1.5'
  if (direction === 'vertical') {
    if (colCount > 1) {
      layoutClass = fill
        ? `grid h-full min-h-0 w-full flex-1 ${gridColsClass} content-start justify-items-center gap-x-2 gap-y-1.5 overflow-y-auto py-0.5`
        : `grid max-h-72 w-full ${gridColsClass} content-start justify-items-center gap-x-2 gap-y-1.5 overflow-y-auto pr-0.5`
      if (centered) {
        layoutClass = fill
          ? `grid h-full min-h-0 w-full flex-1 ${gridColsClass} content-center justify-items-center gap-x-2 gap-y-1.5 overflow-y-auto py-0.5`
          : `mx-auto grid max-h-72 w-max ${gridColsClass} content-center justify-items-center gap-x-2 gap-y-1.5 overflow-y-auto`
      }
    } else {
      layoutClass = fill
        ? `flex h-full min-h-0 flex-1 flex-col ${centered ? 'items-center justify-center' : 'justify-between'} py-0.5`
        : `flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-0.5 ${centered ? 'items-center' : ''}`
    }
  } else if (centered) {
    layoutClass = 'flex flex-wrap items-center justify-center gap-1.5'
  } else if (direction === 'horizontal') {
    layoutClass = nowrap
      ? 'flex min-w-0 flex-nowrap items-center gap-1'
      : 'flex min-w-0 flex-1 flex-wrap items-center gap-1'
  }

  return (
    <div className={layoutClass}>
      {stageColors.map((color) => {
        const isWhite = color === 'bg-white'
        const isBlack = color === 'bg-black'
        return (
          <button
            key={color}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(color)}
            className={`${dotClass} shrink-0 rounded-full ${color} transition-all ${
              isWhite ? 'ring-1 ring-slate-400/70' : ''
            } ${isBlack ? 'ring-1 ring-zinc-600/50' : ''} ${
              value === color
                ? `ring-2 scale-110 ${isWhite ? 'ring-slate-500 ring-offset-1 ring-offset-slate-200' : 'ring-white ring-offset-1 ring-offset-dark-800'}`
                : readOnly
                  ? 'opacity-35'
                  : 'opacity-60 hover:scale-105 hover:opacity-100'
            } ${readOnly ? 'cursor-default' : ''}`}
            aria-label={`Renk: ${color}`}
          />
        )
      })}
    </div>
  )
}
