import { ChevronRight } from 'lucide-react'
import { OPTION_COLOR_PALETTE } from '../../utils/customerMeta'

export default function ProductionLineItemsPill({
  lineItems,
  openKey,
  activeMenu,
  setActiveMenu,
  buttonClassName,
}) {
  const isOpen = activeMenu === openKey
  const menuItems = lineItems.map((line, index) => ({
    label: line.product || `Kalem ${index + 1}`,
    color: OPTION_COLOR_PALETTE[index % OPTION_COLOR_PALETTE.length],
  }))
  const count = lineItems.length
  const buttonLabel = count === 0
    ? 'Kalem yok'
    : count === 1
      ? menuItems[0]?.label || '1 kalem'
      : `${count} kalem`
  const buttonDotClass = count > 0 ? menuItems[0].color : 'bg-gray-500'

  return (
    <div className={`relative min-w-0 w-full ${isOpen ? 'z-50' : ''}`} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={count === 0}
        onClick={() => {
          if (count === 0) return
          setActiveMenu(isOpen ? null : openKey)
        }}
        className={`${buttonClassName} ${count === 0 ? 'cursor-default opacity-90' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${buttonDotClass}`} />
          <span className={`truncate ${count > 0 ? 'text-gray-200' : 'text-gray-500'}`}>
            {buttonLabel}
          </span>
        </span>
        {count > 0 && (
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        )}
      </button>
      {isOpen && count > 0 && (
        <div className="absolute left-0 top-11 z-50 min-w-[210px] w-full rounded-2xl border border-dark-500 bg-dark-800 p-2 shadow-2xl shadow-black/40">
          {menuItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-200"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
              <span className="min-w-0 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
