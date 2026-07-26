import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Building2, MapPin, Plus, Trash2, Warehouse, Users, Settings2, Network } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { useOrg } from '../../org/OrgContext'
import { useAuth } from '../../auth/AuthContext'
import {
  DEPARTMENT_PRESETS,
  WAREHOUSE_TYPES,
  appendOrgLog,
  checkOrgLimit,
  emptyBranch,
  emptyCompany,
  emptyDepartment,
  emptyWarehouse,
  saveOrgStructure,
} from '../../utils/orgStructureStore'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

const BASE = '/ayarlar/kurumsal-yapi'

function RequireEnterprise({ children }) {
  const { multiCompany } = useOrg()
  if (!multiCompany) {
    return (
      <AppPageShell>
        <AppPageHeader title="Kurumsal Yapı" />
        <div className="card space-y-3 p-6">
          <p className="text-sm font-semibold text-slate-600">
            Çoklu şirket / şube / depo yalnızca <strong>Enterprise</strong> paketinde aktiftir.
          </p>
          <Link to="/paketler" className={`${BTN_SUCCESS} inline-flex px-4 py-2.5 text-sm`}>
            Paketlere git
          </Link>
        </div>
      </AppPageShell>
    )
  }
  return children
}

function OrgNav() {
  const items = [
    { to: `${BASE}/sirketler`, label: 'Şirketler', icon: Building2 },
    { to: `${BASE}/subeler`, label: 'Şubeler', icon: MapPin },
    { to: `${BASE}/depolar`, label: 'Depolar', icon: Warehouse },
    { to: `${BASE}/departmanlar`, label: 'Departmanlar', icon: Network },
    { to: `${BASE}/kullanici-yetkileri`, label: 'Kullanıcı Yetkileri', icon: Users },
    { to: `${BASE}/sirket-ayarlari`, label: 'Şirket Ayarları', icon: Settings2 },
  ]
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500/40 bg-dark-700/50 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-dark-700"
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

function UsageBanner() {
  const { structure, refreshStructure } = useOrg()
  const usage = {
    companies: checkOrgLimit('companies', structure),
    branches: checkOrgLimit('branches', structure),
    warehouses: checkOrgLimit('warehouses', structure),
  }
  void refreshStructure
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-3">
      {[
        ['Şirket', usage.companies],
        ['Şube', usage.branches],
        ['Depo', usage.warehouses],
      ].map(([label, row]) => (
        <div
          key={label}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            row.ok
              ? 'border-dark-500/40 bg-dark-700/40 text-gray-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          {label}: {row.used}
          {row.max > 0 ? ` / ${row.max}` : ' · Limitsiz'}
          {!row.ok ? ' · Limit dolu' : ''}
        </div>
      ))}
    </div>
  )
}

