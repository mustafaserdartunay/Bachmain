import { useEffect, useMemo, useState } from 'react'
import { Percent, Trophy } from 'lucide-react'
import OptionListPanel from './OptionListPanel'
import AddProcessHeadingForm from './AddProcessHeadingForm'
import CollapsibleProcessSection from './CollapsibleProcessSection'
import SortableProcessList from './SortableProcessList'
import {
  DEFAULT_SALES_REP_SETTINGS,
  loadSalesRepSettings,
  saveSalesRepSettings,
  saveSalesRepTaskStages,
} from '../../utils/salesRepSettingsStore'
import { readOptionLists, removeOptionListField, saveOptionList } from '../../utils/customerMeta'
import {
  addCustomProcessPanel,
  CUSTOM_PROCESS_PANELS_EVENT,
  loadCustomProcessPanels,
  removeCustomProcessPanel,
} from '../../utils/customProcessPanelsStore'
import {
  OPTION_SECTION_PROCESS_ORDER_EVENT,
  reorderOptionSectionProcessOrder,
  resolveOptionSectionProcessRows,
  syncOptionSectionProcessOrderWithPanels,
} from '../../utils/optionSectionProcessOrderStore'

export default function SalesRepProcessSettingsPanel({ dragHandleProps = null }) {
  const [settings, setSettings] = useState(() => loadSalesRepSettings())
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [customPanels, setCustomPanels] = useState(() => loadCustomProcessPanels().salesRep || [])
  const [processRows, setProcessRows] = useState(() => {
    syncOptionSectionProcessOrderWithPanels('salesRep')
    return resolveOptionSectionProcessRows('salesRep')
  })

  useEffect(() => {
    function refresh() {
      setSettings(loadSalesRepSettings())
    }
    function refreshOptions() {
      setOptionLists(readOptionLists())
    }
    function refreshPanels() {
      setCustomPanels(loadCustomProcessPanels().salesRep || [])
      syncOptionSectionProcessOrderWithPanels('salesRep')
      setProcessRows(resolveOptionSectionProcessRows('salesRep'))
    }
    function refreshOrder() {
      setProcessRows(resolveOptionSectionProcessRows('salesRep'))
    }
    window.addEventListener('bach:sales-rep-settings-updated', refresh)
    window.addEventListener('bach:option-lists-updated', refreshOptions)
    window.addEventListener(CUSTOM_PROCESS_PANELS_EVENT, refreshPanels)
    window.addEventListener(OPTION_SECTION_PROCESS_ORDER_EVENT, refreshOrder)
    return () => {
      window.removeEventListener('bach:sales-rep-settings-updated', refresh)
      window.removeEventListener('bach:option-lists-updated', refreshOptions)
      window.removeEventListener(CUSTOM_PROCESS_PANELS_EVENT, refreshPanels)
      window.removeEventListener(OPTION_SECTION_PROCESS_ORDER_EVENT, refreshOrder)
    }
  }, [])

  function updateNumber(field, value) {
    const next = saveSalesRepSettings({ [field]: Math.max(0, Number(value) || 0) })
    setSettings(next)
  }

  function updateStages(nextStages) {
    const next = saveSalesRepTaskStages(nextStages)
    setSettings(next)
  }

  function handleAddPanel(title) {
    const next = addCustomProcessPanel('salesRep', title)
    setCustomPanels(next.salesRep || [])
    const created = (next.salesRep || []).at(-1)
    if (created?.fieldKey) {
      saveOptionList(created.fieldKey, [])
      setOptionLists(readOptionLists())
    }
    syncOptionSectionProcessOrderWithPanels('salesRep')
    setProcessRows(resolveOptionSectionProcessRows('salesRep'))
  }

  function handleRemovePanel(panel) {
    removeCustomProcessPanel('salesRep', panel.id)
    setCustomPanels(loadCustomProcessPanels().salesRep || [])
    if (panel.fieldKey) {
      removeOptionListField(panel.fieldKey)
      setOptionLists(readOptionLists())
    }
    syncOptionSectionProcessOrderWithPanels('salesRep')
    setProcessRows(resolveOptionSectionProcessRows('salesRep'))
  }

  function handleReorder(fromIndex, toIndex) {
    reorderOptionSectionProcessOrder('salesRep', fromIndex, toIndex)
    setProcessRows(resolveOptionSectionProcessRows('salesRep'))
  }

  const summary = useMemo(() => {
    const parts = ['Prim', 'Puan', ...processRows.map((row) => row.title)]
    return parts.filter(Boolean).join(' · ')
  }, [processRows])

  return (
    <CollapsibleProcessSection
      title="Satış Temsilcileri Süreçleri"
      summary={summary}
      dragHandleProps={dragHandleProps}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-dark-500/45 bg-dark-800/55 p-4">
          <div className="mb-3 flex items-center gap-2 text-emerald-300">
            <Percent className="h-4 w-4" />
            <p className="text-sm font-black">Prim Oranları</p>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="form-label">Standart Satış Primi (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="form-input text-sm"
                value={settings.baseCommissionRate}
                onChange={(e) => updateNumber('baseCommissionRate', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Ayın Birincisi Primi (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="form-input text-sm"
                value={settings.winnerCommissionRate}
                onChange={(e) => updateNumber('winnerCommissionRate', e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-dark-500/45 bg-dark-800/55 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <Trophy className="h-4 w-4" />
            <p className="text-sm font-black">Yarış Puanları</p>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="form-label">Satış Başına Puan</span>
              <input
                type="number"
                min="0"
                className="form-input text-sm"
                value={settings.pointsPerSale}
                onChange={(e) => updateNumber('pointsPerSale', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Teklif Başına Puan</span>
              <input
                type="number"
                min="0"
                className="form-input text-sm"
                value={settings.pointsPerQuote}
                onChange={(e) => updateNumber('pointsPerQuote', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="form-label">Tamamlanan Görev Puanı</span>
              <input
                type="number"
                min="0"
                className="form-input text-sm"
                value={settings.pointsPerTask}
                onChange={(e) => updateNumber('pointsPerTask', e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      <SortableProcessList
        items={processRows}
        getKey={(row) => row.fieldKey}
        onReorder={handleReorder}
        renderItem={(row, _index, rowDragHandleProps) => {
          if (row.special === 'salesRepTaskStages') {
            return (
              <OptionListPanel
                title={row.title}
                description={row.description}
                options={settings.taskStages}
                onChange={updateStages}
                placeholder={row.placeholder}
                activeLabel={row.activeLabel}
                countSuffix={row.countSuffix}
                emptyMessage={row.emptyMessage}
                compact
                dragHandleProps={rowDragHandleProps}
              />
            )
          }
          return (
            <OptionListPanel
              title={row.title}
              description={row.description}
              options={optionLists[row.fieldKey] || []}
              onChange={(next) => {
                saveOptionList(row.fieldKey, next)
                setOptionLists(readOptionLists())
              }}
              placeholder={row.placeholder}
              activeLabel={row.activeLabel}
              countSuffix={row.countSuffix}
              emptyMessage={row.emptyMessage}
              onRemove={row.builtin ? undefined : () => handleRemovePanel(row.panel)}
              compact
              dragHandleProps={rowDragHandleProps}
            />
          )
        }}
      />

      <AddProcessHeadingForm
        placeholder="Yeni satış temsilcisi süreci başlığı..."
        onAdd={handleAddPanel}
      />

      <p className="text-[13px] text-gray-500">
        Varsayılan prim: %{DEFAULT_SALES_REP_SETTINGS.baseCommissionRate} · Ay birincisi: %
        {DEFAULT_SALES_REP_SETTINGS.winnerCommissionRate}
      </p>
    </CollapsibleProcessSection>
  )
}
