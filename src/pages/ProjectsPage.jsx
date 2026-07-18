import { useState } from 'react'
import { CheckCircle2, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NumericInput from '../components/Products/NumericInput'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { BTN_SUCCESS } from '../utils/buttonStyles'
import { upsertProject } from '../utils/projectsStore'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import { PROJECTS_HOME_PATH } from '../data/projectsMenu'
import { PROJECT_STATUS, PROJECT_STATUS_OPTIONS } from '../utils/projectStatus'

function emptyProject() {
  return {
    name: '',
    customer: '',
    manager: '',
    status: PROJECT_STATUS.PLANNING,
    priority: 'Normal',
    startDate: '',
    deadline: '',
    budget: 0,
    progress: 0,
    note: '',
  }
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptyProject)
  const [toast, setToast] = useState('')

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  async function saveProject() {
    if (!draft.name.trim() || !draft.customer.trim()) {
      alert('Proje adı ve müşteri zorunludur.')
      return
    }

    const id = draft.id || `PRJ-${Date.now()}`
    upsertProject({ ...draft, id, updatedAt: new Date().toISOString() })
    setDraft(emptyProject())
    showToast('Proje kaydedildi')
    await flushWorkspaceNow()
    navigate(PROJECTS_HOME_PATH)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Yeni Proje"
        backTo={PROJECTS_HOME_PATH}
        backLabel="Projeler"
        actions={(
          <button type="button" onClick={saveProject} className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm`}>
            <Save className="h-4 w-4" /> Projeyi Kaydet
          </button>
        )}
      />

      <AppPagePanel title="Proje Bilgileri" dotColor="blue">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <label className="form-label">Proje Adı *</label>
            <input
              value={draft.name}
              onChange={(event) => update('name', event.target.value)}
              className="form-input"
              placeholder="Örn: Premium kutu üretim projesi"
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="form-label">Müşteri *</label>
            <input
              value={draft.customer}
              onChange={(event) => update('customer', event.target.value)}
              className="form-input"
              placeholder="Müşteri / firma"
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="form-label">Sorumlu</label>
            <input
              value={draft.manager}
              onChange={(event) => update('manager', event.target.value)}
              className="form-input"
              placeholder="Proje sorumlusu"
            />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="form-label">Durum</label>
            <select value={draft.status} onChange={(event) => update('status', event.target.value)} className="form-input">
              {PROJECT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="form-label">Öncelik</label>
            <select value={draft.priority} onChange={(event) => update('priority', event.target.value)} className="form-input">
              <option>Düşük</option>
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Kritik</option>
            </select>
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="form-label">Başlangıç Tarihi</label>
            <input
              value={draft.startDate}
              onChange={(event) => update('startDate', event.target.value)}
              className="form-input"
              placeholder="31.05.2026"
            />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="form-label">Teslim Tarihi</label>
            <input
              value={draft.deadline}
              onChange={(event) => update('deadline', event.target.value)}
              className="form-input"
              placeholder="15.06.2026"
            />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="form-label">Bütçe</label>
            <NumericInput value={draft.budget} onChange={(value) => update('budget', value)} suffix="₺" formatMode="price" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="form-label">İlerleme (%)</label>
            <NumericInput value={draft.progress} onChange={(value) => update('progress', Math.min(100, value))} suffix="%" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label">Proje Notları</label>
            <textarea
              value={draft.note}
              onChange={(event) => update('note', event.target.value)}
              rows={3}
              className="form-input resize-none"
              placeholder="Proje kapsamı, özel istekler, numune bilgisi..."
            />
          </div>
        </div>
      </AppPagePanel>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[120] flex items-center gap-2 rounded-xl bg-emerald-500/95 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      ) : null}
    </AppPageShell>
  )
}
