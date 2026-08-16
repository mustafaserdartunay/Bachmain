import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { documentDropdownMenuClass } from './documentItemLayout'
import NumericInput from '../Products/NumericInput'
import { formatTL } from '../../utils/productPricing'
import { APP_PANEL_TITLE_CLASS, PAGE_BALANCE_AMOUNT_CLASS } from '../../utils/dashboardDesign'

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_minmax(7rem,1fr)_28px] items-center gap-x-2'
const LABEL_CELL_CLASS = 'flex min-w-0 items-center gap-1.5 pl-2.5'
const AMOUNT_CLASS = `${PAGE_BALANCE_AMOUNT_CLASS} block w-full text-right text-white`
const ACTION_SLOT_CLASS = 'flex w-7 shrink-0 items-center justify-end'

function TotalRow({ label, value, valueContent, labelAction, trailingAction }) {
  return (
    <div className={`${ROW_GRID} border-b border-dark-500/35 py-1.5 text-sm last:border-b-0`}>
      <div className={LABEL_CELL_CLASS}>
        <span className="font-bold text-gray-500">{label}</span>
        {labelAction}
      </div>
      {valueContent || <span className={AMOUNT_CLASS}>{formatTL(value ?? 0)}</span>}
      <div className={ACTION_SLOT_CLASS}>{trailingAction}</div>
    </div>
  )
}

function DiscountModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex shrink-0 rounded-md border border-dark-500/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange('percent')}
        className={`h-6 min-w-[28px] px-1.5 text-[12px] font-bold transition-colors ${
          mode === 'percent' ? 'rounded bg-dark-600 text-gray-200' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onChange('amount')}
        className={`h-6 min-w-[28px] px-1.5 text-[12px] font-bold transition-colors ${
          mode === 'amount' ? 'rounded bg-dark-600 text-gray-200' : 'text-gray-500 hover:text-gray-300'
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
      className={`!h-8 !min-h-0 !py-0 !text-xs ${wide ? '!px-2.5 !pr-9' : '!px-2 !pr-7'}`}
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
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <AppPanelDot color="emerald" />
          <span className={APP_PANEL_TITLE_CLASS}>Toplamlar :</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-dark-500/45 bg-dark-700/35 p-4">
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
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  {menuOpen && (
                    <div className={`absolute right-0 top-full z-30 mt-1 w-56 ${documentDropdownMenuClass}`}>
                      <button
                        type="button"
                        onClick={enableDocumentDiscount}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-300 transition-colors hover:bg-blue-500/15 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5 text-blue-300" /> İndirim ekle
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
                      className="inline-flex h-5 w-5 items-center justify-center text-gray-500 transition-colors hover:text-red-400"
                      title="Toplam indirimi kaldır"
                    >
                      <X className="h-3.5 w-3.5" />
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
          <div className={`${ROW_GRID} mt-auto rounded-xl bg-emerald-500/10 py-3`}>
            <span className="pl-2.5 text-sm font-bold text-emerald-300">Genel Toplam</span>
            <span className={`${AMOUNT_CLASS} customer-balance-positive`}>
              {formatTL(totals.grandTotal)}
            </span>
            <span />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
