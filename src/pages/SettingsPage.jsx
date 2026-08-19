import { useEffect, useState } from 'react'
import { Building2, ImagePlus, Save, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  defaultCompanySettings,
  readCompanySettings,
  readImageFileAsPrintLogoDataUrl,
  QUOTE_PRINT_LOGO_SIZE_LABEL,
  saveCompanySettings,
} from '../utils/companySettings'
import { BTN_SUCCESS } from '../utils/buttonStyles'
import { flushWorkspaceNow } from '../utils/workspaceStorage'

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-black uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  )
}

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
    readImageFileAsPrintLogoDataUrl(file)
      .then((dataUrl) => updateField('logoDataUrl', dataUrl))
      .catch(() => {
        const reader = new FileReader()
        reader.onload = () => updateField('logoDataUrl', String(reader.result || ''))
        reader.readAsDataURL(file)
      })
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
    <div className="w-full space-y-5">
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

          <div
            data-tour="company-logo"
            className="flex flex-col gap-4 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4 sm:flex-row sm:items-center"
          >
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
            <div className="flex flex-col gap-1">
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-gray-300 transition-colors hover:bg-dark-700 hover:text-white">
                <ImagePlus className="h-4 w-4" />
                Logo Yükle
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              <p className="text-[11px] font-semibold text-gray-500">
                Önerilen ölçü: {QUOTE_PRINT_LOGO_SIZE_LABEL} (teklif yazdırma logosu)
              </p>
            </div>
          </div>

          <div data-tour="company-fields" className="grid gap-4 sm:grid-cols-2">
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

        <section className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/yonetici-kontrol"
              className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-xs font-black uppercase tracking-wide text-purple-300 transition-colors hover:bg-purple-500/20"
            >
              <ShieldCheck className="h-4 w-4" />
              Yönetici Kontrol Paneli
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetDefaults}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-3 text-xs font-black text-gray-300 hover:text-white"
            >
              Varsayılana Dön
            </button>
            <button
              type="submit"
              data-tour="company-save"
              className={`${BTN_SUCCESS} gap-2 px-4 py-3 text-xs uppercase tracking-wide`}
            >
              <Save className="h-4 w-4" />
              {saved ? 'Kaydedildi' : 'Kaydet'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}
