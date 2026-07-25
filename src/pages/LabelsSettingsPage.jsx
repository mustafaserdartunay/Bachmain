import { useEffect, useMemo, useState } from 'react'
import { Workflow } from 'lucide-react'
import OptionListPanel from '../components/Settings/OptionListPanel'
import AddProcessHeadingForm from '../components/Settings/AddProcessHeadingForm'
import CollapsibleProcessSection from '../components/Settings/CollapsibleProcessSection'
import SortableProcessList from '../components/Settings/SortableProcessList'
import CrmProcessTemplatesSettingsPanel from '../components/Settings/CrmProcessTemplatesSettingsPanel'
import NoteProcessTemplatesSettingsPanel from '../components/Settings/NoteProcessTemplatesSettingsPanel'
import {
  WorkflowStagesSection,
  WorkflowStagesSettingsProvider,
} from '../components/Settings/WorkflowStagesSettingsPanel'
import SalesRepProcessSettingsPanel from '../components/Settings/SalesRepProcessSettingsPanel'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import {
  OPTION_LISTS_KEY,
  OPTION_LISTS_UPDATED_EVENT,
  readOptionLists,
  removeOptionListField,
  saveOptionList,
} from '../utils/customerMeta'
import { appendActivityEntry } from '../utils/activityArchiveStore'
import {
  addCustomProcessPanel,
  CUSTOM_PROCESS_PANELS_EVENT,
  loadCustomProcessPanels,
  removeCustomProcessPanel,
} from '../utils/customProcessPanelsStore'
import {
  CUSTOMER_PROCESS_ORDER_EVENT,
  reorderCustomerProcessOrder,
  resolveCustomerProcessRows,
  syncCustomerProcessOrderWithPanels,
} from '../utils/customerProcessOrderStore'
import {
  LABELS_SETTINGS_SECTION_ORDER_EVENT,
  loadLabelsSettingsSectionOrder,
  reorderLabelsSettingsSectionOrder,
} from '../utils/labelsSettingsSectionOrderStore'
import {
  OPTION_SECTION_PROCESS_ORDER_EVENT,
  reorderOptionSectionProcessOrder,
  resolveOptionSectionProcessRows,
  syncOptionSectionProcessOrderWithPanels,
} from '../utils/optionSectionProcessOrderStore'

function SortableOptionProcessList({
  sectionId,
  rows,
  optionLists,
  onUpdateList,
  onRemovePanel,
  onReorder,
}) {
  return (
    <SortableProcessList
      items={rows}
      getKey={(row) => row.fieldKey}
      onReorder={onReorder}
      renderItem={(row, _index, dragHandleProps) => (
        <OptionListPanel
          compact
          title={row.title}
          description={row.description}
          options={optionLists[row.fieldKey] || []}
          onChange={(next) => onUpdateList(row.fieldKey, next)}
          placeholder={row.placeholder}
          activeLabel={row.activeLabel}
          countSuffix={row.countSuffix}
          emptyMessage={row.emptyMessage}
          onRemove={row.builtin ? undefined : () => onRemovePanel(sectionId, row.panel)}
          dragHandleProps={dragHandleProps}
        />
      )}
    />
  )
}

function sectionSummary(titles = []) {
  return titles.filter(Boolean).join(' · ')
}

