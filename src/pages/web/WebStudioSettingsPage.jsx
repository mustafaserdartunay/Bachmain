import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe2, Save, Store } from 'lucide-react'
import { FormFieldCompact, FormSectionPanel } from '../../components/Common/FormSectionPanel'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../../components/Layout/HeaderCashActionsPanel'
import { WEB_STUDIO_DOMAIN_CONNECT_PATH, WEB_STUDIO_MANAGEMENT_PATH } from '../../data/webMenu'
import { YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import { getPages, getSites } from '../../utils/webSiteStorage'
import { getWebStoreProfile, saveWebStoreProfile } from '../../utils/webStudioSettings'

const inputClass = 'form-input !h-8 !min-h-8 !py-1'
const areaClass = 'form-input min-h-[5.5rem] py-2'

export default function WebStudioSettingsPage() {
  const [form, setForm] = useState(() => getWebStoreProfile())
  const [saved, setSaved] = useState(false)
  const sites = useMemo(() => getSites(), [])
  const pages = useMemo(() => getPages(), [])
  const connected = sites.filter((site) => site.domain).length

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = saveWebStoreProfile(form)
    setForm(next)
    setSaved(true)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Mağaza profili"
        backTo={WEB_STUDIO_MANAGEMENT_PATH}
        backLabel="Güncel Durum"
        actions={
          <button type="submit" form="web-profile-form" className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}>
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>{saved ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        }
      />

      <form id="web-profile-form" onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <FormSectionPanel icon={Store} title="Mağaza bilgisi">
          <FormFieldCompact label="Unvan:" as="label">
            <input className={inputClass} value={form.name} onChange={(event) => setField('name', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="Slogan:" as="label">
            <input className={inputClass} value={form.slogan} onChange={(event) => setField('slogan', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="E-posta:" as="label">
            <input className={inputClass} value={form.email} onChange={(event) => setField('email', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="Telefon:" as="label">
            <input className={inputClass} value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="Adres:" as="label">
            <input className={inputClass} value={form.address} onChange={(event) => setField('address', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="Instagram:" as="label">
            <input className={inputClass} value={form.instagramUrl} onChange={(event) => setField('instagramUrl', event.target.value)} />
          </FormFieldCompact>
          <FormFieldCompact label="Hakkında:" as="label">
            <textarea className={areaClass} value={form.about} onChange={(event) => setField('about', event.target.value)} />
          </FormFieldCompact>
        </FormSectionPanel>

        <div className="space-y-4">
          <Link
            to={WEB_STUDIO_DOMAIN_CONNECT_PATH}
            className="card flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-white/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <Globe2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-[var(--ink)]">Domain bağla</p>
                <p className="text-[12px] font-semibold text-[var(--muted)]">
                  {sites.length} site · {connected} domain · {pages.length} sayfa
                </p>
              </div>
            </div>
            <span className="text-[12px] font-extrabold text-blue-600">Aç</span>
          </Link>

          <FormSectionPanel icon={Store} title="Yasal metinler" dotColor="violet">
            <FormFieldCompact label="Şartlar:" as="label">
              <textarea className={areaClass} value={form.legalTerms} onChange={(event) => setField('legalTerms', event.target.value)} />
            </FormFieldCompact>
            <FormFieldCompact label="Gizlilik:" as="label">
              <textarea className={areaClass} value={form.legalPrivacy} onChange={(event) => setField('legalPrivacy', event.target.value)} />
            </FormFieldCompact>
          </FormSectionPanel>
        </div>
      </form>
    </AppPageShell>
  )
}
