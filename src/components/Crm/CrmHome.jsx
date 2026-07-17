import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  CheckSquare,
  NotebookPen,
} from 'lucide-react'
import SummaryMetrics from '../Common/SummaryMetrics'
import ActivityArchivePanel from '../Common/ActivityArchivePanel'
import SplitCreateButton from '../Common/SplitCreateButton'
import CrmProcessBoardPanel from './CrmProcessBoardPanel'
import { getAgendaNoteStamp } from './AgendaNoteBoard'
import { AppPageHeader, AppPageShell } from '../Layout/AppPageLayout'
import ProcessWorkspaceShell from '../ProcessWorkspace/ProcessWorkspaceShell'
import {
  crmEntriesToProcessItems,
  crmViewToModuleId,
  deriveCrmKanbanStages,
  resolveCrmStageChange,
} from '../ProcessWorkspace/crmAdapter'
import {
  deleteAppointment,
  deleteAgendaNote,
  deleteCompletedAgendaNotes,
  deleteTask,
  getCrmSummary,
  loadAgendaNotes,
  loadAppointments,
  loadTasks,
  restoreCrmEntry,
  upsertAgendaNote,
  upsertAppointment,
  upsertTask,
} from '../../utils/crmStore'
import {
  advanceCrmProcessStage,
  buildCrmProcessRecords,
  getCrmRecordCreatedSortValue,
  recordCrmProcessNotification,
} from '../../utils/crmProcessHelpers'
import {
  buildCrmNoteBoardEntries,
  createDefaultCrmProcessFilters,
  filterCrmBoardEntries,
  readCrmProcessFilter,
} from '../../utils/crmProcessFilterUtils'
import { openCrmProcessWhatsApp } from '../../utils/crmWhatsAppNotify'
import { openCrmProcessEmail } from '../../utils/crmEmailNotify'

const VIEW_CONFIG = {
  all: {
    title: 'Tüm Görevler',
    kinds: null,
    createLabel: 'Yeni Kayıt Oluştur',
    createPrimaryTo: '/crm/gorev-yeni',
    createMenu: [
      { id: 'task', to: '/crm/gorev-yeni', label: 'Görev Oluştur', icon: CheckSquare, iconClassName: 'text-blue-300' },
      { id: 'appointment', to: '/crm/randevu-yeni', label: 'Randevu Oluştur', icon: Calendar, iconClassName: 'text-emerald-300' },
      { id: 'note', to: '/crm/not-yeni', label: 'Not Oluştur', icon: NotebookPen, iconClassName: 'text-orange-300' },
    ],
  },
  note: {
    title: 'Note Defteri',
    kinds: ['note'],
    createLabel: 'Yeni Not Oluştur',
    createPrimaryTo: '/crm/not-yeni',
    createMenu: [
      { id: 'note', to: '/crm/not-yeni', label: 'Hızlı Not', icon: NotebookPen, iconClassName: 'text-blue-300' },
      { id: 'task', to: '/crm/gorev-yeni', label: 'Görev Oluştur', icon: CheckSquare, iconClassName: 'text-emerald-300' },
    ],
  },
  task: {
    title: 'Görevler',
    kinds: ['task'],
    createLabel: 'Yeni Görev Oluştur',
    createPrimaryTo: '/crm/gorev-yeni',
    createMenu: [
      { id: 'task', to: '/crm/gorev-yeni', label: 'Hızlı Görev', icon: CheckSquare, iconClassName: 'text-blue-300' },
      { id: 'appointment', to: '/crm/randevu-yeni', label: 'Randevu Oluştur', icon: Calendar, iconClassName: 'text-emerald-300' },
    ],
  },
  appointment: {
    title: 'Randevular',
    kinds: ['appointment'],
    createLabel: 'Yeni Randevu Oluştur',
    createPrimaryTo: '/crm/randevu-yeni',
    createMenu: [
      { id: 'appointment', to: '/crm/randevu-yeni', label: 'Hızlı Randevu', icon: Calendar, iconClassName: 'text-blue-300' },
      { id: 'task', to: '/crm/gorev-yeni', label: 'Görev Oluştur', icon: CheckSquare, iconClassName: 'text-emerald-300' },
    ],
  },
}