export default function LabelsSettingsPage() {
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [customPanels, setCustomPanels] = useState(() => loadCustomProcessPanels())
  const [sectionOrder, setSectionOrder] = useState(() => loadLabelsSettingsSectionOrder())
  const [customerProcessRows, setCustomerProcessRows] = useState(() => {
    syncCustomerProcessOrderWithPanels()
    return resolveCustomerProcessRows()
  })
  const [statusRows, setStatusRows] = useState(() => {
    syncOptionSectionProcessOrderWithPanels('status')
    return resolveOptionSectionProcessRows('status')
  })
  const [categoryRows, setCategoryRows] = useState(() => {
    syncOptionSectionProcessOrderWithPanels('category')
    return resolveOptionSectionProcessRows('category')
  })
  const [cashRows, setCashRows] = useState(() => {
    syncOptionSectionProcessOrderWithPanels('cash')
    return resolveOptionSectionProcessRows('cash')
  })
  const [tagsRows, setTagsRows] = useState(() => {
    syncOptionSectionProcessOrderWithPanels('tags')
    return resolveOptionSectionProcessRows('tags')
  })

  useEffect(() => {
    function refresh() {
      setOptionLists(readOptionLists())
    }
    function refreshPanels() {
      setCustomPanels(loadCustomProcessPanels())
      syncCustomerProcessOrderWithPanels()
      setCustomerProcessRows(resolveCustomerProcessRows())
      ;['status', 'category', 'cash', 'tags'].forEach((sectionId) => {
        syncOptionSectionProcessOrderWithPanels(sectionId)
      })
      setStatusRows(resolveOptionSectionProcessRows('status'))
      setCategoryRows(resolveOptionSectionProcessRows('category'))
      setCashRows(resolveOptionSectionProcessRows('cash'))
      setTagsRows(resolveOptionSectionProcessRows('tags'))
    }
    function refreshCustomerOrder() {
      setCustomerProcessRows(resolveCustomerProcessRows())
    }
    function refreshOptionSectionOrder() {
      setStatusRows(resolveOptionSectionProcessRows('status'))
      setCategoryRows(resolveOptionSectionProcessRows('category'))
      setCashRows(resolveOptionSectionProcessRows('cash'))
      setTagsRows(resolveOptionSectionProcessRows('tags'))
    }
    function refreshSectionOrder() {
      setSectionOrder(loadLabelsSettingsSectionOrder())
    }
    window.addEventListener(OPTION_LISTS_UPDATED_EVENT, refresh)
    window.addEventListener(CUSTOM_PROCESS_PANELS_EVENT, refreshPanels)
    window.addEventListener(CUSTOMER_PROCESS_ORDER_EVENT, refreshCustomerOrder)
    window.addEventListener(OPTION_SECTION_PROCESS_ORDER_EVENT, refreshOptionSectionOrder)
    window.addEventListener(LABELS_SETTINGS_SECTION_ORDER_EVENT, refreshSectionOrder)
    function onStorage(event) {
      if (event.key === OPTION_LISTS_KEY || event.key === null) {
        refresh()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(OPTION_LISTS_UPDATED_EVENT, refresh)
      window.removeEventListener(CUSTOM_PROCESS_PANELS_EVENT, refreshPanels)
      window.removeEventListener(CUSTOMER_PROCESS_ORDER_EVENT, refreshCustomerOrder)
      window.removeEventListener(OPTION_SECTION_PROCESS_ORDER_EVENT, refreshOptionSectionOrder)
      window.removeEventListener(LABELS_SETTINGS_SECTION_ORDER_EVENT, refreshSectionOrder)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  function updateList(field, nextOptions) {
    const currentOptions = optionLists[field] || []
    currentOptions
      .filter(
        (option) =>
          !nextOptions.some(
            (nextOption) => nextOption.id === option.id || nextOption.label === option.label,
          ),
      )
      .forEach((option) => {
        appendActivityEntry({
          module: 'workflow',
          action: 'delete',
          entityType: 'option',
          entityId: option.id || option.label,
          entityLabel: option.label,
          description: `${option.label} seçeneği silindi.`,
          snapshot: { field, option },
          undo: { type: 'settings.restoreOption' },
        })
      })
    setOptionLists(saveOptionList(field, nextOptions))
  }

  function handleAddPanel(sectionId, title) {
    const next = addCustomProcessPanel(sectionId, title)
    setCustomPanels(next)
    const created = (next[sectionId] || []).at(-1)
    if (created?.fieldKey) {
      saveOptionList(created.fieldKey, [])
      setOptionLists(readOptionLists())
    }
    if (sectionId === 'customer') {
      syncCustomerProcessOrderWithPanels()
      setCustomerProcessRows(resolveCustomerProcessRows())
      return
    }
    if (['status', 'category', 'cash', 'tags'].includes(sectionId)) {
      syncOptionSectionProcessOrderWithPanels(sectionId)
      const resolve = {
        status: setStatusRows,
        category: setCategoryRows,
        cash: setCashRows,
        tags: setTagsRows,
      }[sectionId]
      resolve?.(resolveOptionSectionProcessRows(sectionId))
    }
  }

  function handleRemovePanel(sectionId, panel) {
    removeCustomProcessPanel(sectionId, panel.id)
    setCustomPanels(loadCustomProcessPanels())
    if (panel.fieldKey) {
      removeOptionListField(panel.fieldKey)
      setOptionLists(readOptionLists())
    }
    if (sectionId === 'customer') {
      syncCustomerProcessOrderWithPanels()
      setCustomerProcessRows(resolveCustomerProcessRows())
      return
    }
    if (['status', 'category', 'cash', 'tags'].includes(sectionId)) {
      syncOptionSectionProcessOrderWithPanels(sectionId)
      const resolve = {
        status: setStatusRows,
        category: setCategoryRows,
        cash: setCashRows,
        tags: setTagsRows,
      }[sectionId]
      resolve?.(resolveOptionSectionProcessRows(sectionId))
    }
  }

  function handleReorderCustomerProcesses(fromIndex, toIndex) {
    reorderCustomerProcessOrder(fromIndex, toIndex)
    setCustomerProcessRows(resolveCustomerProcessRows())
  }

  function handleReorderOptionSection(sectionId, setter, fromIndex, toIndex) {
    reorderOptionSectionProcessOrder(sectionId, fromIndex, toIndex)
    setter(resolveOptionSectionProcessRows(sectionId))
  }

  function handleReorderSections(fromIndex, toIndex) {
    setSectionOrder(reorderLabelsSettingsSectionOrder(fromIndex, toIndex))
  }

  const customerSummary = useMemo(
    () => customerProcessRows.map((row) => row.title).join(' · '),
    [customerProcessRows],
  )

  const statusSummary = useMemo(
    () => sectionSummary(statusRows.map((row) => row.title)),
    [statusRows],
  )

  const categorySummary = useMemo(
    () => sectionSummary(categoryRows.map((row) => row.title)),
    [categoryRows],
  )

  const cashSummary = useMemo(() => sectionSummary(cashRows.map((row) => row.title)), [cashRows])

  const tagsSummary = useMemo(() => sectionSummary(tagsRows.map((row) => row.title)), [tagsRows])

  function handleRestoreArchiveEntry(entry) {
    const field = entry.snapshot?.field
    const option = entry.snapshot?.option
    if (!field || !option) return false
    const current = readOptionLists()
    const list = current[field] || []
    if (!list.some((item) => item.id === option.id || item.label === option.label)) {
      const next = [...list, option]
      saveOptionList(field, next)
      setOptionLists((state) => ({ ...state, [field]: next }))
    }
    return true
  }

  function renderPageSection(sectionId, dragHandleProps) {
    switch (sectionId) {
      case 'quote':
      case 'order':
      case 'depo':
      case 'production':
      case 'dashboard':
        return <WorkflowStagesSection id={sectionId} dragHandleProps={dragHandleProps} />
      case 'crm':
        return <CrmProcessTemplatesSettingsPanel dragHandleProps={dragHandleProps} />
      case 'note':
        return <NoteProcessTemplatesSettingsPanel dragHandleProps={dragHandleProps} />
      case 'salesRep':
        return <SalesRepProcessSettingsPanel dragHandleProps={dragHandleProps} />
      case 'status':
        return (
          <CollapsibleProcessSection
            title="Durum"
            summary={statusSummary}
            dragHandleProps={dragHandleProps}
          >
            <SortableOptionProcessList
              sectionId="status"
              rows={statusRows}
              optionLists={optionLists}
              onUpdateList={updateList}
              onRemovePanel={handleRemovePanel}
              onReorder={(from, to) =>
                handleReorderOptionSection('status', setStatusRows, from, to)
              }
            />
            <AddProcessHeadingForm
              placeholder="Yeni durum süreci başlığı..."
              onAdd={(title) => handleAddPanel('status', title)}
            />
          </CollapsibleProcessSection>
        )
      case 'customer':
        return (
          <CollapsibleProcessSection
            title="Müşteriler"
            summary={customerSummary}
            dragHandleProps={dragHandleProps}
          >
            <SortableOptionProcessList
              sectionId="customer"
              rows={customerProcessRows}
              optionLists={optionLists}
              onUpdateList={updateList}
              onRemovePanel={handleRemovePanel}
              onReorder={handleReorderCustomerProcesses}
            />
            <AddProcessHeadingForm
              placeholder="Yeni müşteri süreci başlığı..."
              onAdd={(title) => handleAddPanel('customer', title)}
            />
          </CollapsibleProcessSection>
        )
      case 'category':
        return (
          <CollapsibleProcessSection
            title="Kategori Süreçleri"
            summary={categorySummary}
            dragHandleProps={dragHandleProps}
          >
            <SortableOptionProcessList
              sectionId="category"
              rows={categoryRows}
              optionLists={optionLists}
              onUpdateList={updateList}
              onRemovePanel={handleRemovePanel}
              onReorder={(from, to) =>
                handleReorderOptionSection('category', setCategoryRows, from, to)
              }
            />
            <AddProcessHeadingForm
              placeholder="Yeni kategori süreci başlığı..."
              onAdd={(title) => handleAddPanel('category', title)}
            />
          </CollapsibleProcessSection>
        )
      case 'cash':
        return (
          <CollapsibleProcessSection
            title="Kasa Oluşturma Süreçleri"
            summary={cashSummary}
            dragHandleProps={dragHandleProps}
          >
            <SortableOptionProcessList
              sectionId="cash"
              rows={cashRows}
              optionLists={optionLists}
              onUpdateList={updateList}
              onRemovePanel={handleRemovePanel}
              onReorder={(from, to) => handleReorderOptionSection('cash', setCashRows, from, to)}
            />
            <AddProcessHeadingForm
              placeholder="Yeni kasa süreci başlığı..."
              onAdd={(title) => handleAddPanel('cash', title)}
            />
          </CollapsibleProcessSection>
        )
      case 'tags':
        return (
          <CollapsibleProcessSection
            title="Etiketler"
            summary={tagsSummary}
            dragHandleProps={dragHandleProps}
          >
            <SortableOptionProcessList
              sectionId="tags"
              rows={tagsRows}
              optionLists={optionLists}
              onUpdateList={updateList}
              onRemovePanel={handleRemovePanel}
              onReorder={(from, to) => handleReorderOptionSection('tags', setTagsRows, from, to)}
            />
            <AddProcessHeadingForm
              placeholder="Yeni etiket süreci başlığı..."
              onAdd={(title) => handleAddPanel('tags', title)}
            />
          </CollapsibleProcessSection>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <Workflow className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">
              Süreçler Yönetimi
            </h1>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Süreç, durum, tip, puantaj ve kategori listelerini merkezi olarak yönetin. Bölümleri
              sürükleyerek sıralayabilirsiniz.
            </p>
          </div>
        </div>
      </section>

      <WorkflowStagesSettingsProvider>
        <SortableProcessList
          className="flex flex-col gap-5"
          items={sectionOrder}
          getKey={(id) => id}
          onReorder={handleReorderSections}
          renderItem={(sectionId, _index, dragHandleProps) =>
            renderPageSection(sectionId, dragHandleProps)
          }
        />
      </WorkflowStagesSettingsProvider>

      <ActivityArchivePanel
        title="Süreçler Arşiv ve İşlem Geçmişi"
        modules={['workflow']}
        onRestore={handleRestoreArchiveEntry}
      />
    </div>
  )
}
