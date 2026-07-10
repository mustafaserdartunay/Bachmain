import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Calculator, LayoutGrid } from 'lucide-react'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { findSectoralSection, isBaklavaCostCalculatorEnabled } from '../../utils/sectoralSettings'

const COST_CALCULATOR_CATEGORY_ID = 'ambalaj'
const COST_CALCULATOR_SECTION_ID = 'matbaa'

export default function HeaderModuleDropdown() {
  const navigate = useNavigate()
  const { open, setOpen, toggle } = useHeaderPopover('module-menu')
  const [sectoralRevision, setSectoralRevision] = useState(0)
  const { anchorRef, menuRef, style: menuStyle } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    width: 320,
    offset: 8,
  })

  const moduleMenuItems = useMemo(() => {
    const section = findSectoralSection(COST_CALCULATOR_CATEGORY_ID, COST_CALCULATOR_SECTION_ID)
    return [
      {
        id: 'cost-calculator',
        label: section?.label || 'Maaliyet hesaplama modülü',
        icon: Calculator,
        resolvePath: () => (
          isBaklavaCostCalculatorEnabled()
            ? '/stok/baklava-kutu-maliyet-hesaplama'
            : '/ayarlar/sektorel/ambalaj'
        ),
      },
    ]
  }, [sectoralRevision])

  useEffect(() => {
    function refresh() {
      setSectoralRevision((current) => current + 1)
    }
    window.addEventListener('bach:sectoral-settings-updated', refresh)
    return () => window.removeEventListener('bach:sectoral-settings-updated', refresh)
  }, [])

  function openModule(item) {
    setOpen(false)
    navigate(item.resolvePath())
  }

  return (
    <div className="relative flex shrink-0 items-center" ref={anchorRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        data-header-popover-trigger="module-menu"
        onClick={toggle}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label="Modüller"
        aria-expanded={open}
      >
        <span className="icon-wrap">
          <LayoutGrid className="h-4 w-4 shrink-0" />
        </span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle ?? { position: 'fixed', visibility: 'hidden', pointerEvents: 'none', zIndex: 10000 }}
          className="app-header-dropdown w-[min(20rem,calc(100vw-1rem))] overflow-hidden"
          data-header-popover="module-menu"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[rgba(140,145,165,0.14)] p-4">
            <p className="text-sm font-extrabold text-[var(--ink)]">Modüller</p>
            <p className="text-[13px] font-semibold text-[var(--muted)]">Sektörel araçlara hızlı erişim</p>
          </div>

          <div className="p-2">
            {moduleMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openModule(item)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-[var(--ink)] transition-colors hover:bg-white/55"
              >
                <item.icon className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
