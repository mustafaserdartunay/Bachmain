import { DEFAULT_GIFT_DESIGN, normalizeGiftDesign } from '../storefront/giftDesignPresets'

export const WEB_TEMPLATE_KEY = 'bach-web-template'
export const WEB_GIFT_TEMPLATE_ID = 'hediye-vitrin'

const DEFAULT_TEMPLATE = {
  templateId: WEB_GIFT_TEMPLATE_ID,
  selected: false,
  published: false,
  logoText: 'LOGO',
  slogan: 'More Than a Gift',
  announcement: 'İlk siparişinde 250 TL indirim için hemen üye ol!',
  design: { ...DEFAULT_GIFT_DESIGN },
  updatedAt: '',
}

function notify() {
  window.dispatchEvent(new CustomEvent('bach:web-template-updated'))
}

export function getWebTemplate() {
  try {
    const raw = localStorage.getItem(WEB_TEMPLATE_KEY)
    if (!raw) return { ...DEFAULT_TEMPLATE }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_TEMPLATE,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
      logoText: String(parsed?.logoText || 'LOGO').trim() || 'LOGO',
      design: normalizeGiftDesign(parsed && parsed.design),
    }
  } catch {
    return { ...DEFAULT_TEMPLATE }
  }
}

export function saveWebTemplate(patch) {
  const next = {
    ...getWebTemplate(),
    ...patch,
    logoText:
      String(
        patch.logoText !== undefined && patch.logoText !== null
          ? patch.logoText
          : getWebTemplate().logoText || 'LOGO',
      ).trim() || 'LOGO',
    design: normalizeGiftDesign({
      ...getWebTemplate().design,
      ...(patch.design && typeof patch.design === 'object' ? patch.design : {}),
    }),
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(WEB_TEMPLATE_KEY, JSON.stringify(next))
    notify()
  } catch {
    // ignore quota
  }
  return next
}

export function selectWebTemplate() {
  return saveWebTemplate({
    templateId: WEB_GIFT_TEMPLATE_ID,
    selected: true,
    published: true,
  })
}

export function selectReadySiteTemplate(template) {
  return saveWebTemplate({
    templateId: template?.id || 'furni-1.0.0',
    selected: true,
    published: false,
    logoText: template?.logoText || 'Furni',
    slogan: template?.slogan || 'Modern Interior Design Studio',
  })
}

export function isGiftTemplateLive() {
  const tpl = getWebTemplate()
  return Boolean(tpl.selected && tpl.published)
}

export function applyWebTemplateDesign(patch) {
  const current = getWebTemplate()
  return saveWebTemplate({
    design: normalizeGiftDesign({
      ...current.design,
      ...(patch && typeof patch === 'object' ? patch : {}),
    }),
  })
}
