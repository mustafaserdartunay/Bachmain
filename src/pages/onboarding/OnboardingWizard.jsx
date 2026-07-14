import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../../components/Layout/BrandLogo'

const STORAGE_KEY = 'bachmain_onboarding_draft'

const STEPS = [
  { id: 'company', title: 'Firma', subtitle: 'Şirket bilgilerinizi girin' },
  { id: 'warehouse', title: 'Depo', subtitle: 'İlk deponuzu tanımlayın' },
  { id: 'cash', title: 'Kasa', subtitle: 'Nakit / banka kasası ekleyin' },
  { id: 'currency', title: 'Para birimi', subtitle: 'Varsayılan para birimini seçin' },
  { id: 'products', title: 'Ürünler', subtitle: 'İlk ürünlerinizi ekleyin (isteğe bağlı)' },
  { id: 'customers', title: 'Müşteriler', subtitle: 'İlk müşterilerinizi ekleyin (isteğe bağlı)' },
  { id: 'finish', title: 'Tamamla', subtitle: 'Kurulumu bitirin ve uygulamaya geçin' },
]

const fieldClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-[#2f6fed]/20 placeholder:text-slate-400 focus:border-[#2f6fed] focus:ring-4'

const emptyDraft = {
  step: 0,
  company: { name: '', taxNumber: '', phone: '', city: '' },
  warehouse: { name: '', code: '', address: '' },
  cash: { name: '', type: 'kasa', openingBalance: '' },
  currency: { code: 'TRY', symbol: '₺' },
  products: { names: '' },
  customers: { names: '' },
}

function readDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...emptyDraft }
    const parsed = JSON.parse(raw)
    return {
      ...emptyDraft,
      ...parsed,
      company: { ...emptyDraft.company, ...(parsed.company || {}) },
      warehouse: { ...emptyDraft.warehouse, ...(parsed.warehouse || {}) },
      cash: { ...emptyDraft.cash, ...(parsed.cash || {}) },
      currency: { ...emptyDraft.currency, ...(parsed.currency || {}) },
      products: { ...emptyDraft.products, ...(parsed.products || {}) },
      customers: { ...emptyDraft.customers, ...(parsed.customers || {}) },
      step: Math.min(Math.max(Number(parsed.step) || 0, 0), STEPS.length - 1),
    }
  } catch {
    return { ...emptyDraft }
  }
}

export default function OnboardingWizard({ onComplete }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(readDraft)
  const step = draft.step
  const meta = STEPS[step]

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  function patch(section, key) {
    return (event) => {
      const value = event.target.value
      setDraft((current) => ({
        ...current,
        [section]: { ...current[section], [key]: value },
      }))
    }
  }

  function go(delta) {
    setDraft((current) => ({
      ...current,
      step: Math.min(Math.max(current.step + delta, 0), STEPS.length - 1),
    }))
  }

  function finish() {
    localStorage.removeItem(STORAGE_KEY)
    if (typeof onComplete === 'function') {
      Promise.resolve(onComplete(draft))
        .then(() => navigate('/', { replace: true }))
        .catch(() => navigate('/', { replace: true }))
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f4f6fa_45%,_#eef1f6_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#0b1f3a]">Kurulum sihirbazı</h1>
          <p className="mt-2 text-sm text-slate-600">
            Adım {step + 1} / {STEPS.length}: {meta.title}
          </p>
        </div>

        <div className="mb-5 flex gap-1.5" aria-hidden>
          {STEPS.map((s, index) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition ${
                index <= step ? 'bg-[#0b1f3a]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(11,31,58,0.45)] backdrop-blur">
          <h2 className="text-lg font-semibold text-[#0b1f3a]">{meta.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{meta.subtitle}</p>

          <div className="mt-5 space-y-3.5">
            {meta.id === 'company' ? (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Firma adı
                  <input className={fieldClass} required value={draft.company.name} onChange={patch('company', 'name')} />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Vergi no
                  <input className={fieldClass} value={draft.company.taxNumber} onChange={patch('company', 'taxNumber')} />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Telefon
                  <input className={fieldClass} value={draft.company.phone} onChange={patch('company', 'phone')} />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Şehir
                  <input className={fieldClass} value={draft.company.city} onChange={patch('company', 'city')} />
                </label>
              </>
            ) : null}

            {meta.id === 'warehouse' ? (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Depo adı
                  <input className={fieldClass} required value={draft.warehouse.name} onChange={patch('warehouse', 'name')} />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Depo kodu
                  <input className={fieldClass} value={draft.warehouse.code} onChange={patch('warehouse', 'code')} placeholder="ANA" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Adres
                  <input className={fieldClass} value={draft.warehouse.address} onChange={patch('warehouse', 'address')} />
                </label>
              </>
            ) : null}

            {meta.id === 'cash' ? (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Kasa / hesap adı
                  <input className={fieldClass} required value={draft.cash.name} onChange={patch('cash', 'name')} />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Tür
                  <select className={fieldClass} value={draft.cash.type} onChange={patch('cash', 'type')}>
                    <option value="kasa">Nakit kasa</option>
                    <option value="banka">Banka hesabı</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Açılış bakiyesi
                  <input
                    className={fieldClass}
                    type="number"
                    inputMode="decimal"
                    value={draft.cash.openingBalance}
                    onChange={patch('cash', 'openingBalance')}
                    placeholder="0"
                  />
                </label>
              </>
            ) : null}

            {meta.id === 'currency' ? (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Para birimi
                  <select className={fieldClass} value={draft.currency.code} onChange={patch('currency', 'code')}>
                    <option value="TRY">TRY — Türk Lirası</option>
                    <option value="USD">USD — ABD Doları</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — Sterlin</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Sembol
                  <input className={fieldClass} value={draft.currency.symbol} onChange={patch('currency', 'symbol')} />
                </label>
              </>
            ) : null}

            {meta.id === 'products' ? (
              <label className="block text-sm font-medium text-slate-700">
                Ürün adları (virgülle ayırın)
                <textarea
                  className={`${fieldClass} min-h-[96px] resize-y`}
                  value={draft.products.names}
                  onChange={patch('products', 'names')}
                  placeholder="Ürün A, Ürün B"
                />
              </label>
            ) : null}

            {meta.id === 'customers' ? (
              <label className="block text-sm font-medium text-slate-700">
                Müşteri adları (virgülle ayırın)
                <textarea
                  className={`${fieldClass} min-h-[96px] resize-y`}
                  value={draft.customers.names}
                  onChange={patch('customers', 'names')}
                  placeholder="Firma A, Firma B"
                />
              </label>
            ) : null}

            {meta.id === 'finish' ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-[#0b1f3a]">Hazırsınız</p>
                <p className="mt-1">
                  {draft.company.name || 'Firmanız'} için depo, kasa ve para birimi ayarları kaydedildi.
                  Uygulamaya geçerek satış ve stok işlemlerine başlayabilirsiniz.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => go(-1)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Geri
            </button>
            {meta.id === 'finish' ? (
              <button
                type="button"
                onClick={finish}
                className="rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143056]"
              >
                Bitir ve devam et
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143056]"
              >
                İleri
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
