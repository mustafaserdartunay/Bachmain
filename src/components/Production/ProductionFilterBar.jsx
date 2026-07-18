import { FileSpreadsheet, FileText, Columns3 } from 'lucide-react'
import SearchInput from '../Common/SearchInput'
import EditableDropdownPill from '../EditableDropdownPill'
import { LIST_PILL_CLASS } from '../Common/ListDeleteConfirmPanel'

export default function ProductionFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  processOptions,
  statusOptions,
  quantityOptions,
  activeMenu,
  setActiveMenu,
}) {
  return (
    <div className="space-y-3 rounded-[18px] border border-[var(--border)] bg-white/55 p-3 shadow-[0_8px_28px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          wrapperClassName="w-full min-w-0 flex-1"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Sipariş, müşteri veya ürün ara..."
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 text-[12px] font-bold text-[var(--muted)]"
            title="Kolonlar"
          >
            <Columns3 className="h-3.5 w-3.5" />
            Kolonlar
          </button>
          <button
            type="button"
            onClick={() => window.alert('Excel dışa aktarma yakında eklenecek.')}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 text-[12px] font-bold text-[var(--muted)]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 text-[12px] font-bold text-[var(--muted)]"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">Süreç</p>
          <EditableDropdownPill
            value={filters.process}
            options={processOptions}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="filter-process"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => onFilterChange('process', value)}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">Durum</p>
          <EditableDropdownPill
            value={filters.status}
            options={statusOptions}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="filter-status"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => onFilterChange('status', value)}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">Adet / Teslimat</p>
          <EditableDropdownPill
            value={filters.quantity}
            options={quantityOptions}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="filter-quantity"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => onFilterChange('quantity', value)}
          />
        </div>
      </div>
    </div>
  )
}