function CompaniesPage() {
  const { structure, refreshStructure, setCompany } = useOrg()
  const [draft, setDraft] = useState(() => emptyCompany({ name: '' }))
  const limit = checkOrgLimit('companies', structure)

  function save() {
    if (!draft.name.trim()) {
      window.alert('Şirket adı gerekli')
      return
    }
    if (!draft.id.startsWith('co-') || !structure.companies.some((c) => c.id === draft.id)) {
      if (!limit.ok) {
        window.alert(`Şirket limiti doldu (${limit.used}/${limit.max})`)
        return
      }
    }
    const next = emptyCompany({ ...draft, updatedAt: new Date().toISOString() })
    saveOrgStructure((s) => {
      const exists = s.companies.some((c) => c.id === next.id)
      return {
        ...s,
        companies: exists
          ? s.companies.map((c) => (c.id === next.id ? next : c))
          : [next, ...s.companies],
      }
    })
    appendOrgLog('company_saved', { id: next.id, name: next.name })
    refreshStructure()
    setCompany(next.id)
    setDraft(emptyCompany({ name: '' }))
  }

  function remove(id) {
    if (!window.confirm('Şirket ve bağlı şube/depoyu pasife almak istiyor musunuz?')) return
    saveOrgStructure((s) => ({
      ...s,
      companies: s.companies.map((c) => (c.id === id ? { ...c, active: false } : c)),
      branches: s.branches.map((b) => (b.companyId === id ? { ...b, active: false } : b)),
      warehouses: s.warehouses.map((w) => (w.companyId === id ? { ...w, active: false } : w)),
    }))
    refreshStructure()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <section className="card space-y-2 p-3">
        {(structure.companies || [])
          .filter((c) => c.active !== false)
          .map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-xl border border-dark-500/40 bg-dark-700/40 px-3 py-2.5"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => setDraft({ ...c })}
              >
                <p className="truncate text-sm font-bold text-white">{c.name}</p>
                <p className="truncate text-[11px] text-gray-400">
                  {c.city || c.taxNo || c.currency}
                </p>
              </button>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="rounded-lg p-1.5 text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
      </section>
      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-gray-300">
            {draft.name ? 'Şirket Düzenle' : 'Yeni Şirket'}
          </h3>
          <button
            type="button"
            className={`${BTN_SUCCESS} gap-1 px-3 py-2 text-xs`}
            onClick={() => setDraft(emptyCompany({ name: 'Yeni Şirket' }))}
          >
            <Plus className="h-3.5 w-3.5" /> Yeni
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['name', 'Şirket Adı'],
            ['legalName', 'Ticari Ünvan'],
            ['taxOffice', 'Vergi Dairesi'],
            ['taxNo', 'Vergi No'],
            ['mersis', 'MERSİS'],
            ['tradeRegistry', 'Ticaret Sicil'],
            ['phone', 'Telefon'],
            ['email', 'Mail'],
            ['web', 'Web'],
            ['country', 'Ülke'],
            ['city', 'Şehir'],
            ['district', 'İlçe'],
            ['currency', 'Para Birimi'],
            ['language', 'Dil'],
            ['timezone', 'Saat Dilimi'],
            ['defaultPrinter', 'Varsayılan Yazıcı'],
          ].map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-500">{label}</span>
              <input
                className="form-input"
                value={draft[key] || ''}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-500">Adres</span>
          <textarea
            className="form-input min-h-20"
            value={draft.address || ''}
            onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['logoUrl', 'Logo URL'],
            ['stampUrl', 'Kaşe URL'],
            ['signatureUrl', 'İmza URL'],
          ].map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-500">{label}</span>
              <input
                className="form-input"
                value={draft[key] || ''}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={save} className={`${BTN_SUCCESS} px-4 py-2.5 text-sm`}>
            Kaydet
          </button>
        </div>
      </section>
    </div>
  )
}

