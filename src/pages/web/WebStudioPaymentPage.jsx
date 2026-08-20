import { useState } from 'react'
import { CreditCard, Landmark, Save } from 'lucide-react'
import { FormFieldCompact, FormSectionPanel } from '../../components/Common/FormSectionPanel'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../../components/Layout/HeaderCashActionsPanel'
import { WEB_STUDIO_MANAGEMENT_PATH } from '../../data/webMenu'
import { YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import { getWebPaymentSettings, saveWebPaymentSettings } from '../../utils/webStudioSettings'

const inputClass = 'form-input !h-8 !min-h-8 !py-1'

export default function WebStudioPaymentPage() {
  const [form, setForm] = useState(() => getWebPaymentSettings())
  const [saved, setSaved] = useState(false)

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = saveWebPaymentSettings(form)
    setForm(next)
    setSaved(true)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Ödeme ayarları"
        backTo={WEB_STUDIO_MANAGEMENT_PATH}
        backLabel="Güncel Durum"
        actions={
          <button type="submit" form="web-payment-form" className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}>
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>{saved ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        }
      />

      <form id="web-payment-form" onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-2">
        <FormSectionPanel icon={CreditCard} title="iyzico">
          <label className="flex min-h-[2.25rem] items-center gap-2 rounded-xl px-2.5 text-[12px] font-semibold text-[var(--ink)]">
            <input type="checkbox" checked={form.iyzicoEnabled} onChange={(event) => setField('iyzicoEnabled', event.target.checked)} />
            iyzico’yu etkinleştir
          </label>
          <label className="flex min-h-[2.25rem] items-center gap-2 rounded-xl px-2.5 text-[12px] font-semibold text-[var(--ink)]">
            <input type="checkbox" checked={form.iyzicoSandbox} onChange={(event) => setField('iyzicoSandbox', event.target.checked)} />
            Sandbox (test) ortamı
          </label>
          <FormFieldCompact label="API Key:" as="label">
            <input className={inputClass} value={form.iyzicoApiKey} onChange={(event) => setField('iyzicoApiKey', event.target.value)} autoComplete="off" />
          </FormFieldCompact>
          <FormFieldCompact label="Secret:" as="label">
            <input className={inputClass} type="password" value={form.iyzicoSecret} onChange={(event) => setField('iyzicoSecret', event.target.value)} autoComplete="off" />
          </FormFieldCompact>
        </FormSectionPanel>

        <FormSectionPanel icon={Landmark} title="Havale / EFT" dotColor="emerald">
          <label className="flex min-h-[2.25rem] items-center gap-2 rounded-xl px-2.5 text-[12px] font-semibold text-[var(--ink)]">
            <input type="checkbox" checked={form.havaleEnabled} onChange={(event) => setField('havaleEnabled', event.target.checked)} />
            Havale / EFT’yi etkinleştir
          </label>
          <FormFieldCompact label="Banka:" as="label">
            <input className={inputClass} value={form.bankName} onChange={(event) => setField('bankName', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="IBAN:" as="label">
            <input className={inputClass} value={form.iban} onChange={(event) => setField('iban', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="Hesap adı:" as="label">
            <input className={inputClass} value={form.accountHolder} onChange={(event) => setField('accountHolder', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="Açıklama şablonu:" as="label">
            <input className={inputClass} value={form.transferNoteTemplate} onChange={(event) => setField('transferNoteTemplate', event.target.value)} />
          </FormFieldCompact>
        </FormSectionPanel>
      </form>
    </AppPageShell>
  )
}
