import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutTemplate, Save } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../../components/Layout/HeaderCashActionsPanel'
import { FormFieldCompact, FormSectionPanel } from '../../components/Common/FormSectionPanel'
import {
  WEB_STUDIO_ADMIN_PATH,
  WEB_STUDIO_DOMAIN_CONNECT_PATH,
} from '../../data/webMenu'
import GiftStorefront from '../../storefront/GiftStorefront'
import GiftStorefrontDesigner from '../../storefront/GiftStorefrontDesigner'
import { YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import { getWebTemplate, saveWebTemplate, selectWebTemplate } from '../../utils/webTemplateStorage'

export default function WebStudioTemplatePage() {
  const [tpl, setTpl] = useState(() => getWebTemplate())
  const [logoText, setLogoText] = useState(tpl.logoText || 'LOGO')
  const [slogan, setSlogan] = useState(tpl.slogan || 'More Than a Gift')
  const [selectedBlock, setSelectedBlock] = useState('hero')

  useEffect(() => {
    const refresh = () => {
      const next = getWebTemplate()
      setTpl(next)
      setLogoText(next.logoText || 'LOGO')
      setSlogan(next.slogan || 'More Than a Gift')
    }
    window.addEventListener('bach:web-template-updated', refresh)
    return () => window.removeEventListener('bach:web-template-updated', refresh)
  }, [])

  function handleSave(event) {
    event.preventDefault()
    const next = saveWebTemplate({ logoText, slogan })
    setTpl(next)
  }

  function handleSelect() {
    const next = selectWebTemplate()
    const saved = saveWebTemplate({
      ...next,
      logoText: logoText || 'LOGO',
      slogan,
      selected: true,
      published: true,
    })
    setTpl(saved)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Template"
        backTo={WEB_STUDIO_ADMIN_PATH}
        backLabel="Yönetim"
        actions={
          <button
            type="button"
            onClick={handleSelect}
            className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}
          >
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <LayoutTemplate className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>
              {tpl.selected ? 'Şablon yayında' : 'Şablonu seç ve yayınla'}
            </span>
          </button>
        }
      />

      <form onSubmit={handleSave} className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <FormSectionPanel icon={LayoutTemplate} title="Şablon ayarları">
          <div className="space-y-2">
            <FormFieldCompact label="Logo yazısı:" as="label">
              <input
                className="form-input !h-8 !min-h-8 !py-1"
                value={logoText}
                onChange={(event) => setLogoText(event.target.value)}
              />
            </FormFieldCompact>
            <FormFieldCompact label="Slogan:" as="label">
              <input
                className="form-input !h-8 !min-h-8 !py-1"
                value={slogan}
                onChange={(event) => setSlogan(event.target.value)}
              />
            </FormFieldCompact>
            <p className="px-1 text-[12px] font-semibold text-[var(--muted)]">
              Vitrin üzerinde bir alanı seçin, sağdaki font veya banner kartını sürükleyip bırakın. Değişiklik canlı vitrine yazılır.
            </p>
          </div>
        </FormSectionPanel>
        <div className="flex flex-wrap items-start gap-2 xl:flex-col">
          <button type="submit" className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}>
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>Kaydet</span>
          </button>
          <Link to={WEB_STUDIO_DOMAIN_CONNECT_PATH} className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.violet}`}>
            <span className={YF_TEXT_ON_COLOR_CLASS}>Domain bağla</span>
          </Link>
        </div>
      </form>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <GiftStorefront
          preview
          editable
          selectedBlock={selectedBlock}
          onSelectBlock={setSelectedBlock}
        />
        <GiftStorefrontDesigner selectedBlock={selectedBlock} onSelectBlock={setSelectedBlock} />
      </div>
    </AppPageShell>
  )
}
