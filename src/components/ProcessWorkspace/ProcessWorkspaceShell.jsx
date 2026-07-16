import { useEffect, useMemo, useState } from 'react'
import ProcessViewSwitcher from './ProcessViewSwitcher'
import ProcessFilterBar from './ProcessFilterBar'
import ProcessListView from './ProcessListView'
import ProcessKanbanView from './ProcessKanbanView'
import ProcessCalendarView from './ProcessCalendarView'
import ProcessCardView from './ProcessCardView'
import ProcessTimelineView from './ProcessTimelineView'
import ProcessGanttView from './ProcessGanttView'
import ProcessItemDrawer from './ProcessItemDrawer'
import { createEmptyFilters, filterProcessItems } from './normalize'
import { getModuleViewPref, setModuleViewPref } from './prefs'
import { getModuleCatalog } from './moduleStages'

/**
 * Shared process workspace shell — Liste / Kanban / Takvim / Gantt / Timeline / Kart
 */
export default function ProcessWorkspaceShell({
  moduleId = 'crm',
  items = [],
  stages: stagesProp,
  defaultView,
  hideFilterBar = false,
  toolbarExtra = null,
  boardSlot = null,
  onStageChange,
  onDateChange,
  onOpenItem,
  onAiAction,
  selectedIds,
  onBulkAction,
  className = '',
}) {
  const catalog = getModuleCatalog(moduleId)
  const stages = stagesProp?.length ? stagesProp : catalog.stages
  const [view, setView] = useState(() => getModuleViewPref(moduleId, defaultView || 'kanban'))
  const [filters, setFilters] = useState(createEmptyFilters)
  const [activeItem, setActiveItem] = useState(null)
  const [bulkSelected, setBulkSelected] = useState(() => new Set(selectedIds || []))

  useEffect(() => {
    setView(getModuleViewPref(moduleId, defaultView || 'kanban'))
  }, [moduleId, defaultView])

  const filtered = useMemo(() => filterProcessItems(items, filters), [items, filters])

  const assignees = useMemo(() => {
    const set = new Set()
    for (const item of items) {
      if (item.assignee) set.add(item.assignee)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'))
  }, [items])

  function handleViewChange(next) {
    setView(next)
    setModuleViewPref(moduleId, next)
  }

  function openItem(item) {
    setActiveItem(item)
    onOpenItem?.(item)
  }

  function handleStageChange(itemId, stageId) {
    onStageChange?.(itemId, stageId)
  }

  function runBulk(action) {
    onBulkAction?.(action, [...bulkSelected])
  }

  return (
    <div className={`process-workspace ${className}`.trim()}>
      <div className="process-workspace__top">
        <div className="process-workspace__top-left">
          <h2 className="process-workspace__module">{catalog.label}</h2>
          {toolbarExtra}
        </div>
        <ProcessViewSwitcher value={view} onChange={handleViewChange} />
      </div>

      {!hideFilterBar && !(view === 'card' && boardSlot) ? (
        <ProcessFilterBar filters={filters} onChange={setFilters} stages={stages} assignees={assignees} />
      ) : null}

      {onBulkAction ? (
        <div className="process-bulk-bar">
          <span>{bulkSelected.size} seçili</span>
          {[
            ['move', 'Toplu taşı'],
            ['delete', 'Toplu sil'],
            ['tag', 'Toplu etiket'],
            ['assignee', 'Sorumlu değiştir'],
            ['status', 'Durum değiştir'],
            ['pdf', 'Toplu PDF'],
            ['mail', 'Toplu Mail'],
            ['whatsapp', 'Toplu WhatsApp'],
          ].map(([id, label]) => (
            <button key={id} type="button" className="process-btn" disabled={!bulkSelected.size} onClick={() => runBulk(id)}>
              {label}
            </button>
          ))}
          <button type="button" className="process-btn" onClick={() => setBulkSelected(new Set())}>
            Temizle
          </button>
        </div>
      ) : null}

      <div className="process-workspace__body">
        {view === 'list' && <ProcessListView items={filtered} onOpenItem={openItem} />}
        {view === 'kanban' && (
          <ProcessKanbanView
            items={filtered}
            stages={stages}
            onStageChange={handleStageChange}
            onOpenItem={openItem}
          />
        )}
        {view === 'calendar' && (
          <ProcessCalendarView items={filtered} onOpenItem={openItem} onDateChange={onDateChange} />
        )}
        {view === 'gantt' && <ProcessGanttView items={filtered} onOpenItem={openItem} />}
        {view === 'timeline' && <ProcessTimelineView items={filtered} onOpenItem={openItem} />}
        {view === 'card' &&
          (boardSlot || <ProcessCardView items={filtered} onOpenItem={openItem} />)}
      </div>

      <ProcessItemDrawer
        item={activeItem}
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
        onAiAction={onAiAction}
      />
    </div>
  )
}
