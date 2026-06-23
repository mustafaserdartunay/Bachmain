import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { loadPersonnel } from '../../utils/personnelStore'
import { createOvertimeRecord, getOvertimeRecords } from '../../utils/pdksStore'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

const OT_TYPES = ['Normal Mesai', 'Fazla Mesai', 'Hafta Sonu Mesaisi', 'Resmi Tatil Mesaisi']

export default function OvertimePage() {
  const [rows, setRows] = useState(() => getOvertimeRecords())
  const [form, setForm] = useState({ employeeId: '', hours: 1, type: OT_TYPES[0], date: new Date().toISOString().slice(0, 10), note: '' })
  const employees = useMemo(() => loadPersonnel().filter((e) => e.status !== 'Ayrıldı'), [])

  const refresh = useCallback(() => setRows(getOvertimeRecords()), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    return () => window.removeEventListener('bach:pdks-updated', refresh)
  }, [refresh])

  return (
    <AppPageShell>
      <AppPageHeader title="Mesailer" />
      <AppPagePanel title="Mesai Kaydı">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createOvertimeRecord(form)
            refresh()
          }}
          className="grid gap-3 md:grid-cols-4"
        >
          <select className="form-input text-sm" value={form.employeeId} onChange={(e) => setForm((c) => ({ ...c, employeeId: e.target.value }))} required>
            <option value="">Personel</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
          <select className="form-input text-sm" value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}>
            {OT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input type="number" step="0.5" min="0.5" className="form-input text-sm" value={form.hours} onChange={(e) => setForm((c) => ({ ...c, hours: e.target.value }))} />
          <button type="submit" className={`${BTN_SUCCESS} text-xs`}>Kaydet</button>
        </form>
      </AppPagePanel>
      <AppPagePanel title="Mesai Listesi">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white">{row.employeeName}</p>
                <p className="text-xs text-gray-500">{row.date} · {row.type}</p>
              </div>
              <p className="text-sm font-black text-purple-300">{row.hours} saat</p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
