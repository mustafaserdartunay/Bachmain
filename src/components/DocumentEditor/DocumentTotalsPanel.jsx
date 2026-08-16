import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { documentDropdownMenuClass } from './documentItemLayout'
import NumericInput from '../Products/NumericInput'
import { formatTL } from '../../utils/productPricing'
import {
  APP_PANEL_TITLE_CLASS,
  YF_TEXT_CLASS,
} from '../../utils/dashboardDesign'

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_minmax(7rem,1fr)_28px] items-center gap-x-2'
const LABEL_CELL_CLASS = 'flex min-w-0 items-center gap-1.5 pl-2.5'
const AMOUNT_CLASS =
  'block w-full text-right text-[14px] font-bold tabular-nums leading-tight tracking-normal text-[var(--muted)]'
const ACTION_SLOT_CLASS = 'flex w-7 shrink-0 items-center justify-end'
const ROW_FRAME =
  'document-frame-only rounded-xl border border-[var(--search-border)] bg-transparent px-1 py-2.5'

function TotalRow({ label, value, valueContent, labelAction, trailingAction }) {
  return (
    <div className={`${ROW_FRAME} ${ROW_GRID}`}>
      <div className={LABEL_CELL_CLASS}>
        <span className={YF_TEXT_CLASS}>{label}</span>
        {labelAction}
      </div>
      {valueContent || <span className={AMOUNT_CLASS}>{formatTL(value ?? 0)}</span>}
      <div className={ACTION_SLOT_CLASS}>{trailingAction}</div>
    </div>
  )
}

function DiscountModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex shrink-0 rounded-md border border-[var(--search-border)] p-0.5">
      <button
        type="button"
        onClick={() => onChange('percent')}
        className={`h-6 min-w-[28px] px-1.5 text-[14px] font-normal transition-colors ${
          mode === 'percent' ? 'rounded bg-[var(--glass-bg)] text-[var(--ink)]' : 'text-[var(--muted)]'
        }`}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onChange('amount')}
        className={`h-6 min-w-[28px] px-1.5 text-[14px] font-normal transition-colors ${
          mode === 'amount' ? 'rounded bg-[var(--glass-bg)] text-[var(--ink)]' : 'text-[var(--muted)]'
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
      className={`!h-8 !min-h-0 !py-0 !text-[14px] !font-normal ${wide ? '!px-2.5 !pr-9' : '!px-2 !pr-7'}`}
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

  return (
    <div className={`flex h-full min-h-0 flex-col space-y-3 ${className}`.trim()}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2.5 flex min-w-0 items-center gap-2">
          <AppPanelDot color="blue" />
          <span className={APP_PANEL_TITLE_CLASS}>Toplamlar :</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col space-y-2.5">
          <TotalRow
            label="Ara Toplam"
            value={totals.subtotal}
            trailingAction={
              !totals.showDocumentDiscount && onPatch ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((current) => !current)}
                    className="glass-sidebar-toggle flex h-7 w-7 items-center justify-center rounded-xl"
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
              ) : null
            }
          />

          {showLineDiscount && <TotalRow label="Satır İndirimi" value={totals.lineDiscount} />}

          {totals.showDocumentDiscount && (
            <TotalRow
              label="Toplam İndirim"
              value={totals.documentDiscount}
              labelAction={
                onPatch ? (
                  <div className="ml-1.5 flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={disableDocumentDiscount}
                      className="inline-flex h-5 w-5 items-center justify-center text-[var(--muted)] transition-colors hover:text-[#e11d48]"
                      title="Toplam indirimi kaldır"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                    <DiscountModeToggle
                      mode={discountMode}
                      onChange={(nextMode) => onPatch({ documentDiscountMode: nextMode })}
                    />
                    <div className={discountMode === 'amount' ? 'w-[120px]' : 'w-[88px]'}>
                      {discountMode === 'percent' ? (
                        <CompactNumericInput
                          value={totals.documentDiscountRate || 0}
                          onChange={(value) =>
                            onPatch({ documentDiscountRate: value, showDocumentDiscount: true })
                          }
                          suffix="%"
                        />
                      ) : (
                        <CompactNumericInput
                          value={totals.documentDiscountAmount || 0}
                          onChange={(value) =>
                            onPatch({ documentDiscountAmount: value, showDocumentDiscount: true })
                          }
                          suffix="₺"
                          formatMode="price"
                          wide
                        />
                      )}
                    </div>
                  </div>
                ) : null
              }
            />
          )}

          {optionalRows.map(([label, value]) => (
            <TotalRow key={label} label={label} value={value} />
          ))}
          <TotalRow label="KDV" value={totals.vat} />
          <div className={`${ROW_FRAME} ${ROW_GRID}`}>
            <span className={`pl-2.5 ${YF_TEXT_CLASS}`}>Genel Toplam</span>
            <span className={AMOUNT_CLASS}>{formatTL(totals.grandTotal)}</span>
            <span />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
