import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, LayoutGrid } from 'lucide-react'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { findSectoralSection, isBaklavaCostCalculatorEnabled } from '../../utils/sectoralSettings'

const COST_CALCULATOR_CATEGORY_ID = 'ambalaj'
const COST_CALCULATOR_SECTION_ID = 'matbaa'

export default function HeaderModuleDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [sectoralRevision, setSectoralRevision] = useState(0)

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

  useEffect(() => {
    if (!open) return undefined
    function close() {
      setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  function openModule(item) {
    setOpen(false)
    navigate(item.resolvePath())
  }

  return (
    <div className="relative flex shrink-0 items-center" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${HEADER_CONTROL_BUTTON_CLASS} relative w-9`}
        aria-label="Modüller"
        aria-expanded={open}
      >
        <LayoutGrid className="h-5 w-5 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-dark-500 bg-dark-800 shadow-2xl shadow-black/35">
          <div className="border-b border-dark-500/55 p-4">
            <p className="text-sm font-black text-white">Modüller</p>
            <p className="text-[11px] font-semibold text-slate-950">Sektörel araçlara hızlı erişim</p>
          </div>

          <div className="p-2">
            {moduleMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openModule(item)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-950 transition-colors hover:bg-blue-500/10 hover:text-blue-700"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