export default function CrmHome({ view = 'all' }) {
  const navigate = useNavigate()
  const viewConfig = VIEW_CONFIG[view] || VIEW_CONFIG.all
  const moduleId = crmViewToModuleId(view)
  const [processFilter, setProcessFilter] = useState(readCrmProcessFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState(createDefaultCrmProcessFilters)
  const [activeMenu, setActiveMenu] = useState(null)
  const [tasks, setTasks] = useState(loadTasks)
  const [appointments, setAppointments] = useState(loadAppointments)
  const [notes, setNotes] = useState(loadAgendaNotes)

  useEffect(() => {
    function refresh() {
      setTasks(loadTasks())
      setAppointments(loadAppointments())
      setNotes(loadAgendaNotes())
    }
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  const summary = useMemo(() => getCrmSummary(), [tasks, appointments])
  const boardEntries = useMemo(() => {
    const processes = buildCrmProcessRecords(tasks, appointments)
    const noteEntries = buildCrmNoteBoardEntries(notes)
    return [...processes, ...noteEntries].sort((left, right) => {
      const leftCreated = getCrmRecordCreatedSortValue(left.record, left.sortKey)
      const rightCreated = getCrmRecordCreatedSortValue(right.record, right.sortKey)
      return rightCreated.localeCompare(leftCreated)
    })
  }, [tasks, appointments, notes])

  const scopedEntries = useMemo(() => {
    if (!viewConfig.kinds) return boardEntries
    return boardEntries.filter((entry) => viewConfig.kinds.includes(entry.kind))
  }, [boardEntries, viewConfig.kinds])

  const filteredEntries = useMemo(
    () => filterCrmBoardEntries(scopedEntries, filters, { searchQuery, processFilter }),
    [scopedEntries, filters, searchQuery, processFilter],
  )

  const processItems = useMemo(
    () => crmEntriesToProcessItems(filteredEntries),
    [filteredEntries],
  )

  const kanbanStages = useMemo(
    () => deriveCrmKanbanStages(filteredEntries, moduleId),
    [filteredEntries, moduleId],
  )

  const scopedNotes = useMemo(() => {
    if (viewConfig.kinds && !viewConfig.kinds.includes('note')) return []
    return notes
  }, [notes, viewConfig.kinds])

  const showNoteComposer = !viewConfig.kinds || viewConfig.kinds.includes('note')

  function refresh() {
    setTasks(loadTasks())
    setAppointments(loadAppointments())
    setNotes(loadAgendaNotes())
  }

  function handleProcessStagePhotosChange(entry, photos) {
    const { kind, record } = entry
    const next = { ...record, stagePhotos: photos }
    if (kind === 'task') upsertTask(next)
    else upsertAppointment(next)
    refresh()
  }

  function handleProcessStageClick(entry, stageId) {
    const { kind, record } = entry
    const next = advanceCrmProcessStage(record, stageId, kind)
    if (kind === 'task') upsertTask(next)
    else upsertAppointment(next)
    refresh()
  }

  function handleWorkspaceStageChange(itemId, stageId) {
    const entry = filteredEntries.find((e) => e.id === itemId)
    if (!entry || entry.kind === 'note') return
    const resolved = resolveCrmStageChange(entry, stageId)
    if (!resolved) return
    handleProcessStageClick(entry, resolved)
  }

  function handleWorkspaceDateChange(itemId, isoDate) {
    const entry = filteredEntries.find((e) => e.id === itemId)
    if (!entry || entry.kind === 'note') return
    const { kind, record } = entry
    const next =
      kind === 'task'
        ? { ...record, dueDate: isoDate }
        : { ...record, date: isoDate }
    if (kind === 'task') upsertTask(next)
    else upsertAppointment(next)
    refresh()
  }

  function handleProcessWhatsApp(entry, step) {
    const { kind, record, template } = entry
    const result = openCrmProcessWhatsApp({ record, stage: step, template, kind })
    if (!result.ok) {
      window.alert(result.reason)
      return
    }
    const notified = recordCrmProcessNotification(record, step.id, kind, 'whatsapp')
    if (kind === 'task') upsertTask(notified)
    else upsertAppointment(notified)
    refresh()
  }

  function handleProcessMail(entry, step) {
    const { kind, record, template } = entry
    const result = openCrmProcessEmail({ record, stage: step, template, kind })
    if (!result.ok) {
      window.alert(result.reason)
      return
    }
    const notified = recordCrmProcessNotification(record, step.id, kind, 'email')
    if (kind === 'task') upsertTask(notified)
    else upsertAppointment(notified)
    refresh()
  }

  function handleSaveNote(content) {
    const stamp = getAgendaNoteStamp()
    const title = content.split('\n').find((line) => line.trim())?.trim().slice(0, 80) || 'Not'
    upsertAgendaNote({
      title,
      content,
      date: stamp.date,
      time: stamp.time,
      completed: false,
      color: 'Mavi',
    })
    refresh()
  }

  function handleToggleNoteComplete(note) {
    upsertAgendaNote({
      ...note,
      completed: !note.completed,
    })
    refresh()
  }

  function handleEditNote(note) {
    navigate(`/crm/not/${note.id}/duzenle`)
  }

  function handleDeleteNote(noteId) {
    deleteAgendaNote(noteId)
    refresh()
  }

  function handleDeleteCompletedNotes() {
    deleteCompletedAgendaNotes()
    refresh()
  }

  function handleProcessEdit(entry) {
    if (entry.kind === 'note') {
      handleEditNote(entry.record)
      return
    }
    if (entry.kind === 'task') {
      navigate(`/crm/gorev/${entry.id}/duzenle`)
      return
    }
    navigate(`/crm/randevu/${entry.id}/duzenle`)
  }

  function handleProcessDelete(entry) {
    if (entry.kind === 'note') deleteAgendaNote(entry.id)
    else if (entry.kind === 'task') deleteTask(entry.id)
    else deleteAppointment(entry.id)
    refresh()
  }

  function handleRestoreArchiveEntry(entry) {
    const restored = restoreCrmEntry(entry.entityType, entry.snapshot)
    if (restored) refresh()
    return restored
  }

  const boardPanel = (
    <CrmProcessBoardPanel
      entries={filteredEntries}
      notes={scopedNotes}
      noteCount={scopedNotes.length}
      processFilter={processFilter}
      onProcessFilterChange={setProcessFilter}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filters={filters}
      onFilterChange={setFilters}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      onStageClick={handleProcessStageClick}
      onStagePhotosChange={handleProcessStagePhotosChange}
      onMailClick={handleProcessMail}
      onWhatsAppClick={handleProcessWhatsApp}
      onEdit={handleProcessEdit}
      onDelete={handleProcessDelete}
      onNoteSave={showNoteComposer ? handleSaveNote : undefined}
      onNoteToggleComplete={handleToggleNoteComplete}
      onNoteEdit={handleEditNote}
      onNoteDelete={handleDeleteNote}
      onNoteDeleteCompleted={handleDeleteCompletedNotes}
    />
  )

  return (
    <AppPageShell className="flex min-h-[calc(100vh-2rem)] flex-col">
      <AppPageHeader
        title={viewConfig.title}
        actions={(
          <SplitCreateButton
            label={viewConfig.createLabel}
            onPrimaryClick={() => navigate(viewConfig.createPrimaryTo)}
            menuAriaLabel="Oluşturma seçenekleri"
            menuItems={viewConfig.createMenu.map((item) => ({
              id: item.id,
              label: item.label,
              icon: item.icon,
              iconClassName: item.iconClassName,
              onClick: () => navigate(item.to),
            }))}
          />
        )}
      />

      {view === 'all' ? (
        <SummaryMetrics
          columns={4}
          items={[
            { title: 'Açık görev', value: summary.tasksPending, icon: CheckSquare, tone: 'orange', valueTone: 'orange' },
            { title: 'Bugün randevu', value: summary.appointmentsToday, icon: Calendar, tone: 'blue', valueTone: 'blue' },
            { title: 'Geciken', value: summary.tasksOverdue, icon: AlertTriangle, tone: 'red', valueTone: 'red' },
            { title: 'Bu hafta', value: summary.appointmentsWeek, icon: CalendarRange, tone: 'cyan', valueTone: 'cyan' },
          ]}
        />
      ) : null}

      <ProcessWorkspaceShell
        moduleId={moduleId}
        items={processItems}
        stages={kanbanStages}
        defaultView="card"
        boardSlot={boardPanel}
        onStageChange={handleWorkspaceStageChange}
        onDateChange={handleWorkspaceDateChange}
      />
      <ActivityArchivePanel
        title="CRM Arşiv ve İşlem Geçmişi"
        modules={['crm']}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz CRM arşiv veya silme kaydı yok."
      />
    </AppPageShell>
  )
}
