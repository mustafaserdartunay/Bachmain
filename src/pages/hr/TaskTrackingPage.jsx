import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { loadPersonnel } from '../../utils/personnelStore'
import { addPdksTask, getPdksTasks, updatePdksTask } from '../../utils/pdksStore'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

export default function TaskTrackingPage() {
  const [tasks, setTasks] = useState(() => getPdksTasks())
  const [form, setForm] = useState({ employeeId: '', title: '', dueDate: '' })
  const employees = useMemo(() => loadPersonnel().filter((e) => e.status !== 'Ayrıldı'), [])

  const refresh = useCallback(() => setTasks(getPdksTasks()), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    return () => window.removeEventListener('bach:pdks-updated', refresh)
  }, [refresh])

  return (
    <AppPageShell>
      <AppPageHeader title="Görev Takibi" />
      <AppPagePanel title="Görev Ata">
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            addPdksTask(form)
            setForm({ employeeId: '', title: '', dueDate: '' })
            refresh()
          }}
        >
          <select className="form-input text-sm" value={form.employeeId} onChange={(e) => setForm((c) => ({ ...c, employeeId: e.target.value }))} required>
            <option value="">Personel</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
          <input className="form-input text-sm md:col-span-2" placeholder="Görev" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} required />
          <button type="submit" className={`${BTN_SUCCESS} text-xs`}>Ata</button>
        </form>
      </AppPagePanel>
      <AppPagePanel title="Açık Görevler">
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white">{task.title}</p>
                <p className="text-xs text-gray-500">{task.employeeName}</p>
              </div>
              <button type="button" className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300" onClick={() => { updatePdksTask(task.id, { status: 'Tamamlandı' }); refresh() }}>
                {task.status === 'Tamamlandı' ? 'Tamam' : 'Tamamla'}
              </button>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
