import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Save, UserRound } from 'lucide-react'
import { ensureUserProfile, updateUserProfile } from '../utils/userProfile'
import { readCompanySettings } from '../utils/companySettings'
import { BTN_SUCCESS } from '../utils/buttonStyles'

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

  useEffect(() => {
    function syncCompany() {
      setCompanyName(readCompanySettings().companyName)
    }
    window.addEventListener('erlenbox:company-settings-updated', syncCompany)
    return () => window.removeEventListener('erlenbox:company-settings-updated', syncCompany)
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
    <div className="space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Profilim</h1>
        <p className="mt-2 text-xs font-semibold text-gray-500">Hesap bilgilerinizi güncelleyin.</p>
      </section>

      <form onSubmit={handleSave} className="card space-y-5">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-5 sm:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dark-500/50 bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-black text-white">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-lg font-black text-white">{profile.displayName}</p>
            <p className="text-sm font-semibold text-gray-500">{companyName || profile.companyName}</p>
            <p className="mt-1 text-xs font-bold text-blue-300">Müşteri No: {profile.tenantCode}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-gray-300 transition-colors hover:bg-dark-700 hover:text-white">
            <ImagePlus className="h-4 w-4" />
            Fotoğraf Yükle
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4 sm:grid-cols-2">
          <Link to="/profil/paketim" className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-3 text-sm font-bold text-white hover:bg-dark-600">
            Paketim
          </Link>
          <Link to="/paketler" className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 hover:bg-blue-500/20">
            Paketler / Satın Al
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad Soyad">
            <input value={profile.displayName} onChange={(e) => updateField('displayName', e.target.value)} className="form-input" />
          </Field>
          <Field label="Ünvan">
            <input value={profile.title} onChange={(e) => updateField('title', e.target.value)} className="form-input" />
          </Field>
          <Field label="Firma Adı">
            <input value={profile.companyName} onChange={(e) => updateField('companyName', e.target.value)} className="form-input" />
          </Field>
          <Field label="Müşteri Numarası">
            <input value={profile.tenantCode} readOnly className="form-input cursor-not-allowed opacity-70" />
          </Field>
          <Field label="E-posta">
            <input value={profile.email} onChange={(e) => updateField('email', e.target.value)} className="form-input" data-no-autocap />
          </Field>
          <Field label="Telefon">
            <input value={profile.phone} onChange={(e) => updateField('phone', e.target.value)} className="form-input" />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button type="submit" className={`${BTN_SUCCESS} gap-2 px-4 py-3 text-xs uppercase tracking-wide`}>
            <Save className="h-4 w-4" />
            {saved ? 'Kaydedildi' : 'Profili Kaydet'}
          </button>
        </div>
      </form>

      <section className="card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-white">Hesap Bilgisi</h2>
            <p className="text-xs font-semibold text-gray-500">
              Müşteri numaranız destek ekibimiz tarafından tanımlanır. Kayıt tarihi: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
