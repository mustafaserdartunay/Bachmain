import SearchInput from '../Common/SearchInput'
import EditableDropdownPill from '../EditableDropdownPill'
import { LIST_PILL_CLASS } from '../Common/ListDeleteConfirmPanel'

/**
 * Quotes/Orders-style filter strip: search + dark pill grid (no glass card chrome).
 */
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
    <div className="mb-4 space-y-3">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Sipariş, müşteri veya ürün ara..."
      />
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/70 p-3 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">
            Süreç
          </p>
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
          <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">
            Durum
          </p>
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
          <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">
            Adet / Teslimat
          </p>
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
