import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, ImagePlus, Save, UserRound } from 'lucide-react'
import { ensureUserProfile, updateUserProfile } from '../utils/userProfile'
import { readCompanySettings } from '../utils/companySettings'
import { BTN_SUCCESS } from '../utils/buttonStyles'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { getPlatformApiBase, getStoredSession } from '../utils/platformAuth'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-black uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => ensureUserProfile())
  const [companyName, setCompanyName] = useState(() => readCompanySettings().companyName)
  const [saved, setSaved] = useState(false)
  const [consents, setConsents] = useState([])
  const [consentsError, setConsentsError] = useState('')

  useEffect(() => {
    function syncCompany() {
      setCompanyName(readCompanySettings().companyName)
    }
    window.addEventListener('erlenbox:company-settings-updated', syncCompany)
    return () => window.removeEventListener('erlenbox:company-settings-updated', syncCompany)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const base = getPlatformApiBase()
        const { token } = getStoredSession()
        if (!token || token === 'bachmain-local-dev') return
        const res = await fetch(`${base}/legal/consents/me`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Sözleşmeler yüklenemedi')
        if (!cancelled) setConsents(data.consents || [])
      } catch (err) {
        if (!cancelled) setConsentsError(err.message || 'Sözleşmeler yüklenemedi')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function handleAvatarUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateField('avatarDataUrl', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function handleSave(event) {
    event.preventDefault()
    updateUserProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const initials = profile.displayName?.slice(0, 1)?.toUpperCase() || 'Y'

  return (
    <AppPageShell>
      <AppPageHeader title="Profilim" />

      <form onSubmit={handleSave} className="card space-y-5">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-5 sm:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dark-500/50 bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-black text-white">
            {profile.avatarDataUrl ? (
              <img
                src={profile.avatarDataUrl}
                alt="Profil"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-lg font-black text-white">{profile.displayName}</p>
            <p className="text-sm font-semibold text-gray-500">
              {companyName || profile.companyName}
            </p>
            <p className="mt-1 text-xs font-bold text-blue-300">Müşteri No: {profile.tenantCode}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-gray-300 transition-colors hover:bg-dark-700 hover:text-white">
            <ImagePlus className="h-4 w-4" />
            Fotoğraf Yükle
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4 sm:grid-cols-2">
          <Link
            to="/profil/paketim"
            className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-3 text-sm font-bold text-white hover:bg-dark-600"
          >
            Paketim
          </Link>
          <Link
            to="/paketler"
            className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 hover:bg-blue-500/20"
          >
            Paketler / Satın Al
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad Soyad">
            <input
              value={profile.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Ünvan">
            <input
              value={profile.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Firma Adı">
            <input
              value={profile.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Müşteri Numarası">
            <input
              value={profile.tenantCode}
              readOnly
              className="form-input cursor-not-allowed opacity-70"
            />
          </Field>
          <Field label="E-posta">
            <input
              value={profile.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="form-input"
              data-no-autocap
            />
          </Field>
          <Field label="Telefon">
            <input
              value={profile.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="form-input"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            className={`${BTN_SUCCESS} gap-2 px-4 py-3 text-xs uppercase tracking-wide`}
          >
            <Save className="h-4 w-4" />
            {saved ? 'Kaydedildi' : 'Profili Kaydet'}
          </button>
        </div>
      </form>

      <section className={`${APP_SURFACE_PANEL_CLASS} space-y-4 p-5`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-white">Sözleşmelerim</h2>
            <p className="text-xs font-semibold text-gray-500">
              Kabul ettiğiniz sözleşmeler, versiyon ve tarih bilgisi.
            </p>
          </div>
        </div>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
          Bu sözleşmeler yayına alınmadan önce KVKK, e-Ticaret ve Tüketici Hukuku alanında uzman bir
          avukat tarafından kontrol edilmelidir.
        </p>
        {consentsError ? (
          <p className="text-sm text-rose-300">{consentsError}</p>
        ) : consents.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz kayıtlı sözleşme onayı yok.</p>
        ) : (
          <ul className="space-y-2">
            {consents.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-500/40 bg-dark-700/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-white">{c.title || c.type}</p>
                  <p className="text-xs text-gray-400">
                    v{c.version} ·{' '}
                    {c.acceptedAt ? new Date(c.acceptedAt).toLocaleString('tr-TR') : '—'} ·{' '}
                    {c.ip || '—'}
                  </p>
                </div>
                <a
                  href={`https://www.bachmain.com/${String(c.type || '')
                    .replace('terms_of_use', 'kullanim-kosullari')
                    .replace('service_agreement', 'hizmet-sozlesmesi')
                    .replace('privacy_policy', 'gizlilik-politikasi')
                    .replace('kvkk_notice', 'kvkk-aydinlatma-metni')
                    .replace('cookie_policy', 'cerez-politikasi')
                    .replace('cancel_refund', 'iptal-iade-politikasi')
                    .replace('demo_terms', 'demo-kullanim-kosullari')
                    .replace('data_security', 'veri-guvenligi')
                    .replace('license_agreement', 'lisans-sozlesmesi')
                    .replace('explicit_consent', 'acik-riza-metni')
                    .replace('electronic_comms', 'elektronik-ileti-onayi')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500/50 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-dark-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF / Yazdır
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-white">Hesap Bilgisi</h2>
            <p className="text-xs font-semibold text-gray-500">
              Müşteri numaranız destek ekibimiz tarafından tanımlanır. Kayıt tarihi:{' '}
              {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      </section>
    </AppPageShell>
  )
}
