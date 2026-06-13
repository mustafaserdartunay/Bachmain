import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckSquare, ListChecks, Plus, Search } from 'lucide-react'
import { CrmDeleteAction } from '../components/Crm/CrmListActions'
import { TaskFormModal, emptyTaskForm, normalizeTaskForm } from '../components/Crm/CrmForms'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { priorityTone } from '../utils/crmMeta'
import { isTaskCompleted, toggleTaskCompletionStatus } from '../utils/crmProcessHelpers'
import { deleteTask, getCrmSummary, loadTasks, upsertTask } from '../utils/crmStore'

function formatShortDate(value) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })
}

export default function CrmTasksPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState(loadTasks)
  const [filter, setFilter] = useState('open')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(searchParams.get('edit') || null)
  const [showForm, setShowForm] = useState(Boolean(searchParams.get('edit')) || searchParams.get('new') === '1')
  const [form, setForm] = useState(emptyTaskForm)

  useEffect(() => {
    function refresh() { setTasks(loadTasks()) }
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      const task = loadTasks().find((item) => item.id === editId)
      if (task) {
        setSelectedId(task.id)
        setForm(normalizeTaskForm(task))
        setShowForm(true)
      }
    }
  }, [searchParams])

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesQuery = !query.trim()
      || task.title.toLowerCase().includes(query.toLowerCase())
      || getCustomerDisplay(task.customer).brandShortName.toLowerCase().includes(query.toLowerCase())
    if (!matchesQuery) return false
    if (filter === 'open') return !isTaskCompleted(task)
    if (filter === 'done') return isTaskCompleted(task)
    if (filter === 'overdue') return !isTaskCompleted(task) && task.dueDate < today
    return true
  }), [tasks, filter, query, today])

  const summary = useMemo(() => {
    const base = getCrmSummary()
    return {
      ...base,
      tasksDone: tasks.filter((task) => isTaskCompleted(task)).length,
      tasksTotal: tasks.length,
    }
  }, [tasks])

  function refresh() {
    setTasks(loadTasks())
  }

  function openCreate() {
    setSelectedId(null)
    setForm(emptyTaskForm())
    setShowForm(true)
    setSearchParams({ new: '1' })
  }

  function openEdit(task) {
    setSelectedId(task.id)
    setForm(normalizeTaskForm(task))
    setShowForm(true)
    setSearchParams({ edit: task.id })
  }

  function closeForm() {
    setShowForm(false)
    setSearchParams({})
  }

  function submitTask(nextForm) {
    upsertTask(nextForm)
    refresh()
    closeForm()
  }

  function toggleTask(task) {
    upsertTask({ ...task, status: toggleTaskCompletionStatus(task) })
    refresh()
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Görevler"
        backTo="/crm"
        backLabel="CRM"
        actions={(
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Görev ekle
          </button>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Açık görev', value: summary.tasksPending, icon: CheckSquare, tone: 'orange', valueTone: 'orange' },
          { title: 'Geciken', value: summary.tasksOverdue, icon: AlertTriangle, tone: 'red', valueTone: 'red' },
          { title: 'Tamamlanan', value: summary.tasksDone, icon: ListChecks, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Toplam', value: summary.tasksTotal, icon: CheckSquare, tone: 'blue', valueTone: 'blue' },
        ]}
      />

      <AppPagePanel
        title="Görev Listesi"
        description="Görev seçin, düzenleyin veya yeni kayıt oluşturun"
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-orange-500/10 px-3 py-1.5 text-xs font-black text-orange-300">
              {filteredTasks.length} kayıt
            </span>
            <div className="flex gap-1 rounded-xl border border-dark-500/50 bg-dark-700/50 p-1">
              {[
                { id: 'open', label: 'Açık' },
                { id: 'overdue', label: 'Geciken' },
                { id: 'done', label: 'Tamamlanan' },
                { id: 'all', label: 'Tümü' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                    filter === item.id
                      ? 'bg-orange-500/15 text-orange-300'
                      : 'text-gray-500 hover:bg-dark-600/50 hover:text-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      >
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-xl border border-dark-500/50 bg-dark-800/40 p-4">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Görev veya müşteri ara..."
                className="form-input pl-9 text-sm"
              />
            </div>
            <div className="max-h-[calc(100vh-380px)] space-y-2 overflow-y-auto pr-1">
              {filteredTasks.map((task) => {
                const isSelected = selectedId === task.id
                const overdue = !isTaskCompleted(task) && task.dueDate < today
                return (
                  <article
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openEdit(task)}
                    className={`cursor-pointer rounded-xl border px-3 py-3 transition-all ${
                      isSelected
                        ? 'border-orange-500/40 bg-orange-500/10'
                        : 'border-dark-500/40 bg-dark-800/50 hover:border-orange-500/25 hover:bg-dark-700/40'
                    } ${overdue ? 'border-red-500/25' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleTask(task)
                        }}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          isTaskCompleted(task)
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                            : 'border-dark-500/60'
                        }`}
                      >
                        {isTaskCompleted(task) && <span className="text-[10px] font-black">✓</span>}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-black ${isTaskCompleted(task) ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {task.title}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-semibold text-gray-500">
                          {getCustomerDisplay(task.customer).brandShortName} · {formatShortDate(task.dueDate)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-black ${priorityTone[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </article>
                )
              })}
              {filteredTasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-dark-500/50 bg-dark-800/30 px-4 py-8 text-center">
                  <CheckSquare className="mx-auto mb-2 h-6 w-6 text-gray-600" />
                  <p className="text-xs text-gray-500">Bu filtrede görev bulunamadı.</p>
                </div>
              )}
            </div>
          </div>

          <div className="min-h-[520px] overflow-hidden rounded-xl border border-dark-500/50 bg-dark-800/40">
            {showForm ? (
              <TaskFormModal
                initial={form}
                onClose={closeForm}
                onSubmit={submitTask}
                fullPage
              />
            ) : (
              <div className="flex h-full min-h-[520px] flex-col items-center justify-center px-6 text-center">
                <CheckSquare className="mb-3 h-10 w-10 text-gray-600" />
                <p className="text-sm font-black text-white">Detaylı görev girişi</p>
                <p className="mt-1 max-w-sm text-xs text-gray-500">
                  Soldan bir görev seçin veya yeni görev oluşturun. Müşteri, öncelik, kategori ve açıklama alanlarını burada düzenleyin.
                </p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="btn-primary mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Görev ekle
                </button>
              </div>
            )}
          </div>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
