import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CalendarX2,
  Clock3,
  Coins,
  Plus,
  QrCode,
  Search,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import SummaryMetrics from '../Common/SummaryMetrics'
import ActivityArchivePanel from '../Common/ActivityArchivePanel'
import {
  ABSENCE_REASONS,
  EMPLOYMENT_STATUSES,
  LEAVE_TYPES,
  PERSONNEL_DEPARTMENTS,
} from '../../data/personnelSeed'
import {
  attendanceTone,
  computePersonnelSummary,
  countAbsentDays,
  countPresentDays,
  formatMoney,
  fullName,
  latestPayroll,
  leaveStatusTone,
  statusTone,
  sumBonuses,
  tenureLabel,
} from '../../utils/personnelHelpers'
import {
  addEmployee,
  appendEmployeeRecord,
  loadPersonnel,
  restoreEmployeeRecord,
  restoreEmployeeStatus,
  terminateEmployee,
  updateEmployee,
} from '../../utils/personnelStore'
import { buildEmployeeQrPayload, getEmployeeShift, getShifts } from '../../utils/pdksStore'
import { getLiveEmployeeStatus, qrImageUrl, statusBadgeClass } from '../../utils/pdksUtils'

const TABS = [
  { id: 'overview', label: 'Genel Bakış', icon: Users },
  { id: 'profile', label: 'Özlük & İşe Giriş/Çıkış', icon: Briefcase },
  { id: 'attendance', label: 'Puantaj', icon: Clock3 },
  { id: 'absence', label: 'Devamsızlık', icon: CalendarX2 },
  { id: 'leave', label: 'İzinler', icon: CalendarDays },
  { id: 'payroll', label: 'Maaş & Prim', icon: Wallet },
]

