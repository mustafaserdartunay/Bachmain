import { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Plus,
  Save,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import NumericInput from '../components/Products/NumericInput'
import { formatTL } from '../utils/productPricing'
import { BTN_SUCCESS } from '../utils/buttonStyles'

const initialProjects = [
  {
    id: 'PRJ-2026-001',
    name: 'ABC Ambalaj Premium Kutu Serisi',
    customer: 'ABC Ambalaj Ltd.',
    manager: 'Mehmet Kaya',
    status: 'Planlama',
    priority: 'Yüksek',
    startDate: '31.05.2026',
    deadline: '15.06.2026',
    budget: 185000,
    progress: 22,
    note: 'Premium kutu serisi için numune ve üretim planı hazırlanacak.',
  },
  {
    id: 'PRJ-2026-002',
    name: 'Delta Kozmetik Lansman Ambalajları',
    customer: 'Delta Kozmetik',
    manager: 'Ayşe Demir',
    status: 'Tasarım',
    priority: 'Normal',
    startDate: '28.05.2026',
    deadline: '20.06.2026',
    budget: 96000,
    progress: 48,
    note: 'Lansman seti için 9:16 reklam görselleri de hazırlanacak.',
  },
]

const statusStyles = {
  Planlama: 'badge-blue',
  Tasarım: 'badge-purple',
  Üretim: 'badge-orange',
  Tamamlandı: 'badge-green',
  Beklemede: 'badge-gray',
}

function emptyProject() {
  return {
    name: '',
    customer: '',
    manager: '',
    status: 'Planlama',
    priority: 'Normal',
    startDate: '',
    deadline: '',
    budget: 0,
    progress: 0,
    note: '',
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState(initialProjects)
  const [draft, setDraft] = useState(emptyProject())
  const [toast, setToast] = useState('')

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  function saveProject() {
    if (!draft.name.trim() || !draft.customer.trim()) {
      alert('Proje adı ve müşteri zorunludur.')
      return
    }

    const id = `PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`
    setProjects([{ ...draft, id }, ...projects])
    setDraft(emptyProject())
    showToast('Proje kaydedildi')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dark-500/50 bg-gradient-to-r from-dark-800 to-dark-700 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Link to="/" className="hover:text-gray-300 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-300">Yeni Proje</span>
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent-blue">Proje Yönetimi</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Yeni Proje Sayfası</h1>
            <p className="mt-1 text-sm text-gray-500">
              Müşteri odaklı proje, bütçe, teslim tarihi ve süreç takibi oluşturun.
            </p>
          </div>
          <button onClick={saveProject} className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm`}>
            <Save className="w-4 h-4" /> Projeyi Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Toplam Proje</p>
            <p className="text-xl font-bold text-white">{projects.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Yaklaşan Teslim</p>
            <p className="text-xl font-bold text-white">3</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Aktif Müşteri</p>
            <p className="text-xl font-bold text-white">8</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Toplam Bütçe</p>
            <p className="text-xl font-bold text-white">{formatTL(projects.reduce((sum, p) => sum + p.budget, 0))}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            <Plus className="w-4 h-4 text-accent-blue" /> Proje Bilgileri
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <label className="form-label">Proje Adı *</label>
            <input
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
              className="form-input"
              placeholder="Örn: Premium kutu üretim projesi"
            />
          </div>
          <div className="col-span-3">
            <label className="form-label">Müşteri *</label>
            <input
              value={draft.customer}
              onChange={(e) => update('customer', e.target.value)}
              className="form-input"
              placeholder="Müşteri / firma"
            />
          </div>
          <div className="col-span-3">
            <label className="form-label">Sorumlu</label>
            <input
              value={draft.manager}
              onChange={(e) => update('manager', e.target.value)}
              className="form-input"
              placeholder="Proje sorumlusu"
            />
          </div>
          <div className="col-span-3">
            <label className="form-label">Durum</label>
            <select value={draft.status} onChange={(e) => update('status', e.target.value)} className="form-input">
              <option>Planlama</option>
              <option>Tasarım</option>
              <option>Üretim</option>
              <option>Beklemede</option>
              <option>Tamamlandı</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="form-label">Öncelik</label>
            <select value={draft.priority} onChange={(e) => update('priority', e.target.value)} className="form-input">
              <option>Düşük</option>
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Kritik</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="form-label">Başlangıç Tarihi</label>
            <input value={draft.startDate} onChange={(e) => update('startDate', e.target.value)} className="form-input" placeholder="31.05.2026" />
          </div>
          <div className="col-span-3">
            <label className="form-label">Teslim Tarihi</label>
            <input value={draft.deadline} onChange={(e) => update('deadline', e.target.value)} className="form-input" placeholder="15.06.2026" />
          </div>
          <div className="col-span-3">
            <label className="form-label">Bütçe</label>
            <NumericInput value={draft.budget} onChange={(v) => update('budget', v)} suffix="₺" formatMode="price" />
          </div>
          <div className="col-span-3">
            <label className="form-label">İlerleme (%)</label>
            <NumericInput value={draft.progress} onChange={(v) => update('progress', Math.min(100, v))} suffix="%" />
          </div>
          <div className="col-span-6">
            <label className="form-label">Proje Notları</label>
            <textarea
              value={draft.note}
              onChange={(e) => update('note', e.target.value)}
              rows={3}
              className="form-input resize-none"
              placeholder="Proje kapsamı, özel istekler, numune bilgisi..."
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">
          <ClipboardList className="w-4 h-4 text-accent-blue" /> Kayıtlı Projeler
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/50">
                <th className="table-header text-left pb-2">Proje No</th>
                <th className="table-header text-left pb-2">Proje</th>
                <th className="table-header text-left pb-2">Müşteri</th>
                <th className="table-header text-center pb-2">Durum</th>
                <th className="table-header text-right pb-2">Bütçe</th>
                <th className="table-header text-right pb-2">Teslim</th>
                <th className="table-header text-center pb-2">İlerleme</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-dark-500/20 hover:bg-dark-700/40 transition-colors">
                  <td className="table-cell text-accent-blue font-medium">{project.id}</td>
                  <td className="table-cell font-medium">{project.name}</td>
                  <td className="table-cell text-gray-400">{project.customer}</td>
                  <td className="table-cell text-center">
                    <span className={statusStyles[project.status] || 'badge-gray'}>{project.status}</span>
                  </td>
                  <td className="table-cell text-right">{formatTL(project.budget)}</td>
                  <td className="table-cell text-right text-gray-500">{project.deadline}</td>
                  <td className="table-cell text-center">
                    <div className="mx-auto w-24 h-2 rounded-full bg-dark-600 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500">%{project.progress}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed right-6 bottom-6 z-[120] flex items-center gap-2 rounded-xl bg-emerald-500/95 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  )
}
