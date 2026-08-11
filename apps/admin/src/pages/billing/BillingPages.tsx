import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  billingAdminApi,
  type AddonRow,
  type ModuleDef,
  type PlanRow,
  type SubscriptionRow,
  type PaymentRow,
} from '@/services/billingAdminApi'

function Money({ value }: { value?: number }) {
  return <span className="tabular-nums">₺{Number(value || 0).toLocaleString('tr-TR')}</span>
}

export function BillingPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [modules, setModules] = useState<ModuleDef[]>([])
  const [selected, setSelected] = useState<PlanRow | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await billingAdminApi.plans()
      setPlans(data.plans || [])
      setModules(data.modules || [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function savePlan() {
    if (!selected) return
    setSaving(true)
    try {
      if (selected.id?.startsWith('new_')) {
        await billingAdminApi.createPlan({ ...selected, id: undefined })
      } else {
        await billingAdminApi.updatePlan(selected.id, selected)
      }
      setSelected(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  function toggleModule(code: string) {
    if (!selected) return
    const set = new Set(selected.modules || [])
    if (set.has(code)) set.delete(code)
    else set.add(code)
    setSelected({ ...selected, modules: [...set] })
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Paketler"
        subtitle="Starter, Professional, Enterprise ve özel paketleri dinamik yönetin."
        actions={
          <button
            type="button"
            className="rounded-lg bg-bach-blue px-3 py-2 text-sm font-semibold text-white"
            onClick={() =>
              setSelected({
                id: `new_${Date.now()}`,
                code: 'starter',
                name: 'Yeni Paket',
                description: '',
                prices: { month: 0, year: 0, year2: 0, year3: 0, year5: 0, year10: 0, lifetime: 0 },
                modules: [],
                maxUsers: 3,
                storageGb: 2,
                maxCompanies: 1,
                maxBranches: 1,
                maxWarehouses: 1,
                active: true,
              })
            }
          >
            Yeni Paket
          </button>
        }
      />
      {error ? <ErrorState title="Hata" description={error} onRetry={load} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-text">{plan.name}</h3>
                <p className="mt-1 text-sm text-text-muted">{plan.description}</p>
                <p className="mt-2 text-sm">
                  Aylık <Money value={plan.prices?.month} /> · Yıllık <Money value={plan.prices?.year} />
                </p>
                <p className="mt-1 text-xs text-text-subtle">
                  {plan.maxUsers === 0 ? 'Limitsiz kullanıcı' : `${plan.maxUsers} kullanıcı`} ·{' '}
                  {plan.storageGb === 0 ? 'Limitsiz depolama' : `${plan.storageGb} GB`} ·{' '}
                  {plan.maxCompanies === 0 ? '∞ şirket' : `${plan.maxCompanies ?? 1} şirket`} ·{' '}
                  {plan.maxBranches === 0 ? '∞ şube' : `${plan.maxBranches ?? 1} şube`} ·{' '}
                  {plan.maxWarehouses === 0 ? '∞ depo' : `${plan.maxWarehouses ?? 1} depo`} ·{' '}
                  {(plan.modules || []).length} modül
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={plan.active === false ? 'warning' : 'success'}>
                  {plan.active === false ? 'Pasif' : 'Aktif'}
                </Badge>
                <button type="button" className="text-sm font-semibold text-bach-blue" onClick={() => setSelected(plan)}>
                  Düzenle
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selected ? (
        <Card className="space-y-4 p-4">
          <CardHeader>
            <CardTitle>Paket düzenle — {selected.name}</CardTitle>
          </CardHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Ad
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.name}
                onChange={(e) => setSelected({ ...selected, name: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Kod
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.code}
                onChange={(e) => setSelected({ ...selected, code: e.target.value })}
              />
            </label>
            <label className="text-sm md:col-span-2">
              Açıklama
              <textarea
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.description || ''}
                onChange={(e) => setSelected({ ...selected, description: e.target.value })}
              />
            </label>
            {(['month', 'year', 'year2', 'year3', 'year5', 'year10', 'lifetime'] as const).map((key) => (
              <label key={key} className="text-sm">
                Fiyat ({key})
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                  value={selected.prices?.[key] ?? 0}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      prices: { ...(selected.prices || {}), [key]: Number(e.target.value) },
                    })
                  }
                />
              </label>
            ))}
            <label className="text-sm">
              Kullanıcı limiti (0 = sınırsız)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.maxUsers ?? 0}
                onChange={(e) => setSelected({ ...selected, maxUsers: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Depolama GB (0 = sınırsız)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.storageGb ?? 0}
                onChange={(e) => setSelected({ ...selected, storageGb: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Maks. şirket (0 = sınırsız)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.maxCompanies ?? 0}
                onChange={(e) => setSelected({ ...selected, maxCompanies: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Maks. şube (0 = sınırsız)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.maxBranches ?? 0}
                onChange={(e) => setSelected({ ...selected, maxBranches: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Maks. depo (0 = sınırsız)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={selected.maxWarehouses ?? 0}
                onChange={(e) => setSelected({ ...selected, maxWarehouses: Number(e.target.value) })}
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Modüller</p>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-auto md:grid-cols-3">
              {modules.map((m) => (
                <label key={m.code} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(selected.modules || []).includes(m.code)}
                    onChange={() => toggleModule(m.code)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-bach-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={savePlan}
            >
              Kaydet
            </button>
            <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm" onClick={() => setSelected(null)}>
              Vazgeç
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export function BillingModulesPage() {
  const [addons, setAddons] = useState<AddonRow[]>([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({
    code: '',
    label: '',
    category: 'management',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    description: '',
  })

  const load = useCallback(async () => {
    try {
      const data = await billingAdminApi.addons()
      setAddons(data.addons || [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggle(addon: AddonRow) {
    await billingAdminApi.updateAddon(addon.id, { active: !addon.active })
    await load()
  }

  async function toggleStore(addon: AddonRow) {
    await billingAdminApi.updateAddon(addon.id, { storeVisible: addon.storeVisible === false })
    await load()
  }

  async function saveField(
    addon: AddonRow,
    field: keyof AddonRow,
    value: string | number | boolean | string[],
  ) {
    await billingAdminApi.updateAddon(addon.id, { [field]: value })
    await load()
  }

  async function createAddon() {
    if (!draft.code.trim() || !draft.label.trim()) return
    setCreating(true)
    try {
      await billingAdminApi.createAddon({
        ...draft,
        code: draft.code.trim(),
        label: draft.label.trim(),
        storeVisible: true,
        active: true,
        features: [],
      })
      setDraft({
        code: '',
        label: '',
        category: 'management',
        monthlyPrice: 199,
        yearlyPrice: 1990,
        description: '',
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Oluşturulamadı')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Modüller (Add-on / Mağaza)"
        subtitle="Modül Mağazası fiyat, kategori, açıklama ve görünürlük yönetimi. Değişiklikler bachmain.com/paketler/moduller sayfasına yansır."
      />
      {error ? <ErrorState title="Hata" description={error} onRetry={load} /> : null}

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Yeni modül ekle</p>
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          <input
            className="rounded border border-border px-2 py-1.5 text-sm"
            placeholder="kod (crm_pro)"
            value={draft.code}
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
          />
          <input
            className="rounded border border-border px-2 py-1.5 text-sm"
            placeholder="Ad"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          />
          <input
            className="rounded border border-border px-2 py-1.5 text-sm"
            placeholder="Kategori"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          />
          <input
            type="number"
            className="rounded border border-border px-2 py-1.5 text-sm"
            placeholder="Aylık"
            value={draft.monthlyPrice}
            onChange={(e) => setDraft((d) => ({ ...d, monthlyPrice: Number(e.target.value) }))}
          />
          <input
            type="number"
            className="rounded border border-border px-2 py-1.5 text-sm"
            placeholder="Yıllık"
            value={draft.yearlyPrice}
            onChange={(e) => setDraft((d) => ({ ...d, yearlyPrice: Number(e.target.value) }))}
          />
          <button
            type="button"
            disabled={creating}
            onClick={createAddon}
            className="rounded-lg bg-bach-blue px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </div>
        <input
          className="w-full rounded border border-border px-2 py-1.5 text-sm"
          placeholder="Kısa açıklama"
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        />
      </Card>

      <div className="overflow-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-elevated text-left text-text-muted">
            <tr>
              <th className="px-3 py-2">Modül</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Açıklama</th>
              <th className="px-3 py-2">Aylık</th>
              <th className="px-3 py-2">Yıllık</th>
              <th className="px-3 py-2">Sıra</th>
              <th className="px-3 py-2">Mağaza</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {addons.map((a) => (
              <tr key={a.id} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{a.label}</div>
                  <div className="text-xs text-text-subtle">{a.code}</div>
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-28 rounded border border-border px-2 py-1"
                    defaultValue={a.category || ''}
                    onBlur={(e) => saveField(a, 'category', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    className="min-h-[56px] w-48 rounded border border-border px-2 py-1 text-xs"
                    defaultValue={a.description || ''}
                    onBlur={(e) => saveField(a, 'description', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="w-24 rounded border border-border px-2 py-1"
                    defaultValue={a.monthlyPrice}
                    onBlur={(e) => saveField(a, 'monthlyPrice', Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="w-28 rounded border border-border px-2 py-1"
                    defaultValue={a.yearlyPrice}
                    onBlur={(e) => saveField(a, 'yearlyPrice', Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="w-16 rounded border border-border px-2 py-1"
                    defaultValue={a.sortOrder ?? 0}
                    onBlur={(e) => saveField(a, 'sortOrder', Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2">
                  <button type="button" className="text-bach-blue font-semibold" onClick={() => toggleStore(a)}>
                    {a.storeVisible === false ? 'Gizli' : 'Görünür'}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button type="button" className="text-bach-blue font-semibold" onClick={() => toggle(a)}>
                    {a.active === false ? 'Aktifleştir' : 'Pasifleştir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BillingSubscriptionsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([])
  const [error, setError] = useState('')
  const [licenseDetail, setLicenseDetail] = useState<{
    customer: { company?: string; email?: string; plan?: string; planCode?: string }
    limits: { maxCompanies: number; maxBranches: number; maxWarehouses: number }
    usage: { companies: number; branches: number; warehouses: number }
    overLimit: boolean
    over: { companies: boolean; branches: boolean; warehouses: boolean }
    multiCompanyEnabled: boolean
  } | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await billingAdminApi.subscriptions()
      setRows(data.rows || [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Abonelikler" subtitle="Kalan gün / saat / dakika, paket ve müşteri lisans detayı." />
      {error ? <ErrorState title="Hata" description={error} onRetry={load} /> : null}
      {licenseDetail ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text">Müşteri Lisans Detayı</h3>
              <p className="text-sm text-text-muted">
                {licenseDetail.customer.company} · {licenseDetail.customer.email} · {licenseDetail.customer.plan}
              </p>
            </div>
            <button type="button" className="text-sm font-semibold text-bach-blue" onClick={() => setLicenseDetail(null)}>
              Kapat
            </button>
          </div>
          {!licenseDetail.multiCompanyEnabled ? (
            <p className="rounded-lg border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Çoklu şirket bu pakette kapalı. Enterprise veya multi_company modülü gerekir.
            </p>
          ) : null}
          {licenseDetail.overLimit ? (
            <p className="rounded-lg border border-rose-300/50 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              Limit aşımı var — müşteri ile iletişime geçin veya limiti artırın.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ['Şirket', licenseDetail.usage.companies, licenseDetail.limits.maxCompanies, licenseDetail.over.companies],
                ['Şube', licenseDetail.usage.branches, licenseDetail.limits.maxBranches, licenseDetail.over.branches],
                ['Depo', licenseDetail.usage.warehouses, licenseDetail.limits.maxWarehouses, licenseDetail.over.warehouses],
              ] as const
            ).map(([label, used, max, warn]) => (
              <div
                key={label}
                className={`rounded-xl border px-3 py-3 text-sm ${
                  warn ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-border bg-surface-elevated text-text'
                }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="mt-1 tabular-nums">
                  {used} / {max === 0 ? 'Sınırsız' : max}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <div className="overflow-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-elevated text-left text-text-muted">
            <tr>
              <th className="px-3 py-2">Firma</th>
              <th className="px-3 py-2">Paket</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">Kalan</th>
              <th className="px-3 py-2">Org limit</th>
              <th className="px-3 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.company}</div>
                  <div className="text-xs text-text-subtle">{r.email}</div>
                </td>
                <td className="px-3 py-2">{r.planName}</td>
                <td className="px-3 py-2">
                  <Badge variant={r.status === 'expired' ? 'danger' : r.status === 'grace' ? 'warning' : 'success'}>
                    {r.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {r.remainingDays ?? '—'}g {r.remainingHours ?? '—'}s {r.remainingMinutes ?? '—'}dk
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className={r.orgOverLimit ? 'font-semibold text-rose-600' : 'text-text-muted'}>
                    {r.limits?.maxCompanies === 0 ? '∞' : r.limits?.maxCompanies ?? '—'} ş ·{' '}
                    {r.limits?.maxBranches === 0 ? '∞' : r.limits?.maxBranches ?? '—'} sb ·{' '}
                    {r.limits?.maxWarehouses === 0 ? '∞' : r.limits?.maxWarehouses ?? '—'} dp
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs font-semibold text-bach-blue"
                      onClick={async () => {
                        try {
                          const data = await billingAdminApi.licenseDetail(r.customerId)
                          setLicenseDetail(data)
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Lisans detayı alınamadı')
                        }
                      }}
                    >
                      Lisans detayı
                    </button>
                    <select
                      className="rounded border border-border px-2 py-1"
                      defaultValue=""
                      onChange={async (e) => {
                        const planCode = e.target.value
                        if (!planCode) return
                        await billingAdminApi.patchSubscription(r.id, { planCode })
                        await load()
                      }}
                    >
                      <option value="">Paket değiştir…</option>
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BillingPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await billingAdminApi.payments()
      setRows(data.rows || [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Ödemeler" subtitle="Kart otomatik; Havale/EFT için onay." />
      {error ? <ErrorState title="Hata" description={error} onRetry={load} /> : null}
      <div className="overflow-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-elevated text-left text-text-muted">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Yöntem</th>
              <th className="px-3 py-2">Tutar</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{p.id}</td>
                <td className="px-3 py-2">{p.planCode}</td>
                <td className="px-3 py-2">{p.method}</td>
                <td className="px-3 py-2">
                  <Money value={p.amountTry} />
                </td>
                <td className="px-3 py-2">{p.status}</td>
                <td className="px-3 py-2">
                  {p.status === 'pending_payment' || p.status === 'processing' ? (
                    <button
                      type="button"
                      className="font-semibold text-bach-blue"
                      onClick={async () => {
                        await billingAdminApi.approvePayment(p.id)
                        await load()
                      }}
                    >
                      Onayla
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SimpleBillingList({
  title,
  description,
  loader,
  createLabel,
  onCreate,
  columns,
}: {
  title: string
  description: string
  loader: () => Promise<Record<string, unknown>[]>
  createLabel?: string
  onCreate?: () => Promise<void>
  columns: { key: string; label: string }[]
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try {
      setRows(await loader())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }, [loader])
  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={title}
        subtitle={description}
        actions={
          onCreate ? (
            <button
              type="button"
              className="rounded-lg bg-bach-blue px-3 py-2 text-sm font-semibold text-white"
              onClick={async () => {
                await onCreate()
                await load()
              }}
            >
              {createLabel || 'Ekle'}
            </button>
          ) : undefined
        }
      />
      {error ? <ErrorState title="Hata" description={error} onRetry={load} /> : null}
      <div className="overflow-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-elevated text-left text-text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={String(r.id || idx)} className="border-t border-border">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    {String(r[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BillingPricingPage() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  useEffect(() => {
    billingAdminApi.plans().then((d) => setPlans(d.plans || []))
  }, [])
  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Fiyatlandırma" subtitle="Tüm dönem fiyatlarının özeti." />
      <div className="overflow-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-elevated text-left text-text-muted">
            <tr>
              <th className="px-3 py-2">Paket</th>
              <th className="px-3 py-2">Aylık</th>
              <th className="px-3 py-2">1 Yıl</th>
              <th className="px-3 py-2">2 Yıl</th>
              <th className="px-3 py-2">3 Yıl</th>
              <th className="px-3 py-2">5 Yıl</th>
              <th className="px-3 py-2">10 Yıl</th>
              <th className="px-3 py-2">Sınırsız</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{p.name}</td>
                {(['month', 'year', 'year2', 'year3', 'year5', 'year10', 'lifetime'] as const).map((k) => (
                  <td key={k} className="px-3 py-2">
                    <Money value={p.prices?.[k]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BillingCouponsPage() {
  return (
    <SimpleBillingList
      title="Kuponlar"
      description="İndirim kodları."
      loader={async () => (await billingAdminApi.coupons()).rows as unknown as Record<string, unknown>[]}
      createLabel="Örnek kupon"
      onCreate={async () => {
        await billingAdminApi.createCoupon({
          code: `BM${Date.now().toString().slice(-6)}`,
          type: 'percent',
          value: 10,
          active: true,
        })
      }}
      columns={[
        { key: 'code', label: 'Kod' },
        { key: 'type', label: 'Tip' },
        { key: 'value', label: 'Değer' },
        { key: 'usedCount', label: 'Kullanım' },
        { key: 'active', label: 'Aktif' },
      ]}
    />
  )
}

export function BillingCampaignsPage() {
  return (
    <SimpleBillingList
      title="Kampanyalar"
      description="Dönemsel kampanyalar."
      loader={async () => (await billingAdminApi.campaigns()).rows as unknown as Record<string, unknown>[]}
      createLabel="Kampanya ekle"
      onCreate={async () => {
        await billingAdminApi.createCampaign({
          name: 'Yeni Kampanya',
          discountPercent: 15,
          planCodes: ['professional'],
          active: true,
        })
      }}
      columns={[
        { key: 'name', label: 'Ad' },
        { key: 'discountPercent', label: 'İndirim %' },
        { key: 'active', label: 'Aktif' },
      ]}
    />
  )
}

export function BillingTrialsPage() {
  return (
    <SimpleBillingList
      title="Deneme Süreleri"
      description="Varsayılan deneme kuralları."
      loader={async () => (await billingAdminApi.trialPeriods()).rows as unknown as Record<string, unknown>[]}
      createLabel="Kural ekle"
      onCreate={async () => {
        await billingAdminApi.createTrial({ name: '14 Gün Deneme', days: 14, planCode: 'starter', active: true })
      }}
      columns={[
        { key: 'name', label: 'Ad' },
        { key: 'days', label: 'Gün' },
        { key: 'planCode', label: 'Paket' },
        { key: 'active', label: 'Aktif' },
      ]}
    />
  )
}

export function BillingInvoicesPage() {
  return (
    <SimpleBillingList
      title="Faturalar"
      description="Kesilen faturalar."
      loader={async () => (await billingAdminApi.invoices()).rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: 'number', label: 'No' },
        { key: 'planCode', label: 'Paket' },
        { key: 'amountTry', label: 'Tutar' },
        { key: 'issuedAt', label: 'Tarih' },
      ]}
    />
  )
}

export function BillingRenewalsPage() {
  return (
    <SimpleBillingList
      title="Otomatik Yenilemeler"
      description="autoRenew açık abonelikler."
      loader={async () => (await billingAdminApi.renewals()).rows as unknown as Record<string, unknown>[]}
      columns={[
        { key: 'company', label: 'Firma' },
        { key: 'planName', label: 'Paket' },
        { key: 'periodEnd', label: 'Bitiş' },
        { key: 'status', label: 'Durum' },
      ]}
    />
  )
}

export function BillingHistoryPage() {
  const rowsMemo = useMemo(
    () => async () => (await billingAdminApi.history()).rows as unknown as Record<string, unknown>[],
    [],
  )
  return (
    <SimpleBillingList
      title="Abonelik Logları"
      description="Satın alma, upgrade, grace, expired kayıtları."
      loader={rowsMemo}
      columns={[
        { key: 'at', label: 'Zaman' },
        { key: 'action', label: 'Aksiyon' },
        { key: 'customerId', label: 'Müşteri' },
      ]}
    />
  )
}