function Panel({ title, description, children, action }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold text-gray-200 ${mono ? 'tabular-nums' : ''}`}>{value || '—'}</p>
    </div>
  )
}

function DataTable({ columns, rows, emptyLabel = 'Kayıt yok' }) {
  if (!rows.length) {
    return <p className="rounded-xl border border-dashed border-dark-500/50 py-8 text-center text-xs text-gray-500">{emptyLabel}</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-dark-500/40">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-dark-500/40 bg-dark-900/50 text-[10px] font-black uppercase tracking-wider text-gray-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right' : ''}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-500/30">
          {rows.map((row) => (
            <tr key={row.id} className="bg-dark-800/30 hover:bg-dark-700/40">
              {columns.map((col) => (
                <td key={col.key} className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PersonnelWorkspace() {
  const [employees, setEmployees] = useState(loadPersonnel)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('Tümü')
  const [statusFilter, setStatusFilter] = useState('Tümü')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedId, setSelectedId] = useState(employees[0]?.id || '')

  useEffect(() => {
    function refresh() {
      setEmployees(loadPersonnel())
    }
    window.addEventListener('bach:personnel-updated', refresh)
    return () => window.removeEventListener('bach:personnel-updated', refresh)
  }, [])

  const summary = useMemo(() => computePersonnelSummary(employees), [employees])

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR')
    return employees.filter((item) => {
      const matchesSearch = !q
        || fullName(item).toLocaleLowerCase('tr-TR').includes(q)
        || item.employeeNo.toLocaleLowerCase('tr-TR').includes(q)
        || item.department.toLocaleLowerCase('tr-TR').includes(q)
        || item.position.toLocaleLowerCase('tr-TR').includes(q)
      const matchesDepartment = departmentFilter === 'Tümü' || item.department === departmentFilter
      const matchesStatus = statusFilter === 'Tümü' || item.status === statusFilter
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [employees, search, departmentFilter, statusFilter])

  const selected = employees.find((item) => item.id === selectedId) || filtered[0] || null

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [filtered, selected, selectedId])

  function handleAddEmployee() {
    const firstName = window.prompt('Ad')
    if (!firstName?.trim()) return
    const lastName = window.prompt('Soyad')
    if (!lastName?.trim()) return
    const department = window.prompt('Departman', 'Üretim')
    const position = window.prompt('Pozisyon', 'Personel')
    const hireDate = window.prompt('İşe giriş tarihi (GG.AA.YYYY)', new Date().toLocaleDateString('tr-TR'))
    const base = Number(window.prompt('Brüt maaş (TRY)', '30000')) || 30000
    const created = addEmployee({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      department: department?.trim() || 'Üretim',
      position: position?.trim() || 'Personel',
      hireDate: hireDate?.trim() || '',
      phone: '',
      email: '',
      tcNo: '',
      address: '',
      manager: '',
      contractType: 'Belirsiz Süreli',
      workSchedule: 'Hafta içi 08:30 – 18:00',
      shiftId: 'shift-1',
      active: true,
      photoUrl: '',
      salary: { base, currency: 'TRY', paymentDay: 5, bankName: '', iban: '' },
    })
    setSelectedId(created.id)
    setActiveTab('profile')
  }

  function handleTerminate() {
    if (!selected || selected.status === 'Ayrıldı') return
    const terminationDate = window.prompt('İşten çıkış tarihi (GG.AA.YYYY)', new Date().toLocaleDateString('tr-TR'))
    if (!terminationDate?.trim()) return
    const terminationReason = window.prompt('Ayrılış sebebi', 'İstifa')
    terminateEmployee(selected.id, {
      terminationDate: terminationDate.trim(),
      terminationReason: terminationReason?.trim() || '',
    })
    setEmployees(loadPersonnel())
  }

  function handleRestoreArchiveEntry(entry) {
    const restored = entry.entityType === 'employee'
      ? restoreEmployeeStatus(entry.snapshot)
      : restoreEmployeeRecord(entry.snapshot)
    if (restored) setEmployees(loadPersonnel())
    return restored
  }

  function handleAddAttendance() {
    if (!selected) return
    const date = window.prompt('Tarih (GG.AA.YYYY)', new Date().toLocaleDateString('tr-TR'))
    if (!date?.trim()) return
    const status = window.prompt('Durum (Geldi / Gelmedi / Geç Geldi / Yarım Gün)', 'Geldi')
    const checkIn = window.prompt('Giriş saati (SS:DD)', status === 'Gelmedi' ? '' : '08:30')
    const checkOut = window.prompt('Çıkış saati (SS:DD)', status === 'Gelmedi' ? '' : '18:00')
    appendEmployeeRecord(selected.id, 'attendance', {
      date: date.trim(),
      status: status?.trim() || 'Geldi',
      checkIn: checkIn?.trim() || '',
      checkOut: checkOut?.trim() || '',
      workedHours: 0,
      note: '',
    })
    setEmployees(loadPersonnel())
  }

  function handleAddAbsence() {
    if (!selected) return
    const date = window.prompt('Tarih (GG.AA.YYYY)', new Date().toLocaleDateString('tr-TR'))
    if (!date?.trim()) return
    const reason = window.prompt(`Sebep (${ABSENCE_REASONS.join(' / ')})`, 'Hastalık')
    const note = window.prompt('Açıklama', '')
    appendEmployeeRecord(selected.id, 'absences', {
      date: date.trim(),
      reason: reason?.trim() || 'Diğer',
      type: reason?.trim() || 'Diğer',
      days: 1,
      approved: true,
      note: note?.trim() || '',
    })
    setEmployees(loadPersonnel())
  }

  function handleAddLeave() {
    if (!selected) return
    const type = window.prompt(`İzin türü (${LEAVE_TYPES.join(' / ')})`, 'Yıllık İzin')
    const startDate = window.prompt('Başlangıç (GG.AA.YYYY)', new Date().toLocaleDateString('tr-TR'))
    if (!startDate?.trim()) return
    const endDate = window.prompt('Bitiş (GG.AA.YYYY)', startDate)
    const days = Number(window.prompt('Gün sayısı', '1')) || 1
    const reason = window.prompt('Sebep', '')
    appendEmployeeRecord(selected.id, 'leaves', {
      type: type?.trim() || 'Yıllık İzin',
      startDate: startDate.trim(),
      endDate: endDate?.trim() || startDate.trim(),
      days,
      status: 'Bekliyor',
      reason: reason?.trim() || '',
      approvedBy: '',
      requestDate: new Date().toLocaleDateString('tr-TR'),
    })
    setEmployees(loadPersonnel())
  }

  function handleChangeShift() {
    if (!selected) return
    const shifts = getShifts()
    const options = shifts.map((item, index) => `${index + 1}. ${item.name}`).join('\n')
    const pick = window.prompt(`Vardiya seçin:\n${options}`, '1')
    const index = Number(pick) - 1
    if (!Number.isFinite(index) || index < 0 || index >= shifts.length) return
    updateEmployee(selected.id, { shiftId: shifts[index].id, workSchedule: shifts[index].name })
    setEmployees(loadPersonnel())
  }

  function handleToggleActive() {
    if (!selected) return
    const next = selected.active === false
    updateEmployee(selected.id, { active: next })
    setEmployees(loadPersonnel())
  }

  const selectedPdks = useMemo(() => {
    if (!selected) return null
    const shift = getEmployeeShift(selected)
    const liveStatus = getLiveEmployeeStatus(selected)
    const qrPayload = buildEmployeeQrPayload(selected.id)
    return {
      shift,
      liveStatus,
      qrUrl: qrPayload ? qrImageUrl(qrPayload) : '',
    }
  }, [selected, employees])

  function handleAddBonus() {
    if (!selected) return
    const label = window.prompt('Prim türü', 'Performans Primi')
    const amount = Number(window.prompt('Tutar (TRY)', '1000')) || 0
    const note = window.prompt('Açıklama', '')
    const month = new Date().toISOString().slice(0, 7)
    appendEmployeeRecord(selected.id, 'bonuses', {
      month,
      label: label?.trim() || 'Prim',
      amount,
      date: new Date().toLocaleDateString('tr-TR'),
      note: note?.trim() || '',
    })
    setEmployees(loadPersonnel())
  }

  function handleAddPayroll() {
    if (!selected) return
    const month = window.prompt('Dönem (YYYY-MM)', new Date().toISOString().slice(0, 7))
    if (!month?.trim()) return
    const baseSalary = Number(window.prompt('Brüt maaş', String(selected.salary?.base || 0))) || 0
    const bonus = Number(window.prompt('Prim toplamı', '0')) || 0
    const deductions = Number(window.prompt('Kesinti toplamı', '0')) || 0
    const net = baseSalary + bonus - deductions
    appendEmployeeRecord(selected.id, 'payrollHistory', {
      month: month.trim(),
      baseSalary,
      bonus,
      deductions,
      net,
      paidAt: '',
      note: '',
    })
    setEmployees(loadPersonnel())
  }

  const allAttendance = useMemo(
    () => employees.flatMap((emp) => (emp.attendance || []).map((row) => ({ ...row, employeeId: emp.id, employeeName: fullName(emp) }))),
    [employees],
  )
  const allAbsences = useMemo(
    () => employees.flatMap((emp) => (emp.absences || []).map((row) => ({ ...row, employeeId: emp.id, employeeName: fullName(emp) }))),
    [employees],
  )
  const allLeaves = useMemo(
    () => employees.flatMap((emp) => (emp.leaves || []).map((row) => ({ ...row, employeeId: emp.id, employeeName: fullName(emp) }))),
    [employees],
  )

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <div className="flex justify-center">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Personel & İK</h1>
        </div>
      </div>

      <SummaryMetrics
        columns={5}
        items={[
          { title: 'Toplam Personel', value: summary.total, icon: Users, tone: 'blue' },
          { title: 'Aktif', value: summary.active, icon: BadgeCheck, tone: 'emerald', valueTone: 'emerald' },
          { title: 'İzinli / Ayrılan', value: `${summary.onLeave} / ${summary.terminated}`, icon: UserMinus, tone: 'orange', valueTone: 'orange' },
          { title: 'Aylık Maaş Yükü', value: formatMoney(summary.payrollTotal), icon: Coins, tone: 'purple', valueTone: 'purple' },
          { title: 'Bekleyen İzin', value: summary.pendingLeaves, icon: CalendarDays, tone: 'amber', valueTone: 'amber' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="card space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500">Personel</p>
            <button type="button" onClick={handleAddEmployee} className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-300 hover:bg-blue-500/20">
              <UserPlus className="h-3.5 w-3.5" /> Yeni
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="form-input pl-8 text-xs" />
          </div>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="form-input text-xs">
            <option value="Tümü">Tüm departmanlar</option>
            {PERSONNEL_DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input text-xs">
            <option value="Tümü">Tüm durumlar</option>
            {EMPLOYMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="max-h-[520px] space-y-1 overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                  selected?.id === item.id
                    ? 'border-blue-500/40 bg-blue-500/10'
                    : 'border-dark-500/40 bg-dark-800/40 hover:bg-dark-700/50'
                }`}
              >
                <p className="truncate text-sm font-bold text-white">{fullName(item)}</p>
                <p className="truncate text-[10px] text-gray-500">{item.employeeNo} · {item.department}</p>
                <span className={`mt-1 inline-block rounded border px-1.5 py-px text-[9px] font-bold uppercase ${statusTone(item.status)}`}>
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-dark-500/40 bg-dark-800/50 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/15 text-blue-300'
                    : 'text-gray-500 hover:bg-dark-700/60 hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {!selected ? (
            <Panel title="Personel seçin"><p className="text-sm text-gray-500">Sol listeden personel seçin veya yeni personel ekleyin.</p></Panel>
          ) : activeTab === 'overview' ? (
            <Panel title="Genel Bakış" description="Tüm personel özet tablosu">
              <DataTable
                columns={[
                  { key: 'employeeNo', label: 'Sicil' },
                  { key: 'name', label: 'Ad Soyad', render: (row) => fullName(row) },
                  { key: 'department', label: 'Departman' },
                  { key: 'position', label: 'Pozisyon' },
                  { key: 'status', label: 'Durum', render: (row) => (
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusTone(row.status)}`}>{row.status}</span>
                  ) },
                  { key: 'hireDate', label: 'İşe Giriş' },
                  { key: 'present', label: 'Geldi', align: 'right', render: (row) => countPresentDays(row.attendance) },
                  { key: 'absent', label: 'Gelmedi', align: 'right', render: (row) => countAbsentDays(row.attendance, row.absences) },
                  { key: 'salary', label: 'Maaş', align: 'right', render: (row) => formatMoney(row.salary?.base) },
                ]}
                rows={filtered}
              />
            </Panel>
          ) : activeTab === 'profile' ? (
            <Panel
              title={`${fullName(selected)} — Özlük Dosyası`}
              description="İşe giriş, sözleşme, iletişim ve işten çıkış bilgileri"
              action={selected.status !== 'Ayrıldı' ? (
                <button type="button" onClick={handleTerminate} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/20">
                  <UserMinus className="mr-1 inline h-3.5 w-3.5" /> İşten Çıkış Kaydı
                </button>
              ) : null}
            >
              <div className="mb-4 flex flex-wrap items-start gap-4 rounded-2xl border border-dark-500/40 bg-dark-900/40 p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dark-500/50 bg-dark-800 text-xl font-black text-blue-300">
                  {selected.photoUrl
                    ? <img src={selected.photoUrl} alt={fullName(selected)} className="h-full w-full object-cover" />
                    : fullName(selected).slice(0, 1).toLocaleUpperCase('tr-TR')}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-white">{fullName(selected)}</h3>
                    {selectedPdks?.liveStatus && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(selectedPdks.liveStatus.tone)}`}>
                        PDKS: {selectedPdks.liveStatus.label}
                      </span>
                    )}
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${selected.active === false ? 'border-gray-500/40 text-gray-400' : 'border-emerald-500/40 text-emerald-300'}`}>
                      {selected.active === false ? 'Pasif' : 'Aktif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{selected.employeeNo} · {selected.department} · {selected.position}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleChangeShift} className="rounded-lg border border-dark-500/50 px-2.5 py-1 text-[10px] font-bold text-gray-300 hover:bg-dark-700/60">
                      Vardiya: {selectedPdks?.shift?.name || '—'}
                    </button>
                    <button type="button" onClick={handleToggleActive} className="rounded-lg border border-dark-500/50 px-2.5 py-1 text-[10px] font-bold text-gray-300 hover:bg-dark-700/60">
                      {selected.active === false ? 'Aktifleştir' : 'Pasifleştir'}
                    </button>
                    <Link to="/ik/ayarlar" className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-300 hover:bg-blue-500/20">
                      <QrCode className="h-3 w-3" /> PDKS Ayarları
                    </Link>
                  </div>
                </div>
                {selectedPdks?.qrUrl && (
                  <div className="rounded-2xl border border-dark-500/40 bg-white p-2 text-center">
                    <img src={selectedPdks.qrUrl} alt="Personel QR" className="h-24 w-24" />
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">Kişisel QR</p>
                  </div>
                )}
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Sicil No" value={selected.employeeNo} mono />
                <Field label="Departman" value={selected.department} />
                <Field label="Pozisyon" value={selected.position} />
                <Field label="Yönetici" value={selected.manager} />
                <Field label="TC Kimlik" value={selected.tcNo} mono />
                <Field label="Telefon" value={selected.phone} />
                <Field label="E-posta" value={selected.email} />
                <Field label="Adres" value={selected.address} />
                <Field label="Sözleşme" value={selected.contractType} />
                <Field label="İşe Giriş Tarihi" value={selected.hireDate} />
                <Field label="Vardiya" value={selectedPdks?.shift?.name || selected.workSchedule} />
                <Field label="Kıdem" value={tenureLabel(selected.hireDate, selected.terminationDate)} />
                <Field label="Durum" value={selected.status} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-emerald-300" />
                    <h3 className="text-sm font-black text-emerald-300">İşe Giriş</h3>
                  </div>
                  <Field label="Giriş Tarihi" value={selected.hireDate} />
                  <p className="mt-3 text-xs text-gray-500">{selected.notes || 'Not bulunmuyor.'}</p>
                </div>
                <div className={`rounded-xl border p-4 ${selected.terminationDate ? 'border-red-500/25 bg-red-500/5' : 'border-dark-500/40 bg-dark-900/30'}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <UserMinus className="h-4 w-4 text-red-300" />
                    <h3 className="text-sm font-black text-red-300">İşten Çıkış</h3>
                  </div>
                  <Field label="Çıkış Tarihi" value={selected.terminationDate || '—'} />
                  <Field label="Sebep" value={selected.terminationReason || '—'} />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Özlük Belgeleri</h3>
                <DataTable
                  columns={[
                    { key: 'label', label: 'Belge' },
                    { key: 'date', label: 'Tarih' },
                    { key: 'status', label: 'Durum' },
                  ]}
                  rows={selected.documents || []}
                  emptyLabel="Belge kaydı yok"
                />
              </div>
            </Panel>
          ) : activeTab === 'attendance' ? (
            <Panel
              title="Puantaj"
              description="Geldiği günler, giriş–çıkış saatleri ve çalışma süreleri"
              action={(
                <button type="button" onClick={handleAddAttendance} className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-300">
                  <Plus className="h-3.5 w-3.5" /> Puantaj Ekle
                </button>
              )}
            >
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Geldiği Gün</p>
                  <p className="text-xl font-black text-emerald-300">{countPresentDays(selected.attendance)}</p>
                </div>
                <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Gelmediği Gün</p>
                  <p className="text-xl font-black text-red-300">{countAbsentDays(selected.attendance, selected.absences)}</p>
                </div>
                <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Toplam Kayıt</p>
                  <p className="text-xl font-black text-blue-300">{(selected.attendance || []).length}</p>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: 'date', label: 'Tarih' },
                  { key: 'checkIn', label: 'Giriş' },
                  { key: 'checkOut', label: 'Çıkış' },
                  { key: 'status', label: 'Durum', render: (row) => <span className={`font-bold ${attendanceTone(row.status)}`}>{row.status}</span> },
                  { key: 'workedHours', label: 'Saat', align: 'right', render: (row) => row.workedHours || '—' },
                  { key: 'note', label: 'Not' },
                ]}
                rows={[...(selected.attendance || [])].sort((a, b) => b.date.localeCompare(a.date))}
              />
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Tüm Personel Puantaj Özeti</h3>
                <DataTable
                  columns={[
                    { key: 'employeeName', label: 'Personel' },
                    { key: 'date', label: 'Tarih' },
                    { key: 'status', label: 'Durum', render: (row) => <span className={attendanceTone(row.status)}>{row.status}</span> },
                    { key: 'checkIn', label: 'Giriş' },
                    { key: 'checkOut', label: 'Çıkış' },
                  ]}
                  rows={allAttendance.slice(0, 20)}
                />
              </div>
            </Panel>
          ) : activeTab === 'absence' ? (
            <Panel
              title="Devamsızlık"
              description="Gelmediği günler, sebepler ve onay durumu"
              action={(
                <button type="button" onClick={handleAddAbsence} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-300">
                  <Plus className="h-3.5 w-3.5" /> Devamsızlık Ekle
                </button>
              )}
            >
              <DataTable
                columns={[
                  { key: 'date', label: 'Tarih' },
                  { key: 'reason', label: 'Sebep' },
                  { key: 'type', label: 'Tür' },
                  { key: 'days', label: 'Gün', align: 'right' },
                  { key: 'approved', label: 'Onay', render: (row) => (row.approved ? 'Onaylı' : 'Bekliyor') },
                  { key: 'note', label: 'Açıklama' },
                ]}
                rows={[...(selected.absences || [])].sort((a, b) => b.date.localeCompare(a.date))}
                emptyLabel="Devamsızlık kaydı yok"
              />
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Şirket Geneli Devamsızlıklar</h3>
                <DataTable
                  columns={[
                    { key: 'employeeName', label: 'Personel' },
                    { key: 'date', label: 'Tarih' },
                    { key: 'reason', label: 'Sebep' },
                    { key: 'note', label: 'Açıklama' },
                  ]}
                  rows={allAbsences}
                />
              </div>
            </Panel>
          ) : activeTab === 'leave' ? (
            <Panel
              title="İzin Yönetimi"
              description="Yıllık, hastalık, mazeret ve diğer izin talepleri"
              action={(
                <button type="button" onClick={handleAddLeave} className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold text-amber-300">
                  <Plus className="h-3.5 w-3.5" /> İzin Talebi
                </button>
              )}
            >
              <DataTable
                columns={[
                  { key: 'type', label: 'İzin Türü' },
                  { key: 'startDate', label: 'Başlangıç' },
                  { key: 'endDate', label: 'Bitiş' },
                  { key: 'days', label: 'Gün', align: 'right' },
                  { key: 'status', label: 'Durum', render: (row) => (
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${leaveStatusTone(row.status)}`}>{row.status}</span>
                  ) },
                  { key: 'reason', label: 'Sebep' },
                  { key: 'approvedBy', label: 'Onaylayan' },
                ]}
                rows={[...(selected.leaves || [])].sort((a, b) => b.startDate.localeCompare(a.startDate))}
              />
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Tüm İzin Talepleri</h3>
                <DataTable
                  columns={[
                    { key: 'employeeName', label: 'Personel' },
                    { key: 'type', label: 'Tür' },
                    { key: 'startDate', label: 'Başlangıç' },
                    { key: 'endDate', label: 'Bitiş' },
                    { key: 'status', label: 'Durum', render: (row) => (
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${leaveStatusTone(row.status)}`}>{row.status}</span>
                    ) },
                  ]}
                  rows={allLeaves}
                />
              </div>
            </Panel>
          ) : (
            <Panel
              title="Maaş & Prim"
              description="Brüt maaş, prim ödemeleri ve bordro geçmişi"
              action={(
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddBonus} className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-[10px] font-bold text-purple-300">
                    <Plus className="h-3.5 w-3.5" /> Prim Ekle
                  </button>
                  <button type="button" onClick={handleAddPayroll} className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-300">
                    <Plus className="h-3.5 w-3.5" /> Bordro Ekle
                  </button>
                </div>
              )}
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Brüt Maaş" value={formatMoney(selected.salary?.base)} mono />
                <Field label="Ödeme Günü" value={selected.salary?.paymentDay ? `Her ayın ${selected.salary.paymentDay}. günü` : '—'} />
                <Field label="Banka" value={selected.salary?.bankName} />
                <Field label="IBAN" value={selected.salary?.iban} mono />
                <Field label="Toplam Prim (dönem)" value={formatMoney(sumBonuses(selected.bonuses))} mono />
                <Field label="Son Net Maaş" value={formatMoney(latestPayroll(selected.payrollHistory)?.net)} mono />
              </div>

              <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Prim Geçmişi</h3>
              <DataTable
                columns={[
                  { key: 'month', label: 'Dönem' },
                  { key: 'label', label: 'Prim Türü' },
                  { key: 'amount', label: 'Tutar', align: 'right', render: (row) => formatMoney(row.amount) },
                  { key: 'date', label: 'Ödeme Tarihi' },
                  { key: 'note', label: 'Not' },
                ]}
                rows={[...(selected.bonuses || [])].sort((a, b) => b.month.localeCompare(a.month))}
                emptyLabel="Prim kaydı yok"
              />

              <div className="mt-4">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Bordro Geçmişi</h3>
                <DataTable
                  columns={[
                    { key: 'month', label: 'Dönem' },
                    { key: 'baseSalary', label: 'Brüt', align: 'right', render: (row) => formatMoney(row.baseSalary) },
                    { key: 'bonus', label: 'Prim', align: 'right', render: (row) => formatMoney(row.bonus) },
                    { key: 'deductions', label: 'Kesinti', align: 'right', render: (row) => formatMoney(row.deductions) },
                    { key: 'net', label: 'Net', align: 'right', render: (row) => formatMoney(row.net) },
                    { key: 'paidAt', label: 'Ödeme' },
                    { key: 'note', label: 'Not' },
                  ]}
                  rows={[...(selected.payrollHistory || [])].sort((a, b) => b.month.localeCompare(a.month))}
                />
              </div>
            </Panel>
          )}
        </div>
      </div>
      <ActivityArchivePanel
        title="Personel Arşiv ve İşlem Geçmişi"
        modules={['personnel']}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz personel arşiv veya silme kaydı yok."
      />
    </div>
  )
}
