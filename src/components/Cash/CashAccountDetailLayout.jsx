import { useEffect, useRef } from 'react'
import { ChevronDown, Landmark, Banknote } from 'lucide-react'
import { DropdownMenuShell } from '../Common/DropdownMenu'
import { AppPageHeader } from '../Layout/AppPageLayout'
import { CASH_BASE_PATH } from '../../data/treasuryMenu'

const SIDEBAR_ACTION_CLASS =
  'glass-inset glass-inset-hover flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-[13px] font-black uppercase tracking-wide text-[var(--text-strong)] transition-colors'

export default function CashAccountDetailLayout({
  account,
  balance,
  breadcrumbLabel,
  onEdit,
  table,
  sidebar,
  balanceFooter,
}) {
  const Icon = account.type === 'Banka Hesabı' ? Landmark : Banknote
  const iconTone = account.type === 'Banka Hesabı'
    ? 'text-blue-300'
    : account.type === 'Çek Kasası'
      ? 'text-purple-300'
      : account.color || 'text-emerald-300'

  return (
    <div className="space-y-5">
      <AppPageHeader
        title={breadcrumbLabel}
        backTo={CASH_BASE_PATH}
        backLabel="Kasa ve Bankalar"
      />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card flex min-h-[44rem] flex-col overflow-visible p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className={`glass-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconTone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black uppercase tracking-wide text-[var(--text-strong)]">{account.name}</h2>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  {account.currency || 'TRY'} · {account.type}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onEdit}
              className="flex h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-black uppercase tracking-wide text-[var(--text-strong)] transition-colors hover:bg-[var(--surface-muted)]"
            >
              Düzenle
            </button>
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-4">{table}</div>
        </section>

        <aside className="card flex min-h-[44rem] flex-col p-3">
          {sidebar}
          {balanceFooter !== false && (
            balanceFooter ?? (
              <div className="mt-auto border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-black uppercase tracking-wide text-[var(--muted)]">Bakiye</span>
                  <span className={`text-sm font-black ${String(balance).includes('-') ? 'text-red-500' : 'text-emerald-600'}`}>
                    {balance}
                  </span>
                </div>
              </div>
            )
          )}
        </aside>
      </div>
    </div>
  )
}

export function CashSidebarActionButton({ label, open, onClick, onClose, children }) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open || !onClose) return undefined
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, onClose])

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 w-full ${open ? 'z-50' : ''}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={onClick} className={SIDEBAR_ACTION_CLASS}>
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <DropdownMenuShell>{children}</DropdownMenuShell> : null}
    </div>
  )
}

export function CashSidebarPrimaryButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className={SIDEBAR_ACTION_CLASS}>
      <span>{label}</span>
    </button>
  )
}
