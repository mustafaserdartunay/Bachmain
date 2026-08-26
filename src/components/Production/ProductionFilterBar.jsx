import SearchInput from '../Common/SearchInput'
import EditableDropdownPill from '../EditableDropdownPill'
import { AppPanelDot } from '../Layout/AppPageLayout'
import {
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  YF_TEXT_CLASS,
} from '../../utils/dashboardDesign'

/**
 * Customers-page style filter strip for production list.
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
  showSearch = false,
}) {
  return (
    <div className="space-y-3">
      {showSearch ? (
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Sipariş, müşteri veya ürün ara..."
        />
      ) : null}
      <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-2 px-1">
          <AppPanelDot color="blue" />
          <span className={YF_TEXT_CLASS}>Filtre :</span>
        </div>
        <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className={PAGE_FILTER_FIELD_CLASS}>
            <p className={PAGE_FILTER_LABEL_CLASS}>Süreç :</p>
            <EditableDropdownPill
              value={filters.process}
              options={processOptions}
              includePlaceholderOption={false}
              editable={false}
              buttonClassName={PAGE_FILTER_PILL_CLASS}
              menuClassName={PAGE_FILTER_MENU_CLASS}
              openKey="filter-process"
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              onChange={(value) => onFilterChange('process', value)}
            />
          </div>
          <div className={PAGE_FILTER_FIELD_CLASS}>
            <p className={PAGE_FILTER_LABEL_CLASS}>Durum :</p>
            <EditableDropdownPill
              value={filters.status}
              options={statusOptions}
              includePlaceholderOption={false}
              editable={false}
              buttonClassName={PAGE_FILTER_PILL_CLASS}
              menuClassName={PAGE_FILTER_MENU_CLASS}
              openKey="filter-status"
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              onChange={(value) => onFilterChange('status', value)}
            />
          </div>
          <div className={PAGE_FILTER_FIELD_CLASS}>
            <p className={PAGE_FILTER_LABEL_CLASS}>Adet / Teslimat :</p>
            <EditableDropdownPill
              value={filters.quantity}
              options={quantityOptions}
              includePlaceholderOption={false}
              editable={false}
              buttonClassName={PAGE_FILTER_PILL_CLASS}
              menuClassName={PAGE_FILTER_MENU_CLASS}
              openKey="filter-quantity"
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              onChange={(value) => onFilterChange('quantity', value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
