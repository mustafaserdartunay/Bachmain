import { useNavigate, Navigate, useParams } from 'react-router-dom'
import {
  AppointmentFormModal,
  emptyAppointmentForm,
  emptyNoteForm,
  emptyTaskForm,
  normalizeTaskForm,
  NoteFormModal,
  TaskFormModal,
} from '../components/Crm/CrmForms'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import {
  loadAgendaNotes,
  loadAppointments,
  loadTasks,
  upsertAgendaNote,
  upsertAppointment,
  upsertTask,
} from '../utils/crmStore'

const CREATE_CONFIG = {
  task: {
    pageTitle: 'Görev Oluştur',
    editPageTitle: 'Görev Düzenle',
    formTitle: 'Görev Oluştur',
    listPath: '/crm/gorevler',
    initial: emptyTaskForm,
    load: () => loadTasks(),
    normalize: normalizeTaskForm,
    submit: upsertTask,
    Form: TaskFormModal,
  },
  appointment: {
    pageTitle: 'Randevu Oluştur',
    editPageTitle: 'Randevu Düzenle',
    formTitle: 'Randevu Oluştur',
    listPath: '/crm/randevular',
    initial: emptyAppointmentForm,
    load: () => loadAppointments(),
    normalize: (record) => ({ ...record }),
    submit: upsertAppointment,
    Form: AppointmentFormModal,
  },
  note: {
    pageTitle: 'Not Oluştur',
    editPageTitle: 'Not Düzenle',
    formTitle: 'Not Oluştur',
    listPath: '/crm/notlar',
    initial: emptyNoteForm,
    load: () => loadAgendaNotes(),
    normalize: (record) => ({ ...record }),
    submit: upsertAgendaNote,
    Form: NoteFormModal,
  },
}

export default function CrmCreatePage({ type }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const config = CREATE_CONFIG[type]

  if (!config) return <Navigate to="/crm" replace />

  const FormComponent = config.Form
  const listPath = config.listPath || '/crm'
  const editRecord = id ? config.load().find((item) => item.id === id) : null
  const initialForm = editRecord ? config.normalize(editRecord) : config.initial()

  if (id && !editRecord) return <Navigate to={listPath} replace />

  function goBack() {
    navigate(listPath)
  }

  function handleSubmit(form) {
    config.submit(form)
    navigate(listPath)
  }

  return (
    <AppPageShell className="min-h-[calc(100vh-2rem)]">
      <AppPageHeader
        title={id ? config.editPageTitle : config.pageTitle}
        backTo={listPath}
        backLabel="Geri"
      />

      <div className="card min-h-[calc(100vh-9rem)] overflow-hidden p-0">
        <FormComponent
          initial={initialForm}
          onClose={goBack}
          onSubmit={handleSubmit}
          fullPage
        />
      </div>
    </AppPageShell>
  )
}
