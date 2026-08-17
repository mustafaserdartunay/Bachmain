import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { documentDropdownMenuClass } from './documentItemLayout'
import NumericInput from '../Products/NumericInput'
import { formatTL } from '../../utils/productPricing'
import { YF_TEXT_CLASS } from '../../utils/dashboardDesign'

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_minmax(7rem,1fr)] items-center gap-x-2'
const LABEL_CELL_CLASS = 'flex min-w-0 items-center gap-1 pl-2.5'
const AMOUNT_CLASS =
  'document-totals-amount block w-full text-right text-[14px] font-bold tabular-nums leading-tight tracking-normal text-[var(--muted)]'
const ROW_FRAME =
  'document-frame-only rounded-xl border border-[var(--search-border)] bg-transparent py-2.5 pl-1 pr-2.5'

function TotalRow({ label, value, valueContent, labelAction }) {
  return (
    <div className={`${ROW_FRAME} ${ROW_GRID}`}>
      <div className={`${LABEL_CELL_CLASS} ${labelAction ? 'flex-nowrap' : ''}`.trim()}>
        {label ? <span className={`${YF_TEXT_CLASS} shrink-0`}>{label}</span> : null}
        {labelAction}
      </div>
      {valueContent || <span className={AMOUNT_CLASS}>{formatTL(value ?? 0)}</span>}
    </div>
  )
}

function DiscountModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex h-5 shrink-0 items-center rounded-md border border-[var(--search-border)] p-px">
      <button
        type="button"
        onClick={() => onChange('percent')}
        className={`flex h-4 min-w-[20px] items-center justify-center px-1 text-[12px] font-normal transition-colors ${
          mode === 'percent'
            ? 'text-[#2563eb]'
            : 'text-[var(--muted)] hover:text-[#2563eb]'
        }`}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onChange('amount')}
        className={`flex h-4 min-w-[20px] items-center justify-center px-1 text-[12px] font-normal transition-colors ${
          mode === 'amount'
            ? 'text-[#2563eb]'
            : 'text-[var(--muted)] hover:text-[#2563eb]'
        }`}
      >
        ₺
      </button>
    </div>
  )
}

function CompactNumericInput({ value, onChange, suffix, formatMode = 'plain', wide = false }) {
  return (
    <NumericInput
      value={value}
      onChange={onChange}
      suffix={suffix}
      formatMode={formatMode}
      className={`!h-5 !min-h-0 !max-h-5 !py-0 !text-[13px] !font-normal ${wide ? '!px-2 !pr-7' : '!px-1.5 !pr-5'}`}
    />
  )
}

export default function DocumentTotalsPanel({ totals, onPatch, children, className = '' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    function closeMenu(event) {
      if (menuRef.current?.contains(event.target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [menuOpen])

  if (!totals) return null

  const optionalRows = [
    ['ÖTV', totals.exciseTax, totals.showExciseTax],
    ['Konaklama Vergisi', totals.accommodationTax, totals.showAccommodationTax],
  ].filter(([, , visible]) => visible)

  const discountMode = totals.documentDiscountMode === 'amount' ? 'amount' : 'percent'
  const showLineDiscount = totals.lineDiscount > 0
  const showAddField = !totals.showDocumentDiscount && Boolean(onPatch)

  function enableDocumentDiscount() {
    onPatch?.({
      showDocumentDiscount: true,
      documentDiscountMode: 'percent',
      documentDiscountRate: 0,
      documentDiscountAmount: 0,
    })
    setMenuOpen(false)
  }

  function disableDocumentDiscount() {
    onPatch?.({
      showDocumentDiscount: false,
      documentDiscountRate: 0,
      documentDiscountAmount: 0,
    })
  }

  const araToplam = totals.net ?? totals.subtotal ?? 0
  const kdvToplam = totals.totalTax ?? totals.vat ?? 0
  const genelToplam = araToplam + kdvToplam

  const discountControls = onPatch ? (
    <div className="flex h-5 min-w-0 shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={disableDocumentDiscount}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[var(--muted)] transition-colors hover:text-[#e11d48]"
        title="Toplam indirimi kaldır"
      >
        <X className="h-3 w-3" strokeWidth={2.25} />
      </button>
      <DiscountModeToggle
        mode={discountMode}
        onChange={(nextMode) => onPatch({ documentDiscountMode: nextMode })}
      />
      <div className={`shrink-0 ${discountMode === 'amount' ? 'w-[96px]' : 'w-[72px]'}`}>
        {discountMode === 'percent' ? (
          <CompactNumericInput
            value={totals.documentDiscountRate || 0}
            onChange={(value) => onPatch({ documentDiscountRate: value, showDocumentDiscount: true })}
            suffix="%"
          />
        ) : (
          <CompactNumericInput
            value={totals.documentDiscountAmount || 0}
            onChange={(value) => onPatch({ documentDiscountAmount: value, showDocumentDiscount: true })}
            suffix="₺"
            formatMode="price"
            wide
          />
        )}
      </div>
    </div>
  ) : null

  return (
    <div className={`document-totals-panel flex h-full min-h-0 flex-col space-y-3 ${className}`.trim()}>
      <div className="flex min-h-0 flex-1 flex-col space-y-2.5">
          <div className={`flex items-center gap-2 ${showAddField ? '' : 'pr-0'}`}>
            <div className="min-w-0 flex-1">
              <TotalRow label="Ara Toplam" value={totals.net ?? totals.subtotal} />
            </div>
            {showAddField ? (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="glass-sidebar-toggle flex h-7 w-7 items-center justify-center rounded-xl text-[var(--muted)] transition-colors"
                  data-tone="primary"
                  title="Alan ekle"
                  aria-expanded={menuOpen}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
                {menuOpen && (
                  <div className={`absolute right-0 top-full z-30 mt-1 w-56 p-1.5 ${documentDropdownMenuClass}`}>
                    <button
                      type="button"
                      onClick={enableDocumentDiscount}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-transform hover:scale-[1.02]"
                      data-tone="primary"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0 text-[#2563eb]" strokeWidth={2.25} />
                      <span className={YF_TEXT_CLASS}>İndirim ekle</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-7 shrink-0" aria-hidden />
            )}
          </div>

          {showLineDiscount && (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TotalRow label="Satır İndirimi" value={totals.lineDiscount} />
              </div>
              <div className="w-7 shrink-0" aria-hidden />
            </div>
          )}

          {totals.showDocumentDiscount && (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TotalRow
                  label="İndirim Toplamı"
                  value={totals.documentDiscount}
                  labelAction={discountControls}
                />
              </div>
              <div className="w-7 shrink-0" aria-hidden />
            </div>
          )}

          {optionalRows.map(([label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TotalRow label={label} value={value} />
              </div>
              <div className="w-7 shrink-0" aria-hidden />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <TotalRow label="KDV" value={totals.totalTax ?? totals.vat} />
            </div>
            <div className="w-7 shrink-0" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            <div className={`min-w-0 flex-1 ${ROW_FRAME} ${ROW_GRID}`}>
              <span className={`pl-2.5 ${YF_TEXT_CLASS}`}>Genel Toplam</span>
              <span className={AMOUNT_CLASS}>{formatTL(genelToplam)}</span>
            </div>
            <div className="w-7 shrink-0" aria-hidden />
          </div>
      </div>
      {children}
    </div>
  )
}
