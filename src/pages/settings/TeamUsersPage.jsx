import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { AppPageHeader } from '../../components/Layout/AppPageLayout'
import { useAuth } from '../../auth/AuthContext'
import { emptyModulePermissions, groupedAppModules, MODULE_LEVELS } from '../../data/appModules'
import { isOwnerUser } from '../../utils/moduleAccess'
import { BTN_SUCCESS, COP_KUTUSU_BUTTON_CLASS, COP_KUTUSU_ICON_CLASS } from '../../utils/buttonStyles'
import {
  inviteTeamUser,
  listTeamUsers,
  removeTeamUser,
  resendTeamInvite,
  updateTeamUser,
} from '../../utils/teamUsersApi'

const STATUS_STYLES = {
  accepted: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  suspended: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  owner: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
}

function statusClass(row) {
  if (row.primary) return STATUS_STYLES.owner
  return STATUS_STYLES[row.inviteStatus] || STATUS_STYLES.pending
}

function permissionSummary(permissions) {
  if (!permissions) return 'Tam yetki'
  const entries = Object.entries(permissions)
  const edit = entries.filter(([, level]) => level === 'edit').length
  const view = entries.filter(([, level]) => level === 'view').length
  return `${edit} modülde değişiklik · ${view} modülde görüntüleme`
}

