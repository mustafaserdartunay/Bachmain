import { useEffect, useState } from 'react'
import {
  Building2,
  Factory,
  GitBranch,
  ImagePlus,
  Library,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  defaultCompanySettings,
  readCompanySettings,
  saveCompanySettings,
} from '../utils/companySettings'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-black uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  )
}

const LINK_PLAIN =
  'inline-flex h-control min-h-control items-center gap-2 rounded-xl bg-transparent px-3 text-xs font-extrabold tracking-wide text-[#3b82f6] transition-colors hover:text-[#60a5fa]'

export default function SettingsPage() {
  const [settings, setSettings] = useState(readCompanySettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function sync() {
      setSettings(readCompanySettings())
    }
    window.addEventListener('erlenbox:company-settings-updated', sync)
    return () => window.removeEventListener('erlenbox:company-settings-updated', sync)
  }, [])

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  function handleLogoUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateField('logoDataUrl', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function handleSave(event) {
    event.preventDefault()
    saveCompanySettings(settings)
    flushWorkspaceNow()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function resetDefaults() {
    setSettings({ ...defaultCompanySettings })
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Yönetici Ayarları"
        subtitle="Firma bilgileri ekstre PDF ve sistem genelinde kullanılır."
        backTo="/"
        backLabel="Güncel Durum"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Link to="/ayarlar/master-data" className={LINK_PLAIN}>
              <ShieldCheck className="h-4 w-4" /> MDM
            </Link>
            <Link to="/otomasyon" className={LINK_PLAIN}>
              <GitBranch className="h-4 w-4" /> Workflow
            </Link>
            <Link to="/aios" className={LINK_PLAIN}>
              <Sparkles className="h-4 w-4" /> AIOS
            </Link>
            <Link to="/bilgi-merkezi" className={LINK_PLAIN}>
              <Library className="h-4 w-4" /> Knowledge
            </Link>
            <Link to="/dijital-ikiz" className={LINK_PLAIN}>
              <Factory className="h-4 w-4" /> Twin
            </Link>
            <Link to="/ayarlar/kurumsal-yapi" className={LINK_PLAIN}>
              <Building2 className="h-4 w-4" /> Kurumsal
            </Link>
          </div>
        }
      />

      <form onSubmit={handleSave} className="space-y-4">
        <section className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Firma Bilgileri</h2>
              <p className="text-xs font-semibold text-gray-500">
                Logo, ünvan, iletişim ve vergi bilgileri
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dark-500/50 bg-dark-800">
              {settings.logoDataUrl ? (
                <img
                  src={settings.logoDataUrl}
                  alt="Firma logosu"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-gray-300 transition-colors hover:bg-dark-700 hover:text-white">
              <ImagePlus className="h-4 w-4" />
              Logo Yükle
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Firma Adı">
              <input
                value={settings.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Yasal Ünvan">
              <input
                value={settings.legalTitle}
                onChange={(e) => updateField('legalTitle', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Telefon">
              <input
                value={settings.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="E-posta">
              <input
                value={settings.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Web Sitesi">
              <input
                value={settings.website}
                onChange={(e) => updateField('website', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Vergi Dairesi">
              <input
                value={settings.taxOffice}
                onChange={(e) => updateField('taxOffice', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Vergi Numarası">
              <input
                value={settings.taxNumber}
                onChange={(e) => updateField('taxNumber', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Adres">
              <input
                value={settings.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="form-input"
              />
            </Field>
          </div>
        </section>

        <section className="app-page-header relative flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/yonetici-kontrol"
            className="inline-flex items-center gap-2 rounded-xl bg-transparent px-3 text-xs font-extrabold tracking-wide text-[#8b5cf6] transition-colors hover:text-[#a78bfa]"
          >
            <ShieldCheck className="h-4 w-4" />
            Yönetici Kontrol Paneli
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetDefaults}
              className="inline-flex h-control items-center rounded-xl bg-transparent px-3 text-xs font-extrabold text-gray-400 hover:text-white"
            >
              Varsayılana Dön
            </button>
            <button
              type="submit"
              className="inline-flex h-control items-center gap-2 rounded-xl bg-transparent px-3 text-xs font-extrabold text-[#10b981] hover:text-[#34d399]"
            >
              <Save className="h-4 w-4" />
              {saved ? 'Kaydedildi' : 'Kaydet'}
            </button>
          </div>
        </section>
      </form>
    </AppPageShell>
  )
}