function BranchesPage() {
  const { structure, companies, refreshStructure, activeCompany } = useOrg()
  const [companyId, setCompanyId] = useState(activeCompany?.id || companies[0]?.id || '')
  const [draft, setDraft] = useState(() => emptyBranch({ companyId }))
  const limit = checkOrgLimit('branches', structure)
  const list = structure.branches.filter((b) => b.companyId === companyId && b.active !== false)

  function save() {
    if (!draft.name.trim() || !draft.companyId) {
      window.alert('Şube adı ve şirket gerekli')
      return
    }
    if (!structure.branches.some((b) => b.id === draft.id) && !limit.ok) {
      window.alert(`Şube limiti doldu (${limit.used}/${limit.max})`)
      return
    }
    const next = emptyBranch({ ...draft, updatedAt: new Date().toISOString() })
    saveOrgStructure((s) => {
      const exists = s.branches.some((b) => b.id === next.id)
      return {
        ...s,
        branches: exists
          ? s.branches.map((b) => (b.id === next.id ? next : b))
          : [next, ...s.branches],
      }
    })
    appendOrgLog('branch_saved', { id: next.id, name: next.name })
    refreshStructure()
    setDraft(emptyBranch({ companyId }))
  }

  return (
    <div className="space-y-3">
      <label className="block max-w-xs space-y-1">
        <span className="text-[10px] font-black uppercase text-gray-500">Şirket</span>
        <select
          className="form-input"
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value)
            setDraft(emptyBranch({ companyId: e.target.value }))
          }}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2 p-3">
          {list.map((b) => (
            <button
              key={b.id}
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-dark-500/40 bg-dark-700/40 px-3 py-2.5 text-left"
              onClick={() => setDraft({ ...b })}
            >
              <span>
                <span className="block text-sm font-bold text-white">{b.name}</span>
                <span className="text-[11px] text-gray-400">{b.code}</span>
              </span>
            </button>
          ))}
        </section>
        <section className="card space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['name', 'Şube Adı'],
              ['code', 'Şube Kodu'],
              ['phone', 'Telefon'],
              ['email', 'Mail'],
              ['manager', 'Yetkili'],
            ].map(([key, label]) => (
              <label key={key} className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-500">{label}</span>
                <input
                  className="form-input"
                  value={draft[key] || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-500">Adres</span>
            <textarea
              className="form-input min-h-16"
              value={draft.address || ''}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`${BTN_SUCCESS} gap-1 px-3 py-2 text-xs`}
              onClick={() => setDraft(emptyBranch({ companyId }))}
            >
              <Plus className="h-3.5 w-3.5" /> Yeni
            </button>
            <button type="button" onClick={save} className={`${BTN_SUCCESS} px-4 py-2 text-sm`}>
              Kaydet
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function WarehousesPage() {
  const { structure, companies, refreshStructure, activeCompany, activeBranch } = useOrg()
  const [companyId, setCompanyId] = useState(activeCompany?.id || '')
  const branches = structure.branches.filter((b) => b.companyId === companyId && b.active !== false)
  const [branchId, setBranchId] = useState(activeBranch?.id || branches[0]?.id || '')
  const [draft, setDraft] = useState(() => emptyWarehouse({ companyId, branchId }))
  const limit = checkOrgLimit('warehouses', structure)
  const list = structure.warehouses.filter((w) => w.branchId === branchId && w.active !== false)

  function save() {
    if (!draft.name.trim() || !draft.branchId) {
      window.alert('Depo adı ve şube gerekli')
      return
    }
    if (!structure.warehouses.some((w) => w.id === draft.id) && !limit.ok) {
      window.alert(`Depo limiti doldu (${limit.used}/${limit.max})`)
      return
    }
    const next = emptyWarehouse({
      ...draft,
      companyId,
      branchId,
      updatedAt: new Date().toISOString(),
    })
    saveOrgStructure((s) => {
      const exists = s.warehouses.some((w) => w.id === next.id)
      return {
        ...s,
        warehouses: exists
          ? s.warehouses.map((w) => (w.id === next.id ? next : w))
          : [next, ...s.warehouses],
      }
    })
    appendOrgLog('warehouse_saved', { id: next.id, name: next.name })
    refreshStructure()
    setDraft(emptyWarehouse({ companyId, branchId }))
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 max-w-xl">
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-500">Şirket</span>
          <select
            className="form-input"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-500">Şube</span>
          <select
            className="form-input"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2 p-3">
          {list.map((w) => (
            <button
              key={w.id}
              type="button"
              className="w-full rounded-xl border border-dark-500/40 bg-dark-700/40 px-3 py-2.5 text-left"
              onClick={() => setDraft({ ...w })}
            >
              <span className="block text-sm font-bold text-white">{w.name}</span>
              <span className="text-[11px] text-gray-400">
                {w.type} · {w.code}
              </span>
            </button>
          ))}
        </section>
        <section className="card space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-500">Depo Adı</span>
              <input
                className="form-input"
                value={draft.name || ''}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-500">Kod</span>
              <input
                className="form-input"
                value={draft.code || ''}
                onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[10px] font-black uppercase text-gray-500">Tip</span>
              <select
                className="form-input"
                value={draft.type || 'Merkez'}
                onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
              >
                {WAREHOUSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`${BTN_SUCCESS} gap-1 px-3 py-2 text-xs`}
              onClick={() => setDraft(emptyWarehouse({ companyId, branchId }))}
            >
              <Plus className="h-3.5 w-3.5" /> Yeni
            </button>
            <button type="button" onClick={save} className={`${BTN_SUCCESS} px-4 py-2 text-sm`}>
              Kaydet
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function DepartmentsPage() {
  const { structure, companies, refreshStructure, activeCompany } = useOrg()
  const [companyId, setCompanyId] = useState(activeCompany?.id || companies[0]?.id || '')
  const list = structure.departments.filter((d) => d.companyId === companyId && d.active !== false)

  function addPreset(name) {
    if (list.some((d) => d.name === name)) return
    const dep = emptyDepartment({ companyId, name, code: name.slice(0, 3).toUpperCase() })
    saveOrgStructure((s) => ({ ...s, departments: [dep, ...s.departments] }))
    refreshStructure()
  }

  return (
    <div className="space-y-3">
      <label className="block max-w-xs space-y-1">
        <span className="text-[10px] font-black uppercase text-gray-500">Şirket</span>
        <select
          className="form-input"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        {DEPARTMENT_PRESETS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => addPreset(name)}
            className="rounded-xl border border-dark-500/40 bg-dark-700/50 px-3 py-2 text-xs font-bold text-gray-200"
          >
            + {name}
          </button>
        ))}
      </div>
      <div className="card grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-dark-500/40 bg-dark-700/40 px-3 py-2 text-sm font-bold text-white"
          >
            {d.name}
          </div>
        ))}
      </div>
    </div>
  )
}

