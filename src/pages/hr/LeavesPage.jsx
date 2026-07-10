import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { LEAVE_TYPES } from '../../data/personnelSeed'
import { loadPersonnel } from '../../utils/personnelStore'
import { createLeaveRequest, getLeaveRequests, updateLeaveRequest } from '../../utils/pdksStore'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

export default function LeavesPage() {
  const [rows, setRows] = useState(() => getLeaveRequests())
  const [form, setForm] = useState({ employeeId: '', type: LEAVE_TYPES[0], startDate: '', endDate: '', days: 1, note: '' })
  const employees = useMemo(() => loadPersonnel().filter((e) => e.status !== 'Ayrıldı'), [])

  const refresh = useCallback(() => setRows(getLeaveRequests()), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    return () => window.removeEventListener('bach:pdks-updated', refresh)
  }, [refresh])

  function submit(e) {
    e.preventDefault()
    createLeaveRequest(form)
    setForm({ employeeId: '', type: LEAVE_TYPES[0], startDate: '', endDate: '', days: 1, note: '' })
    refresh()
  }

  return (
    <AppPageShell>
      <AppPageHeader title="İzinler" />
      <AppPagePanel title="İzin Talebi Oluştur">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
          <select className="form-input text-sm" value={form.employeeId} onChange={(e) => setForm((c) => ({ ...c, employeeId: e.target.value }))} required>
            <option value="">Personel seçin</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
          <select className="form-input text-sm" value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}>
            {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input type="number" min="1" className="form-input text-sm" value={form.days} onChange={(e) => setForm((c) => ({ ...c, days: e.target.value }))} />
          <input type="date" className="form-input text-sm" value={form.startDate} onChange={(e) => setForm((c) => ({ ...c, startDate: e.target.value }))} required />
          <input type="date" className="form-input text-sm" value={form.endDate} onChange={(e) => setForm((c) => ({ ...c, endDate: e.target.value }))} required />
          <button type="submit" className={`${BTN_SUCCESS} text-xs`}>Talep Oluştur</button>
        </form>
      </AppPagePanel>

      <AppPagePanel title="İzin Onay Süreci">
        <div className="space-y-2">
          {rows.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">İzin talebi yok.</p> : rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{row.employeeName} · {row.type}</p>
                  <p className="text-xs text-gray-500">{row.startDate} → {row.endDate} ({row.days} gün)</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[12px] font-bold text-emerald-300" onClick={() => { updateLeaveRequest(row.id, { managerApproval: 'Onaylandı', hrApproval: 'Onaylandı', status: 'Onaylandı' }); refresh() }}>Onayla</button>
                  <button type="button" className="rounded-lg bg-red-500/10 px-2 py-1 text-[12px] font-bold text-red-300" onClick={() => { updateLeaveRequest(row.id, { status: 'Reddedildi' }); refresh() }}>Reddet</button>
                </div>
              </div>
              <p className="mt-2 text-[13px] text-gray-400">Yönetici: {row.managerApproval} · İK: {row.hrApproval}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
