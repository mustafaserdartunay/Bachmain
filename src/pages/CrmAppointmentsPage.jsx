import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Calendar,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  StickyNote,
} from 'lucide-react'
import { CrmDeleteAction } from '../components/Crm/CrmListActions'
import {
  AppointmentFormModal,
  emptyAppointmentForm,
  emptyNoteForm,
  NoteFormModal,
} from '../components/Crm/CrmForms'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { noteTone, typeTone } from '../utils/crmMeta'
import {
  deleteAgendaNote,
  deleteAppointment,
  getCrmSummary,
  loadAgendaNotes,
  loadAppointments,
  upsertAgendaNote,
  upsertAppointment,
} from '../utils/crmStore'

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function startOfWeek(date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(12, 0, 0, 0)
  return copy
}

function addDays(dateStr, days) {
  const copy = new Date(`${dateStr}T12:00:00`)
  copy.setDate(copy.getDate() + days)
  return copy.toISOString().slice(0, 10)
}

function formatDateLabel(value) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })
}

function formatShortDate(value) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export default function CrmAppointmentsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [searchParams, setSearchParams] = useSearchParams()
  const [appointments, setAppointments] = useState(loadAppointments)
  const [notes, setNotes] = useState(loadAgendaNotes)
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [showForm, setShowForm] = useState(Boolean(searchParams.get('edit')) || searchParams.get('new') === '1')
  const [form, setForm] = useState(emptyAppointmentForm)
  const [noteModal, setNoteModal] = useState(null)

  useEffect(() => {
    function refresh() {
      setAppointments(loadAppointments())
      setNotes(loadAgendaNotes())
    }
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      const apt = loadAppointments().find((item) => item.id === editId)
      if (apt) {
        setForm({ ...apt })
        setSelectedDate(apt.date)
        setShowForm(true)
      }
    }
  }, [searchParams])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart.toISOString().slice(0, 10), index)
    return { date, label: WEEKDAYS[index] }
  }), [weekStart])

  const dayAppointments = useMemo(() => (
    appointments
      .filter((apt) => apt.status !== 'İptal' && apt.date === selectedDate)
      .sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`))
  ), [appointments, selectedDate])

  const dayNotes = useMemo(() => (
    notes
      .filter((note) => note.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  ), [notes, selectedDate])

  const summary = useMemo(() => {
    const base = getCrmSummary()
    const weekDates = new Set(weekDays.map((day) => day.date))
    const active = appointments.filter((apt) => apt.status !== 'İptal')
    return {
      ...base,
      weekView: active.filter((apt) => weekDates.has(apt.date)).length,
      selectedDay: dayAppointments.length,
      dayNotes: dayNotes.length,
    }
  }, [appointments, weekDays, dayAppointments.length, dayNotes.length])

  function refresh() {
    setAppointments(loadAppointments())
    setNotes(loadAgendaNotes())
  }

  function openCreate() {
    setForm({ ...emptyAppointmentForm(), date: selectedDate })
    setShowForm(true)
    setSearchParams({ new: '1' })
  }

  function openEdit(apt) {
    setForm({ ...apt })
    setShowForm(true)
    setSearchParams({ edit: apt.id })
  }

  function closeForm() {
    setShowForm(false)
    setSearchParams({})
  }

  function submitAppointment(nextForm) {
    upsertAppointment(nextForm)
    refresh()
    closeForm()
  }

  function shiftWeek(delta) {
    const nextStart = addDays(weekStart.toISOString().slice(0, 10), delta * 7)
    setWeekStart(new Date(`${nextStart}T12:00:00`))
  }

  function countForDate(date) {
    return appointments.filter((apt) => apt.status !== 'İptal' && apt.date === date).length
      + notes.filter((note) => note.date === date).length
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Randevular"
        backTo="/crm"
        backLabel="CRM"
        actions={(
          <>
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Randevu ekle
            </button>
            <button
              type="button"
              onClick={() => setNoteModal(emptyNoteForm(selectedDate))}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Not Ekle
            </button>
          </>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Bugün randevu', value: summary.appointmentsToday, icon: Calendar, tone: 'blue', valueTone: 'blue' },
          { title: 'Bu hafta', value: summary.weekView, icon: CalendarRange, tone: 'cyan', valueTone: 'cyan' },
          { title: 'Seçili gün', value: summary.selectedDay, icon: Clock, tone: 'orange', valueTone: 'orange' },
          { title: 'Gün notları', value: summary.dayNotes, icon: StickyNote, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <AppPagePanel
        title="Randevu Takvimi"
        description={`${formatShortDate(weekDays[0].date)} – ${formatShortDate(weekDays[6].date)}`}
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
              {dayAppointments.length} randevu
            </span>
            <div className="flex items-center gap-1 rounded-xl border border-dark-500/50 bg-dark-700/50 p-1">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-dark-600/50 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeekStart(startOfWeek(new Date()))
                  setSelectedDate(today)
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-black text-gray-400 transition-colors hover:bg-dark-600/50 hover:text-white"
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-dark-600/50 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      >
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <div className="rounded-xl border border-dark-500/50 bg-dark-800/40 p-4">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const isSelected = day.date === selectedDate
                const isToday = day.date === today
                const count = countForDate(day.date)
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`flex flex-col items-center rounded-xl px-1 py-2 transition-all ${
                      isSelected
                        ? 'bg-blue-500/20 ring-1 ring-blue-500/40'
                        : isToday
                          ? 'bg-dark-700/60 ring-1 ring-blue-500/20'
                          : 'hover:bg-dark-700/40'
                    }`}
                  >
                    <span className="text-[8px] font-bold uppercase text-gray-500">{day.label}</span>
                    <span className={`mt-0.5 text-sm font-black tabular-nums ${isSelected || isToday ? 'text-white' : 'text-gray-300'}`}>
                      {day.date.slice(8)}
                    </span>
                    {count > 0 ? <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" /> : <span className="mt-1 h-1.5 w-1.5" />}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setNoteModal(emptyNoteForm(selectedDate))}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-black text-purple-200"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Güne Not Ekle
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-dark-500/50 bg-dark-800/40 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Seçili gün</p>
                  <p className="text-sm font-black capitalize text-white">{formatDateLabel(selectedDate)}</p>
                </div>
              </div>

              {dayAppointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-dark-500/50 bg-dark-800/30 px-4 py-8 text-center">
                  <Calendar className="mx-auto mb-2 h-6 w-6 text-gray-600" />
                  <p className="text-sm font-black text-white">Bu gün randevu yok</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((apt) => (
                    <article
                      key={apt.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(apt)}
                      className="group cursor-pointer rounded-xl border border-dark-500/40 bg-dark-800/55 p-4 transition-colors hover:border-blue-500/30 hover:bg-dark-700/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex shrink-0 flex-col items-center rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-center">
                          <span className="text-[10px] font-black uppercase text-blue-300/80">Saat</span>
                          <span className="text-sm font-black tabular-nums text-white">{apt.startTime}</span>
                          <span className="text-[10px] font-bold tabular-nums text-gray-500">{apt.endTime}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black text-white">{apt.title}</h3>
                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black text-white ${typeTone[apt.type] || 'bg-blue-500'}`}>
                              {apt.type}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-bold text-gray-400">
                            {getCustomerDisplay(apt.customer).brandShortName}
                            {apt.contact ? ` · ${apt.contact}` : ''}
                          </p>
                          {apt.location && (
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {apt.location}
                            </p>
                          )}
                          {apt.notes && (
                            <p className="mt-2 rounded-lg border border-dark-500/35 bg-dark-900/40 px-2.5 py-2 text-xs leading-relaxed text-gray-400">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                        <CrmDeleteAction onDelete={() => { deleteAppointment(apt.id); refresh() }} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {showForm && (
              <div className="overflow-hidden rounded-xl border border-dark-500/50 bg-dark-800/40">
                <AppointmentFormModal
                  initial={form}
                  onClose={closeForm}
                  onSubmit={submitAppointment}
                  fullPage
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dark-500/50 bg-dark-800/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Gün Notları</p>
                <p className="text-sm font-black text-white">{formatShortDate(selectedDate)}</p>
              </div>
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            {dayNotes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-dark-500/50 bg-dark-800/30 px-4 py-8 text-center">
                <StickyNote className="mx-auto mb-2 h-6 w-6 text-gray-600" />
                <p className="text-xs text-gray-500">Bu güne ait not yok.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayNotes.map((note) => (
                  <article
                    key={note.id}
                    className={`rounded-xl border border-dark-500/40 px-3 py-3 ${noteTone[note.color] || noteTone.Mavi}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white">{note.title}</p>
                        {note.time && (
                          <p className="mt-0.5 text-[10px] font-bold text-gray-400">{note.time}</p>
                        )}
                        {note.content && (
                          <p className="mt-2 text-xs leading-relaxed text-gray-400">{note.content}</p>
                        )}
                      </div>
                      <CrmDeleteAction onDelete={() => { deleteAgendaNote(note.id); refresh() }} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppPagePanel>

      {noteModal && (
        <NoteFormModal
          initial={noteModal}
          onClose={() => setNoteModal(null)}
          onSubmit={(next) => {
            upsertAgendaNote(next)
            refresh()
            setNoteModal(null)
          }}
        />
      )}
    </AppPageShell>
  )
}
