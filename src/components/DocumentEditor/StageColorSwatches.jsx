import { stageColors } from './stageColors'

export default function StageColorSwatches({
  value,
  onChange,
  size = 'md',
  direction = 'horizontal',
  fill = false,
  readOnly = false,
}) {
  const dotClass = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  const layoutClass = direction === 'vertical'
    ? fill
      ? 'flex h-full min-h-0 flex-1 flex-col justify-between py-0.5'
      : 'flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-0.5'
    : 'flex flex-wrap items-center gap-1.5'

  return (
    <div className={layoutClass}>
      {stageColors.map((color) => (
        <button
          key={color}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(color)}
          className={`${dotClass} shrink-0 rounded-full ${color} transition-all ${
            value === color
              ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-800 scale-110'
              : readOnly
                ? 'opacity-35'
                : 'opacity-60 hover:scale-105 hover:opacity-100'
          } ${readOnly ? 'cursor-default' : ''}`}
          aria-label={`Renk: ${color}`}
        />
      ))}
    </div>
  )
}
