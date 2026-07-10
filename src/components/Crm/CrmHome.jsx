import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  CheckSquare,
  Plus,
} from 'lucide-react'
import SummaryMetrics from '../Common/SummaryMetrics'
import ActivityArchivePanel from '../Common/ActivityArchivePanel'
import CrmProcessBoardPanel from './CrmProcessBoardPanel'
import { getAgendaNoteStamp } from './AgendaNoteBoard'
import { AppPageHeader, AppPageShell } from '../Layout/AppPageLayout'
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

export default function CrmHome() {
  const navigate = useNavigate()
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

  const filteredEntries = useMemo(
    () => filterCrmBoardEntries(boardEntries, filters, { searchQuery, processFilter }),
    [boardEntries, filters, searchQuery, processFilter],
  )

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

  return (
    <AppPageShell className="flex min-h-[calc(100vh-2rem)] flex-col">
      <AppPageHeader
        title="CRM Yönetimi"
        actions={(
          <>
            <Link
              to="/crm/gorev-yeni"
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Görev Oluştur
            </Link>
            <Link
              to="/crm/randevu-yeni"
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Randevu Oluştur
            </Link>
            <Link
              to="/crm/not-yeni"
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Not Oluştur
            </Link>
          </>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Açık görev', value: summary.tasksPending, icon: CheckSquare, tone: 'orange', valueTone: 'orange' },
          { title: 'Bugün randevu', value: summary.appointmentsToday, icon: Calendar, tone: 'blue', valueTone: 'blue' },
          { title: 'Geciken', value: summary.tasksOverdue, icon: AlertTriangle, tone: 'red', valueTone: 'red' },
          { title: 'Bu hafta', value: summary.appointmentsWeek, icon: CalendarRange, tone: 'cyan', valueTone: 'cyan' },
        ]}
      />

      <CrmProcessBoardPanel
        entries={filteredEntries}
        notes={notes}
        noteCount={notes.length}
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
        onNoteSave={handleSaveNote}
        onNoteToggleComplete={handleToggleNoteComplete}
        onNoteEdit={handleEditNote}
        onNoteDelete={handleDeleteNote}
        onNoteDeleteCompleted={handleDeleteCompletedNotes}
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
