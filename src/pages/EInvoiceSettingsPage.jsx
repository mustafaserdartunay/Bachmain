import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Save, Server, Mail } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { FormSectionPanel } from '../components/Common/FormSectionPanel'
import { BTN_PRIMARY } from '../utils/buttonStyles'
import {
  defaultEInvoiceSettings,
  EINVOICE_SETTINGS_EVENT,
  readEInvoiceSettings,
  saveEInvoiceSettings,
} from '../utils/eInvoiceSettingsStore'

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-black uppercase tracking-wider text-gray-500">{label}</span>
      {hint ? <p className="text-[12px] font-semibold text-gray-500">{hint}</p> : null}
      {children}
    </label>
  )
}

export default function EInvoiceSettingsPage() {
  const [settings, setSettings] = useState(() => readEInvoiceSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function sync() {
      setSettings(readEInvoiceSettings())
    }
    window.addEventListener(EINVOICE_SETTINGS_EVENT, sync)
    return () => window.removeEventListener(EINVOICE_SETTINGS_EVENT, sync)
  }, [])

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  function handleSave(event) {
    event.preventDefault()
    saveEInvoiceSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="E-Fatura / E-Arşiv Ayarları"
        subtitle="GİB API ve müşteri e-posta takip verileri"
        backTo="/ayarlar"
        backLabel="Ayarlar"
      />

      <form onSubmit={handleSave} className="space-y-5">
        <FormSectionPanel icon={Server} title="GİB Bağlantısı" dotColor="blue">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mod"
              hint="Demo: canlı durum simülasyonu. Live: gerçek entegratör endpoint."
            >
              <select
                value={settings.gibApiMode}
                onChange={(event) => updateField('gibApiMode', event.target.value)}
                className="form-input"
              >
                <option value="demo">Demo (simülasyon)</option>
                <option value="live">Canlı API</option>
              </select>
            </Field>
            <Field label="Varsayılan Belge Türü">
              <select
                value={settings.defaultInvoiceKind}
                onChange={(event) => updateField('defaultInvoiceKind', event.target.value)}
                className="form-input"
              >
                <option value="e-fatura">e-Fatura</option>
                <option value="e-arsiv">e-Arşiv</option>
              </select>
            </Field>
            <Field label="API Endpoint">
              <input
                value={settings.gibEndpoint}
                onChange={(event) => updateField('gibEndpoint', event.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="GİB Alias">
              <input
                value={settings.gibAlias}
                onChange={(event) => updateField('gibAlias', event.target.value)}
                className="form-input"
                placeholder="urn:mail:..."
              />
            </Field>
            <Field label="Kullanıcı Adı">
              <input
                value={settings.gibUsername}
                onChange={(event) => updateField('gibUsername', event.target.value)}
                className="form-input"
                autoComplete="off"
              />
            </Field>
            <Field label="Şifre">
              <input
                type="password"
                value={settings.gibPassword}
                onChange={(event) => updateField('gibPassword', event.target.value)}
                className="form-input"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Gönderici VKN">
              <input
                value={settings.senderVkn}
                onChange={(event) => updateField('senderVkn', event.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Gönderici Ünvan">
              <input
                value={settings.senderTitle}
                onChange={(event) => updateField('senderTitle', event.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="e-Fatura Seri">
              <input
                value={settings.eFaturaSeries}
                onChange={(event) => updateField('eFaturaSeries', event.target.value.toUpperCase())}
                className="form-input"
              />
            </Field>
            <Field label="e-Arşiv Seri">
              <input
                value={settings.eArsivSeries}
                onChange={(event) => updateField('eArsivSeries', event.target.value.toUpperCase())}
                className="form-input"
              />
            </Field>
          </div>
        </FormSectionPanel>

        <FormSectionPanel icon={Mail} title="E-posta Takibi" dotColor="violet">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-posta takibi">
              <select
                value={settings.emailTrackingEnabled ? '1' : '0'}
                onChange={(event) =>
                  updateField('emailTrackingEnabled', event.target.value === '1')
                }
                className="form-input"
              >
                <option value="1">Açık (yolda / ulaştı / açıldı)</option>
                <option value="0">Kapalı</option>
              </select>
            </Field>
            <Field label="Canlı pipeline simülasyonu">
              <select
                value={settings.simulateLivePipeline ? '1' : '0'}
                onChange={(event) =>
                  updateField('simulateLivePipeline', event.target.value === '1')
                }
                className="form-input"
              >
                <option value="1">Açık</option>
                <option value="0">Kapalı</option>
              </select>
            </Field>
            <Field label="Gönderen E-posta">
              <input
                type="email"
                value={settings.emailFrom}
                onChange={(event) => updateField('emailFrom', event.target.value)}
                className="form-input"
                placeholder="fatura@sirket.com"
              />
            </Field>
            <Field label="Konu Şablonu" hint="{invoiceNo} değişkeni desteklenir.">
              <input
                value={settings.emailSubjectTemplate}
                onChange={(event) => updateField('emailSubjectTemplate', event.target.value)}
                className="form-input"
              />
            </Field>
          </div>
        </FormSectionPanel>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Satış faturaları:{' '}
            <Link to="/musteriler/faturalar" className="font-bold text-blue-300 hover:underline">
              Liste
            </Link>
            {' · '}
            <button
              type="button"
              className="font-bold text-gray-400 hover:text-white"
              onClick={() => setSettings({ ...defaultEInvoiceSettings })}
            >
              Varsayılana dön
            </button>
          </p>
          <button type="submit" className={`${BTN_PRIMARY} gap-2 px-5 text-xs uppercase`}>
            <Save className="h-4 w-4" />
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </form>
    </AppPageShell>
  )
}
