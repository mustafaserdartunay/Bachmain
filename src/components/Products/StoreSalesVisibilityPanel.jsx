import { ChevronDown } from 'lucide-react'

export default function StoreSalesVisibilityPanel({
  visible,
  onChange,
  isOpen,
  onToggle,
  compact = true,
}) {
  const displayLabel = visible ? 'Görünür' : 'Gizli'
  const dotColor = visible ? 'bg-emerald-500' : 'bg-gray-500'

  return (
    <div className="overflow-hidden rounded-lg border border-dark-500/50 transition-colors focus-within:border-accent-blue/50">
      <div className="sticky top-0 z-10 border-b border-transparent bg-dark-800/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full text-left transition-colors ${compact ? 'px-3 py-2' : 'px-3 py-2.5'}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-black uppercase tracking-wider text-gray-500 ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
                Mağaza Satışı Durumu
              </p>
              <p className={`flex items-center gap-1.5 font-bold text-white ${compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'}`}>
                <span className={`shrink-0 rounded-full ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'} ${dotColor}`} />
                <span className="truncate">{displayLabel}</span>
              </p>
              <p className={`text-gray-500 ${compact ? 'mt-0.5 text-[12px]' : 'mt-1 text-xs'}`}>
                {visible ? 'Mağaza satışında listeleniyor' : 'Mağaza satışından gizli'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`font-bold text-gray-400 ${compact ? 'text-[12px]' : 'text-xs'}`}>{isOpen ? 'Gizle' : 'Düzenle'}</span>
              <ChevronDown className={`text-gray-400 transition-transform ${compact ? 'h-3 w-3' : 'h-4 w-4'} ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className={`${compact ? 'p-3' : 'p-4'}`} onClick={(event) => event.stopPropagation()}>
          <label className="flex cursor-pointer select-none items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={visible}
              onClick={() => onChange(!visible)}
              className={`relative h-5 w-10 rounded-full transition-colors ${visible ? 'bg-accent-blue' : 'bg-dark-500'}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  visible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-300">Mağaza satışında görünsün</span>
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Açık olduğunda ürün Mağaza Satışı sayfasında kasada satılabilir olarak listelenir.
          </p>
        </div>
      )}
    </div>
  )
}
