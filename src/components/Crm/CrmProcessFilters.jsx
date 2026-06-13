import { Search } from 'lucide-react'
import DateRangePicker from '../Common/DateRangePicker'
import EditableDropdownPill from '../EditableDropdownPill'
import { LIST_PILL_CLASS } from '../../utils/crmMeta'
import {
  CRM_OVERDUE_FILTER_OPTIONS,
  CRM_WHATSAPP_FILTER_OPTIONS,
  getCrmAssigneeFilterOptions,
  getCrmStageFilterOptions,
  getCrmTemplateFilterOptions,
} from '../../utils/crmProcessFilterUtils'

function FilterField({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="mb-2 whitespace-nowrap text-[10px] font-black uppercase tracking-wider text-gray-500">{label}</p>
      {children}
    </div>
  )
}

export default function CrmProcessFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  activeMenu,
  setActiveMenu,
}) {
  const assigneeOptions = getCrmAssigneeFilterOptions()
  const templateOptions = getCrmTemplateFilterOptions()
  const stageOptions = getCrmStageFilterOptions()

  function updateFilter(field, value) {
    onFilterChange((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Başlık, müşteri, temsilci veya içerik ara..."
          className="form-input pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/70 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <FilterField label="Tarih Aralığı">
          <DateRangePicker
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            timeFrom={filters.timeFrom}
            timeTo={filters.timeTo}
            includeTime={filters.includeTime}
            onChange={(value) => onFilterChange((current) => ({ ...current, ...value }))}
          />
        </FilterField>

        <FilterField label="Sorumlu Temsilci">
          <EditableDropdownPill
            value={filters.assignee}
            options={assigneeOptions}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="crm-filter-assignee"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => updateFilter('assignee', value)}
          />
        </FilterField>

        <FilterField label="Süreç Türü">
          <EditableDropdownPill
            value={filters.template}
            options={templateOptions}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="crm-filter-template"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => updateFilter('template', value)}
          />
        </FilterField>

        <FilterField label="Süreç Aşaması">
          <EditableDropdownPill
            value={filters.stage}
            options={stageOptions}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="crm-filter-stage"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => updateFilter('stage', value)}
          />
        </FilterField>

        <FilterField label="WhatsApp">
          <EditableDropdownPill
            value={filters.whatsapp}
            options={CRM_WHATSAPP_FILTER_OPTIONS}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="crm-filter-whatsapp"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => updateFilter('whatsapp', value)}
          />
        </FilterField>

        <FilterField label="Gecikme">
          <EditableDropdownPill
            value={filters.overdue}
            options={CRM_OVERDUE_FILTER_OPTIONS}
            includePlaceholderOption={false}
            editable={false}
            buttonClassName={LIST_PILL_CLASS}
            openKey="crm-filter-overdue"
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => updateFilter('overdue', value)}
          />
        </FilterField>
      </div>
    </div>
  )
}
