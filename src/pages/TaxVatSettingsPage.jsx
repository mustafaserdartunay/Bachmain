import { useEffect, useState } from 'react'
import { Percent, Plus, Save, Trash2 } from 'lucide-react'
import {
  createIncomeTaxBracket,
  defaultTaxVatSettings,
  readTaxVatSettings,
  saveTaxVatSettings,
  TAX_VAT_SETTINGS_EVENT,
} from '../utils/taxVatSettingsStore'
import { BTN_SUCCESS } from '../utils/buttonStyles'

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-black uppercase tracking-wider text-gray-500">{label}</span>
      {hint ? <p className="text-[13px] font-semibold text-gray-500">{hint}</p> : null}
      {children}
    </label>
  )
}

export default function TaxVatSettingsPage() {
  const [settings, setSettings] = useState(() => readTaxVatSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function sync() {
      setSettings(readTaxVatSettings())
    }
    window.addEventListener(TAX_VAT_SETTINGS_EVENT, sync)
    return () => window.removeEventListener(TAX_VAT_SETTINGS_EVENT, sync)
  }, [])

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  function updateVatRates(value) {
    const rates = String(value)
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((rate) => Number.isFinite(rate) && rate >= 0)
    updateField('vatRates', rates.length ? rates : defaultTaxVatSettings.vatRates)
  }

  function updateBracket(bracketId, partial) {
    setSettings((current) => ({
      ...current,
      incomeTaxBrackets: current.incomeTaxBrackets.map((bracket) => (
        bracket.id === bracketId ? { ...bracket, ...partial } : bracket
      )),
    }))
  }

  function addBracket() {
    setSettings((current) => ({
      ...current,
      incomeTaxBrackets: [...current.incomeTaxBrackets, createIncomeTaxBracket({ rate: current.incomeTaxRate })],
    }))
  }

  function removeBracket(bracketId) {
    setSettings((current) => ({
      ...current,
      incomeTaxBrackets: current.incomeTaxBrackets.filter((bracket) => bracket.id !== bracketId),
    }))
  }

  function handleSave(event) {
    event.preventDefault()
    saveTaxVatSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function resetDefaults() {
    setSettings({ ...defaultTaxVatSettings, incomeTaxBrackets: [...defaultTaxVatSettings.incomeTaxBrackets] })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-rose-300">
            <Percent className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Vergi ve KDV Yönetimi</h1>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Dashboard KDV ve gelir vergisi hesapları bu oranlara göre yapılır.
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-4">
        <section className="card space-y-4">
          <h2 className="text-base font-black text-white">KDV Ayarları</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Varsayılan KDV Oranı (%)" hint="Gelen faturalarda KDV ayrıştırması için kullanılır.">
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.defaultVatRate}
                onChange={(event) => updateField('defaultVatRate', event.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="KDV Dilimleri (%)" hint="Virgülle ayırın. Örn: 1, 10, 20">
              <input
                value={settings.vatRates.join(', ')}
                onChange={(event) => updateVatRates(event.target.value)}
                className="form-input"
              />
            </Field>
          </div>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-white">Gelir Vergisi Ayarları</h2>
            <button
              type="button"
              onClick={addBracket}
              className="inline-flex items-center gap-1 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-[13px] font-black uppercase tracking-wide text-gray-300 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Dilim Ekle
            </button>
          </div>

          <Field label="Varsayılan Gelir Vergisi Oranı (%)" hint="Tek dilim kullanıldığında geçerli olur.">
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.incomeTaxRate}
              onChange={(event) => updateField('incomeTaxRate', event.target.value)}
              className="form-input max-w-xs"
            />
          </Field>

          <div className="space-y-2">
            {settings.incomeTaxBrackets.map((bracket, index) => (
              <div key={bracket.id} className="grid gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Field label={`Dilim ${index + 1} Üst Limit (₺)`} hint="Boş bırakılırsa sınırsız üst dilim olur.">
                  <input
                    type="number"
                    min="0"
                    value={bracket.upTo ?? ''}
                    onChange={(event) => updateBracket(bracket.id, {
                      upTo: event.target.value === '' ? null : Number(event.target.value),
                    })}
                    className="form-input"
                    placeholder="Sınırsız"
                  />
                </Field>
                <Field label="Vergi Oranı (%)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bracket.rate}
                    onChange={(event) => updateBracket(bracket.id, { rate: Number(event.target.value) })}
                    className="form-input"
                  />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeBracket(bracket.id)}
                    disabled={settings.incomeTaxBrackets.length <= 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/50 bg-dark-700/70 text-gray-400 transition-colors hover:text-red-300 disabled:opacity-40"
                    title="Dilimi sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={resetDefaults}
            className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-3 text-xs font-black text-gray-300 hover:text-white"
          >
            Varsayılana Dön
          </button>
          <button type="submit" className={`${BTN_SUCCESS} gap-2 px-4 py-3 text-xs uppercase tracking-wide`}>
            <Save className="h-4 w-4" />
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </section>
      </form>
    </div>
  )
}
