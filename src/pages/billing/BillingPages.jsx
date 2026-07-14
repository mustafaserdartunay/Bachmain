import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getPlatformApiBase, getStoredSession } from '../../utils/platformAuth'

async function billingFetch(path, { method = 'GET', body } = {}) {
  const base = getPlatformApiBase()
  const { token } = getStoredSession()
  const res = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    err.code = data.error
    throw err
  }
  return data
}

export function MyPlanPage() {
  const { user, refreshUser } = useAuth()
  const [snap, setSnap] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    billingFetch('billing/my-subscription')
      .then(setSnap)
      .catch((e) => setError(e.message))
    refreshUser?.()
  }, [refreshUser])

  const cd = snap?.countdown || {}

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paketim</h1>
          <p className="text-sm text-slate-500">Abonelik, limitler ve ödeme geçmişi</p>
        </div>
        <Link
          to="/profil/paket-satin-al"
          className="rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Paket Satın Al
        </Link>
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mevcut paket</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{snap?.plan?.name || user?.plan || '—'}</p>
          <p className="mt-1 text-sm text-slate-500">Durum: {snap?.subscription?.status || user?.subscriptionStatus || user?.status}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kalan süre</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
            {cd.remainingDays ?? user?.remainingDays ?? '—'} gün
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {cd.remainingHours ?? '—'} saat · {cd.remainingMinutes ?? '—'} dk
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tarihler</p>
          <p className="mt-2 text-sm">Başlangıç: {(snap?.subscription?.periodStart || '').slice(0, 10) || '—'}</p>
          <p className="text-sm">Bitiş: {(snap?.subscription?.periodEnd || user?.licenseExpiry || '').toString().slice(0, 10) || '—'}</p>
          {snap?.subscription?.graceUntil ? (
            <p className="text-sm text-amber-700">Grace: {String(snap.subscription.graceUntil).slice(0, 10)}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Limitler</p>
          <p className="mt-2 text-sm">
            Kullanıcı: {snap?.plan?.maxUsers === 0 ? 'Limitsiz' : snap?.plan?.maxUsers ?? user?.limits?.maxUsers ?? '—'}
          </p>
          <p className="text-sm">
            Depolama: {snap?.plan?.storageGb === 0 ? 'Limitsiz' : `${snap?.plan?.storageGb ?? user?.limits?.storageGb ?? '—'} GB`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Aktif modüller</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(snap?.entitlements || user?.entitlements || []).map((code) => (
            <span key={code} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {code}
            </span>
          ))}
          {!(snap?.entitlements || user?.entitlements || []).length ? (
            <span className="text-sm text-slate-500">Modül listesi yükleniyor…</span>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Ödeme geçmişi</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(snap?.payments || []).slice(0, 10).map((p) => (
            <li key={p.id} className="flex justify-between border-b border-slate-100 py-2">
              <span>
                {p.planCode} · {p.method} · {p.status}
              </span>
              <span className="tabular-nums">₺{Number(p.amountTry || 0).toLocaleString('tr-TR')}</span>
            </li>
          ))}
          {!snap?.payments?.length ? <li className="text-slate-500">Henüz ödeme yok.</li> : null}
        </ul>
      </div>
    </div>
  )
}

export function BuyPlanPage() {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState(null)
  const [period, setPeriod] = useState('month')
  const [error, setError] = useState('')

  useEffect(() => {
    billingFetch('billing/catalog')
      .then(setCatalog)
      .catch((e) => setError(e.message))
  }, [])

  const plans = catalog?.plans || []
  const moduleLabels = useMemo(() => {
    const map = {}
    ;(catalog?.modules || []).forEach((m) => {
      map[m.code] = m.label
    })
    return map
  }, [catalog])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paket Satın Al</h1>
          <p className="text-sm text-slate-500">Karşılaştırın ve yükseltin. Mevcut: {user?.plan || '—'}</p>
        </div>
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="month">Aylık</option>
          <option value="year">1 Yıl</option>
          <option value="year2">2 Yıl</option>
          <option value="year3">3 Yıl</option>
          <option value="year5">5 Yıl</option>
          <option value="year10">10 Yıl</option>
          <option value="lifetime">Sınırsız</option>
        </select>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const price = plan.prices?.[period] ?? plan.prices?.month ?? 0
          const isCurrent = (user?.planCode || '').toLowerCase() === plan.code
          return (
            <div key={plan.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#0b1f3a]">{plan.name}</h2>
              <p className="mt-1 min-h-[40px] text-sm text-slate-500">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
                ₺{Number(price).toLocaleString('tr-TR')}
                <span className="text-sm font-medium text-slate-400"> / {period}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-1 text-xs text-slate-600">
                {(plan.modules || []).slice(0, 8).map((code) => (
                  <li key={code}>• {moduleLabels[code] || code}</li>
                ))}
                {(plan.modules || []).length > 8 ? (
                  <li className="text-slate-400">+{(plan.modules || []).length - 8} modül daha</li>
                ) : null}
              </ul>
              <Link
                to={`/profil/odeme?plan=${encodeURIComponent(plan.code)}&period=${encodeURIComponent(period)}`}
                className="mt-5 rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                {isCurrent ? 'Yenile / Dönem Uzat' : 'Kullanmaya Başla'}
              </Link>
            </div>
          )
        })}
      </div>

      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Özellik / Modül</th>
              {plans.map((p) => (
                <th key={p.id} className="px-3 py-2">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(catalog?.modules || []).slice(0, 40).map((m) => (
              <tr key={m.code} className="border-t border-slate-100">
                <td className="px-3 py-2">{m.label}</td>
                {plans.map((p) => (
                  <td key={p.id} className="px-3 py-2">
                    {(p.modules || []).includes(m.code) ? '✔' : '—'}
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

export function CheckoutPage() {
  const params = new URLSearchParams(window.location.search)
  const [planCode, setPlanCode] = useState(params.get('plan') || 'professional')
  const [period, setPeriod] = useState(params.get('period') || 'month')
  const [method, setMethod] = useState('card')
  const [couponCode, setCouponCode] = useState('')
  const [companyInvoice, setCompanyInvoice] = useState(false)
  const [billingName, setBillingName] = useState('')
  const [taxNo, setTaxNo] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { refreshUser } = useAuth()

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const data = await billingFetch('billing/checkout', {
        method: 'POST',
        body: { planCode, period, method, couponCode: couponCode || undefined, companyInvoice, billingName, taxNo },
      })
      setResult(data)
      if (data.url) {
        window.location.href = data.url
        return
      }
      await refreshUser?.()
      window.dispatchEvent(new CustomEvent('bachmain:license-updated'))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Ödeme</h1>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-medium">
          Paket
          <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Dönem
          <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">Aylık</option>
            <option value="year">1 Yıl</option>
            <option value="year2">2 Yıl</option>
            <option value="year3">3 Yıl</option>
            <option value="year5">5 Yıl</option>
            <option value="year10">10 Yıl</option>
            <option value="lifetime">Sınırsız</option>
          </select>
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Ödeme yöntemi</legend>
          {[
            ['card', 'Kredi Kartı'],
            ['transfer', 'Havale'],
            ['eft', 'EFT'],
            ['invoice', 'Kurumsal Fatura'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="method" checked={method === value} onChange={() => setMethod(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        {(method === 'transfer' || method === 'eft' || method === 'invoice') && (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            IBAN bilgisi ödeme talebi sonrası gösterilir. Onay sonrası lisans aktif olur.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={companyInvoice} onChange={(e) => setCompanyInvoice(e.target.checked)} />
          Kurumsal fatura istiyorum
        </label>
        {companyInvoice ? (
          <>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ünvan"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Vergi no"
              value={taxNo}
              onChange={(e) => setTaxNo(e.target.value)}
            />
          </>
        ) : null}
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Kupon kodu (opsiyonel)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {result ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {result.message || 'Talep alındı.'}
            {result.iban ? <div className="mt-1 font-mono text-xs">IBAN: {result.iban}</div> : null}
            <Link className="mt-2 inline-block font-semibold underline" to="/profil/paketim">
              Paketime git
            </Link>
          </div>
        ) : null}
        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="w-full rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'İşleniyor…' : 'Ödemeyi Başlat'}
        </button>
      </div>
    </div>
  )
}

export { billingFetch }