function UserPermissionsPage() {
  const { user } = useAuth()
  const { structure, companies, refreshStructure } = useOrg()
  const [companyId, setCompanyId] = useState(companies[0]?.id || '')
  const [role, setRole] = useState('viewer')
  const email = user?.email || ''

  function assign() {
    if (!companyId || !email) return
    saveOrgStructure((s) => ({
      ...s,
      companyUsers: [
        { id: `cu-${Date.now()}`, companyId, email, role, createdAt: new Date().toISOString() },
        ...s.companyUsers.filter((x) => !(x.companyId === companyId && x.email === email)),
      ],
    }))
    appendOrgLog('user_company_assigned', { email, companyId, role })
    refreshStructure()
  }

  const rows = structure.companyUsers.filter((x) => x.companyId === companyId)

  return (
    <div className="card space-y-4 p-4">
      <p className="text-sm text-gray-400">
        Kullanıcıları şirket bazında yetkilendirin. Aynı e-posta birden fazla şirkette farklı rolle
        yer alabilir.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-500">Şirket</span>
          <select
            className="form-input"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-500">E-posta</span>
          <input className="form-input" value={email} readOnly />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-500">Rol</span>
          <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Yönetici</option>
            <option value="manager">Müdür</option>
            <option value="viewer">Görüntüleyici</option>
          </select>
        </label>
      </div>
      <button type="button" onClick={assign} className={`${BTN_SUCCESS} px-4 py-2 text-sm`}>
        Yetkiyi Kaydet
      </button>
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-dark-500/40 bg-dark-700/40 px-3 py-2 text-gray-200"
          >
            {r.email} · {r.role}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CompanySettingsPage() {
  const { activeCompany, structure, refreshStructure } = useOrg()
  const company = structure.companies.find((c) => c.id === activeCompany?.id)
  if (!company) return <p className="text-sm text-gray-400">Önce şirket seçin.</p>

  function patchSettings(path, value) {
    saveOrgStructure((s) => ({
      ...s,
      companies: s.companies.map((c) => {
        if (c.id !== company.id) return c
        if (path === 'eInvoice') return { ...c, eInvoice: { ...c.eInvoice, ...value } }
        if (path === 'eArchive') return { ...c, eArchive: { ...c.eArchive, ...value } }
        if (path === 'accounting') return { ...c, accounting: { ...c.accounting, ...value } }
        return c
      }),
    }))
    refreshStructure()
  }

  return (
    <div className="card space-y-4 p-4">
      <h3 className="text-sm font-black uppercase text-gray-300">{company.name} Ayarları</h3>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
        <input
          type="checkbox"
          checked={Boolean(company.eInvoice?.enabled)}
          onChange={(e) => patchSettings('eInvoice', { enabled: e.target.checked })}
        />
        E-Fatura aktif
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
        <input
          type="checkbox"
          checked={company.eInvoice?.connected !== false}
          onChange={(e) => patchSettings('eInvoice', { connected: e.target.checked })}
        />
        GİB bağlantısı kuruldu (demo)
      </label>
      <label className="block max-w-md space-y-1">
        <span className="text-[10px] font-black uppercase text-gray-500">GİB Alias</span>
        <input
          className="form-input"
          value={company.eInvoice?.gibAlias || ''}
          onChange={(e) => patchSettings('eInvoice', { gibAlias: e.target.value })}
        />
      </label>
      <label className="block max-w-md space-y-1">
        <span className="text-[10px] font-black uppercase text-gray-500">Sağlayıcı</span>
        <input
          className="form-input"
          value={company.eInvoice?.provider || 'GİB'}
          onChange={(e) => patchSettings('eInvoice', { provider: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
        <input
          type="checkbox"
          checked={Boolean(company.eArchive?.enabled)}
          onChange={(e) => patchSettings('eArchive', { enabled: e.target.checked })}
        />
        E-Arşiv aktif
      </label>
      <label className="block max-w-md space-y-1">
        <span className="text-[10px] font-black uppercase text-gray-500">Mali yıl başlangıcı</span>
        <input
          className="form-input"
          value={company.accounting?.fiscalYearStart || '01-01'}
          onChange={(e) => patchSettings('accounting', { fiscalYearStart: e.target.value })}
        />
      </label>
      <p className="text-xs text-gray-500">
        Belge Merkezi logosu / kaşe / yazıcı ayarları bu şirkete bağlı aktif firma bağlamında
        kullanılır.
      </p>
    </div>
  )
}

function OrgShell({ title, children }) {
  return (
    <RequireEnterprise>
      <AppPageShell>
        <AppPageHeader title={title} subtitle="Enterprise · Çoklu şirket / şube / depo" />
        <OrgNav />
        <UsageBanner />
        {children}
      </AppPageShell>
    </RequireEnterprise>
  )
}

export function OrgHubPage() {
  return <Navigate to={`${BASE}/sirketler`} replace />
}

export function OrgCompaniesPage() {
  return (
    <OrgShell title="Şirketler">
      <CompaniesPage />
    </OrgShell>
  )
}

export function OrgBranchesPage() {
  return (
    <OrgShell title="Şubeler">
      <BranchesPage />
    </OrgShell>
  )
}

export function OrgWarehousesPage() {
  return (
    <OrgShell title="Depolar">
      <WarehousesPage />
    </OrgShell>
  )
}

export function OrgDepartmentsPage() {
  return (
    <OrgShell title="Departmanlar">
      <DepartmentsPage />
    </OrgShell>
  )
}

export function OrgUserPermissionsPage() {
  return (
    <OrgShell title="Kullanıcı Yetkileri">
      <UserPermissionsPage />
    </OrgShell>
  )
}

export function OrgCompanySettingsPage() {
  return (
    <OrgShell title="Şirket Ayarları">
      <CompanySettingsPage />
    </OrgShell>
  )
}

export { BASE as ORG_BASE }
