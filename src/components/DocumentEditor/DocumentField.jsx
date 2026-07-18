export function DocumentField({ label, children, compact = false }) {
  return (
    <div className="min-w-0">
      <label className={`block font-bold text-white ${compact ? 'mb-1 text-[11px] uppercase tracking-wide text-[var(--muted)]' : 'mb-2 text-base'}`}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function DocumentFieldLabelSpacer({ label = 'Alan', compact = false }) {
  return (
    <label
      className={`block font-bold text-white opacity-0 ${compact ? 'mb-1 text-[11px]' : 'mb-2 text-base'}`}
      aria-hidden
    >
      {label}
    </label>
  )
}

import { Plus } from 'lucide-react'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

export function DocumentMiniButton({ children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        danger
          ? 'h-[38px] rounded-lg border border-red-500/30 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10'
          : `${BTN_PRIMARY} h-[38px] gap-1.5 px-3 text-xs`
      }
    >
      {!danger && <Plus className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}
