import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  CheckCircle2,
  Pause,
  Play,
  QrCode,
  ScanBarcode,
  ShieldAlert,
  Square,
  Video,
  AlertTriangle,
} from 'lucide-react'
import { loadProductionJobs } from '../../utils/productionStore'
import { publishDomainEvent } from '../../workflow/eventBus'
import { ensureMesSeed, listWorkCentersLocal, operatorActionLocal } from '../../mes/localStore'

const ACTIONS = [
  { id: 'start', label: 'Başlat', icon: Play, tone: 'emerald' },
  { id: 'pause', label: 'Duraklat', icon: Pause, tone: 'amber' },
  { id: 'resume', label: 'Devam', icon: Play, tone: 'sky' },
  { id: 'finish', label: 'Bitir', icon: CheckCircle2, tone: 'emerald' },
  { id: 'scrap', label: 'Fire', icon: AlertTriangle, tone: 'rose' },
  { id: 'qc_call', label: 'Kalite', icon: ShieldAlert, tone: 'violet' },
  { id: 'photo', label: 'Fotoğraf', icon: Camera, tone: 'slate' },
  { id: 'video', label: 'Video', icon: Video, tone: 'slate' },
  { id: 'qr', label: 'QR Oku', icon: QrCode, tone: 'slate' },
  { id: 'barcode', label: 'Barkod', icon: ScanBarcode, tone: 'slate' },
]

export default function MesOperatorTabletPage() {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [centers, setCenters] = useState([])
  const [centerId, setCenterId] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    ensureMesSeed()
    const list = loadProductionJobs()
      .filter((j) => j.status !== 'completed')
      .slice(0, 40)
    setJobs(list)
    if (list[0]) setJobId(list[0].id)
    const wc = listWorkCentersLocal()
    setCenters(wc)
    if (wc[0]) setCenterId(wc[0].id)
  }, [])

  function run(action) {
    const event = operatorActionLocal(action, {
      productionJobId: jobId || undefined,
      workCenterId: centerId || undefined,
      qtyScrap: action === 'scrap' ? 1 : 0,
      note: action === 'scrap' ? 'tablet_fire' : undefined,
    })
    publishDomainEvent(
      action === 'start'
        ? 'trigger.production.started'
        : action === 'finish'
          ? 'trigger.production.completed'
          : action === 'scrap'
            ? 'trigger.mes.scrap.reported'
            : action === 'qc_call'
              ? 'trigger.mes.quality.called'
              : 'trigger.mes.operator.action',
      { action, eventId: event.id, productionJobId: jobId },
      { source: 'mes-operator' },
    )
    setToast(`${ACTIONS.find((a) => a.id === action)?.label || action} ✓`)
    setTimeout(() => setToast(''), 1600)
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-3xl px-4 py-5 pb-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--muted)]">
            MES Operator
          </p>
          <h1 className="text-2xl font-black tracking-tight text-[var(--ink)]">Tablet</h1>
        </div>
        <Link
          to="/mes"
          className="min-h-12 rounded-2xl border border-dark-500/40 px-4 text-xs font-bold"
        >
          Manufacturing Center
        </Link>
      </div>

      {toast ? (
        <p className="mb-4 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-700">
          {toast}
        </p>
      ) : null}

      <label className="mb-2 block text-[11px] font-black uppercase text-[var(--muted)]">
        İş emri
      </label>
      <select
        className="form-input mb-4 min-h-14 text-base"
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
      >
        <option value="">Seçilmedi</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.code || j.documentCode || j.id} — {j.customerName || ''}
          </option>
        ))}
      </select>

      <label className="mb-2 block text-[11px] font-black uppercase text-[var(--muted)]">
        Makine / hücre
      </label>
      <select
        className="form-input mb-6 min-h-14 text-base"
        value={centerId}
        onChange={(e) => setCenterId(e.target.value)}
      >
        {centers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} · {c.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => run(a.id)}
            className="flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-[22px] border border-dark-500/35 bg-white/50 px-3 text-center shadow-sm active:scale-[0.98]"
          >
            <a.icon className="h-7 w-7" strokeWidth={2.25} />
            <span className="text-sm font-black uppercase tracking-wide">{a.label}</span>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] text-[var(--muted)]">
        <Square className="mr-1 inline h-3 w-3" />
        Aksiyonlar event bus’a yazılır · /uretim verisi silinmez
      </p>
    </div>
  )
}
