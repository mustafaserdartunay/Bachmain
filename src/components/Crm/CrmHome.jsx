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
import CrmProcessNotesPanel from './CrmProcessNotesPanel'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../Layout/AppPageLayout'
import {
  deleteAppointment,
  deleteAgendaNote,
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
  const processEntries = useMemo(
    () => buildCrmProcessRecords(tasks, appointments),
    [tasks, appointments],
  )

  const noteEntries = useMemo(
    () => buildCrmNoteBoardEntries(notes),
    [notes],
  )

  const filteredProcesses = useMemo(
    () => filterCrmBoardEntries(processEntries, filters, { searchQuery, processFilter }),
    [processEntries, filters, searchQuery, processFilter],
  )

  const filteredNotes = useMemo(() => {
    return filterCrmBoardEntries(noteEntries, filters, { searchQuery, processFilter: 'all' })
      .sort((left, right) => {
        const rightCreated = getCrmRecordCreatedSortValue(right.record, right.sortKey)
        const leftCreated = getCrmRecordCreatedSortValue(left.record, left.sortKey)
        return rightCreated.localeCompare(leftCreated)
      })
  }, [noteEntries, notes, filters, searchQuery])

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

  function handleProcessEdit(entry) {
    if (entry.kind === 'note') {
      navigate(`/crm/not/${entry.id}/duzenle`)
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

      <div className="crm-home-split">
        <div className="min-w-0">
          <CrmProcessBoardPanel
            entries={filteredProcesses}
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
          />
        </div>

        <AppPagePanel
          title="Not Defteri"
          description="CRM notlarını ayrı panelde görüntüleyin ve düzenleyin."
          className="crm-notes-panel"
          fill
          action={(
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-purple-500/10 px-3 py-1.5 text-xs font-black text-purple-200">
                {filteredNotes.length} kayıt
              </span>
              <button
                type="button"
                onClick={() => navigate('/crm/not-yeni')}
                className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-black text-purple-200 transition-colors hover:bg-purple-500/15"
              >
                <Plus className="h-3.5 w-3.5" />
                Not ekle
              </button>
            </div>
          )}
        >
          <CrmProcessNotesPanel
            variant="stack"
            entries={filteredNotes}
            onAdd={() => navigate('/crm/not-yeni')}
            onEdit={handleProcessEdit}
            onDelete={handleProcessDelete}
          />
        </AppPagePanel>
      </div>
      <ActivityArchivePanel
        title="CRM Arşiv ve İşlem Geçmişi"
        modules={['crm']}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz CRM arşiv veya silme kaydı yok."
      />
    </AppPageShell>
  )
}