function PermissionGrid({ value, onChange, disabled }) {
  const groups = useMemo(() => groupedAppModules(), [])
  function setLevel(code, level) {
    onChange({ ...value, [code]: level })
  }
  function setGroup(modules, level) {
    const next = { ...value }
    modules.forEach((mod) => {
      next[mod.code] = level
    })
    onChange(next)
  }
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.group} className="overflow-hidden rounded-2xl border border-dark-500/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-500/40 bg-dark-700/40 px-3 py-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-300">{group.group}</h4>
            <div className="flex flex-wrap gap-1">
              {Object.values(MODULE_LEVELS).map((level) => (
                <button
                  key={level.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setGroup(group.modules, level.value)}
                  className="rounded-lg border border-dark-500/50 px-2 py-1 text-[10px] font-bold uppercase text-gray-400 hover:bg-dark-700 hover:text-white disabled:opacity-40"
                >
                  Tümü {level.label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-dark-500/30">
            {group.modules.map((mod) => (
              <div
                key={mod.code}
                className="grid gap-2 px-3 py-2.5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-bold text-white">{mod.label}</p>
                  <p className="text-[11px] text-gray-500">{mod.code}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.values(MODULE_LEVELS).map((level) => {
                    const active = (value[mod.code] || 'none') === level.value
                    return (
                      <button
                        key={level.value}
                        type="button"
                        disabled={disabled}
                        title={level.hint}
                        onClick={() => setLevel(mod.code, level.value)}
                        className={`rounded-xl px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide ${
                          active
                            ? level.value === 'edit'
                              ? 'bg-emerald-500 text-white'
                              : level.value === 'view'
                                ? 'bg-sky-500 text-white'
                                : 'bg-dark-500 text-white'
                            : 'border border-dark-500/50 text-gray-400 hover:text-white'
                        } disabled:opacity-40`}
                      >
                        {level.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const emptyForm = () => ({
  fullName: '',
  email: '',
  phone: '',
  jobTitle: '',
  modulePermissions: { ...emptyModulePermissions('none'), dashboard_basic: 'view' },
})

export default function TeamUsersPage() {
  const { user } = useAuth()
  const owner = isOwnerUser(user)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState('')
  const [composerOpen, setComposerOpen] = useState(true)

  async function reload() {
    setLoading(true)
    setError('')
    try {
      setRows(await listTeamUsers())
    } catch (err) {
      setError(err.message || 'Kullanıcılar alınamadı')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [user?.tenantCode])

  if (!owner) {
    return (
      <div className="w-full space-y-5">
        <AppPageHeader title="Kullanıcılar" />
        <section className="card p-6 text-sm font-semibold text-rose-200">
          Alt kullanıcıları yalnızca firma yöneticisi oluşturabilir.
        </section>
      </div>
    )
  }

  function startEdit(row) {
    setEditingId(row.accountId)
    setComposerOpen(true)
    setForm({
      fullName: row.fullName || '',
      email: row.email || '',
      phone: row.phone || '',
      jobTitle: row.jobTitle || '',
      modulePermissions: { ...emptyModulePermissions('none'), ...(row.modulePermissions || {}) },
    })
  }

  async function submitInvite(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (editingId) {
        const users = await updateTeamUser({
          accountId: editingId,
          fullName: form.fullName,
          phone: form.phone,
          jobTitle: form.jobTitle,
          modulePermissions: form.modulePermissions,
        })
        setRows(users)
        setNotice('Kullanıcı izinleri güncellendi.')
        setEditingId(null)
        setForm(emptyForm())
      } else {
        const result = await inviteTeamUser(form)
        setRows(result.users || (await listTeamUsers()))
        setLastInviteUrl(result.inviteUrl || '')
        setNotice(
          result.mailStatus === 'sent' || result.mailStatus === 'queued'
            ? 'Davet e-postası gönderildi. Kullanıcı bağlantıdan onaylayınca durum Onaylandı olur.'
            : result.message ||
                'Davet oluşturuldu. E-posta ayarı yoksa bağlantıyı kopyalayıp kullanıcıya iletin.',
        )
        setForm(emptyForm())
      }
    } catch (err) {
      setError(err.message || 'İşlem başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Davet bağlantısı kopyalandı.')
    } catch {
      setError('Kopyalanamadı')
    }
  }

  return (
    <div className="w-full space-y-5">
      <AppPageHeader title="Kullanıcılar" />

      <section className="card space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-sky-300">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-white">Firma kullanıcıları</h2>
            <p className="text-xs font-semibold text-gray-500">
              Yönetici alt kullanıcı davet eder, modül bazında görüntüleme veya değişiklik izni verir.
              Davet edilen kişi e-postasındaki bağlantıdan şifresini belirleyip sisteme girer; onay
              sonrası burada Onaylandı görünür.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
          {notice}
        </p>
      ) : null}
      {lastInviteUrl ? (
        <div className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 truncate text-xs text-gray-300">{lastInviteUrl}</p>
          <button
            type="button"
            className={`${BTN_SUCCESS} gap-2 px-3 text-xs`}
            onClick={() => copyText(lastInviteUrl)}
          >
            <Copy className="h-3.5 w-3.5" /> Bağlantıyı kopyala
          </button>
        </div>
      ) : null}

      <section className="card overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setComposerOpen((open) => !open)}
        >
          <span className="flex items-center gap-2 text-sm font-black text-white">
            <UserPlus className="h-4 w-4" />
            {editingId ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı davet et'}
          </span>
          <Plus className={`h-4 w-4 text-gray-400 transition ${composerOpen ? 'rotate-45' : ''}`} />
        </button>
        {composerOpen ? (
          <form onSubmit={submitInvite} className="space-y-4 border-t border-dark-500/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-gray-500">Ad soyad</span>
                <input
                  required
                  className="form-input"
                  value={form.fullName}
                  onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-gray-500">E-posta</span>
                <input
                  required
                  type="email"
                  disabled={Boolean(editingId)}
                  className="form-input disabled:opacity-60"
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-gray-500">Telefon</span>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-gray-500">Unvan / görev</span>
                <input
                  className="form-input"
                  placeholder="Örn. Muhasebe, Satış temsilcisi"
                  value={form.jobTitle}
                  onChange={(e) => setForm((c) => ({ ...c, jobTitle: e.target.value }))}
                />
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
              <Shield className="h-4 w-4 text-sky-300" />
              Modül yetkileri
            </div>
            <PermissionGrid
              value={form.modulePermissions}
              onChange={(modulePermissions) => setForm((c) => ({ ...c, modulePermissions }))}
            />
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className={`${BTN_SUCCESS} gap-2 px-4 text-sm`}>
                <Mail className="h-4 w-4" />
                {busy ? 'Kaydediliyor…' : editingId ? 'İzinleri kaydet' : 'Davet e-postası gönder'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="btn-back px-4 text-sm"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm())
                  }}
                >
                  Vazgeç
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-dark-500/40 px-4 py-3">
          <h3 className="text-sm font-black text-white">Kayıtlı kullanıcılar</h3>
          <button type="button" onClick={reload} className="text-xs font-bold text-gray-400 hover:text-white">
            Yenile
          </button>
        </div>
        <ul className="divide-y divide-dark-500/30">
          {loading ? <li className="px-4 py-6 text-sm text-gray-400">Yükleniyor…</li> : null}
          {!loading && !rows.length ? (
            <li className="px-4 py-6 text-sm text-gray-400">Henüz alt kullanıcı yok.</li>
          ) : null}
          {rows.map((row) => (
            <li key={row.accountId} className="space-y-2 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{row.fullName || row.email}</p>
                  <p className="truncate text-xs text-gray-400">
                    {row.email}
                    {row.jobTitle ? ` · ${row.jobTitle}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${statusClass(row)}`}
                  >
                    {row.inviteStatus === 'accepted' || row.primary ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : null}
                    {row.inviteStatusLabel || (row.primary ? 'Firma sahibi' : row.inviteStatus)}
                  </span>
                  {!row.primary ? (
                    <>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-gray-300 hover:bg-dark-700"
                        title="İzinleri düzenle"
                        onClick={() => startEdit(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {row.inviteStatus !== 'accepted' ? (
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-300 hover:bg-dark-700"
                          title="Daveti yeniden gönder"
                          onClick={async () => {
                            try {
                              const result = await resendTeamInvite(row.accountId)
                              setRows(result.users || (await listTeamUsers()))
                              setLastInviteUrl(result.inviteUrl || '')
                              setNotice('Davet yeniden oluşturuldu.')
                            } catch (err) {
                              setError(err.message)
                            }
                          }}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      {row.inviteUrl ? (
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-300 hover:bg-dark-700"
                          title="Bağlantıyı kopyala"
                          onClick={() => copyText(row.inviteUrl)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={COP_KUTUSU_BUTTON_CLASS}
                        title="Kullanıcıyı kaldır"
                        onClick={async () => {
                          if (!window.confirm('Bu kullanıcının erişimi kaldırılsın mı?')) return
                          try {
                            setRows(await removeTeamUser(row.accountId))
                            setNotice('Kullanıcı kaldırıldı.')
                          } catch (err) {
                            setError(err.message)
                          }
                        }}
                      >
                        <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              {!row.primary ? (
                <p className="text-[11px] text-gray-500">{permissionSummary(row.modulePermissions)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
