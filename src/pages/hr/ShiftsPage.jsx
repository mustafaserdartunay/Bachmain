import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { deleteShift, getShifts, saveShift } from '../../utils/pdksStore'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

function emptyShift() {
  return { id: '', name: '', start: '08:00', end: '18:00', type: 'normal', lateToleranceMin: 15, earlyLeaveToleranceMin: 15 }
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState(() => getShifts())
  const [form, setForm] = useState(emptyShift)
  const [open, setOpen] = useState(false)

  const refresh = useCallback(() => setShifts(getShifts()), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    return () => window.removeEventListener('bach:pdks-updated', refresh)
  }, [refresh])

  function handleSave(e) {
    e.preventDefault()
    saveShift(form)
    setForm(emptyShift())
    setOpen(false)
    refresh()
  }

  return (
    <AppPageShell>
      <AppPageHeader title="Vardiyalar" actions={(
        <button type="button" onClick={() => setOpen(true)} className={`${BTN_PRIMARY} gap-1.5 px-4 py-2 text-xs`}>
          <Plus className="h-4 w-4" /> Yeni Vardiya
        </button>
      )} />
      <AppPagePanel title="Vardiya Tanımları">
        <div className="grid gap-3 md:grid-cols-2">
          {shifts.map((shift) => (
            <div key={shift.id} className="rounded-2xl border border-dark-500/40 bg-dark-800/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{shift.name}</p>
                  <p className="text-xs text-gray-500">{shift.start} - {shift.end}</p>
                  <p className="mt-1 text-[13px] text-gray-400">Geç kalma toleransı: {shift.lateToleranceMin} dk</p>
                </div>
                <button type="button" onClick={() => { deleteShift(shift.id); refresh() }} className="text-xs text-red-400">Sil</button>
              </div>
            </div>
          ))}
        </div>
      </AppPagePanel>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl border border-dark-500/50 bg-dark-800 p-5">
            <h3 className="mb-4 text-lg font-bold text-white">Vardiya Ekle</h3>
            <div className="space-y-3">
              <input className="form-input text-sm" placeholder="Vardiya adı" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="form-input text-sm" value={form.start} onChange={(e) => setForm((c) => ({ ...c, start: e.target.value }))} />
                <input type="time" className="form-input text-sm" value={form.end} onChange={(e) => setForm((c) => ({ ...c, end: e.target.value }))} />
              </div>
              <input type="number" className="form-input text-sm" placeholder="Geç kalma toleransı (dk)" value={form.lateToleranceMin} onChange={(e) => setForm((c) => ({ ...c, lateToleranceMin: Number(e.target.value) }))} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm text-gray-400">Vazgeç</button>
              <button type="submit" className={`${BTN_SUCCESS} px-4 py-2 text-sm`}>Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </AppPageShell>
  )
}
