import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Building2, ChevronDown, MapPin, Warehouse } from 'lucide-react'
import { useOrg } from '../../org/OrgContext'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'

function SelectMenu({ open, onClose, anchorRef, title, items, value, onSelect, emptyText }) {
  const menuRef = useRef(null)
  const [style, setStyle] = useState(null)

  useEffect(() => {
    if (!open || !anchorRef.current) return undefined
    function place() {
      const rect = anchorRef.current.getBoundingClientRect()
      setStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 280),
        width: 260,
        zIndex: 10000,
      })
    }
    place()
    function onDoc(e) {
      if (menuRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      onClose()
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('mousedown', onDoc)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [open, anchorRef, onClose])

  if (!open) return null
  return createPortal(
    <div ref={menuRef} style={style || { visibility: 'hidden' }} className="app-header-dropdown overflow-hidden">
      <div className="border-b border-[rgba(140,145,165,0.14)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
        {title}
      </div>
      <div className="max-h-72 overflow-y-auto p-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelect(item.id)
              onClose()
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-colors ${
              value === item.id
                ? 'bg-blue-500/15 text-blue-600'
                : 'text-[var(--ink)] hover:bg-white/55'
            }`}
          >
            <span className="truncate">{item.name}</span>
            {item.meta ? <span className="ml-auto truncate text-[10px] font-semibold text-[var(--muted)]">{item.meta}</span> : null}
          </button>
        ))}
        {!items.length ? (
          <p className="px-3 py-4 text-center text-[11px] font-semibold text-[var(--muted)]">{emptyText}</p>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

export default function OrgSwitcher() {
  const {
    enabled,
    multiBranch,
    multiWarehouse,
    companies,
    branches,
    warehouses,
    activeCompany,
    activeBranch,
    activeWarehouse,
    setCompany,
    setBranch,
    setWarehouse,
  } = useOrg()

  const companyRef = useRef(null)
  const branchRef = useRef(null)
  const warehouseRef = useRef(null)
  const [open, setOpen] = useState(null)

  if (!enabled) return null

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="relative" ref={companyRef}>
        <button
          type="button"
          className={`${HEADER_CONTROL_BUTTON_CLASS} !gap-1.5 !px-2.5`}
          onClick={() => setOpen((v) => (v === 'company' ? null : 'company'))}
          title="Firma seçimi"
        >
          <Building2 className="h-4 w-4 shrink-0 text-[var(--muted)]" />
          <span className="hidden max-w-[9rem] truncate text-xs font-extrabold text-[var(--ink)] sm:inline">
            {activeCompany?.name || 'Firma'}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-[var(--muted)] transition-transform ${open === 'company' ? 'rotate-180' : ''}`} />
        </button>
        <SelectMenu
          open={open === 'company'}
          onClose={() => setOpen(null)}
          anchorRef={companyRef}
          title="Firma Seçimi"
          items={companies.map((c) => ({ id: c.id, name: c.name, meta: c.city || c.currency }))}
          value={activeCompany?.id}
          onSelect={setCompany}
          emptyText="Şirket yok — Kurumsal Yapı’dan ekleyin"
        />
      </div>

      {multiBranch ? (
        <div className="relative" ref={branchRef}>
          <button
            type="button"
            className={`${HEADER_CONTROL_BUTTON_CLASS} !gap-1.5 !px-2.5`}
            onClick={() => setOpen((v) => (v === 'branch' ? null : 'branch'))}
            title="Şube seçimi"
          >
            <MapPin className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <span className="hidden max-w-[7rem] truncate text-xs font-extrabold text-[var(--ink)] md:inline">
              {activeBranch?.name || 'Şube'}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-[var(--muted)] ${open === 'branch' ? 'rotate-180' : ''}`} />
          </button>
          <SelectMenu
            open={open === 'branch'}
            onClose={() => setOpen(null)}
            anchorRef={branchRef}
            title="Şube Seçimi"
            items={branches.map((b) => ({ id: b.id, name: b.name, meta: b.code }))}
            value={activeBranch?.id}
            onSelect={setBranch}
            emptyText="Bu firmada şube yok"
          />
        </div>
      ) : null}

      {multiWarehouse ? (
        <div className="relative" ref={warehouseRef}>
          <button
            type="button"
            className={`${HEADER_CONTROL_BUTTON_CLASS} !gap-1.5 !px-2.5`}
            onClick={() => setOpen((v) => (v === 'warehouse' ? null : 'warehouse'))}
            title="Depo seçimi"
          >
            <Warehouse className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <span className="hidden max-w-[7rem] truncate text-xs font-extrabold text-[var(--ink)] lg:inline">
              {activeWarehouse?.name || 'Depo'}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-[var(--muted)] ${open === 'warehouse' ? 'rotate-180' : ''}`} />
          </button>
          <SelectMenu
            open={open === 'warehouse'}
            onClose={() => setOpen(null)}
            anchorRef={warehouseRef}
            title="Depo Seçimi"
            items={warehouses.map((w) => ({ id: w.id, name: w.name, meta: w.type }))}
            value={activeWarehouse?.id}
            onSelect={setWarehouse}
            emptyText="Bu şubede depo yok"
          />
        </div>
      ) : null}
    </div>
  )
}
