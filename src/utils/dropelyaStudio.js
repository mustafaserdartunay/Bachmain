const DROPELYA_YONETIM_ORIGIN = 'http://localhost:3000'

export const STUDIO_HOST_EVENT = 'bach:studio-cmd'
export const STUDIO_MESSAGE_TYPE = 'bach-studio'

export const STUDIO_CRM_TO_DROPELYA = {
  '/web/studio/yonetim/panel': '/yonetim',
  '/web/studio/yonetim/kategoriler': '/yonetim/kategoriler',
  '/web/studio/yonetim/urunler': '/yonetim/urunler',
  '/web/studio/yonetim/siparisler': '/yonetim/siparisler',
  '/web/studio/yonetim/profil': '/yonetim/profil',
  '/web/studio/yonetim/odeme': '/yonetim/odeme',
}

export function getDropelyaAdminBase() {
  return DROPELYA_YONETIM_ORIGIN
}

export function getDropelyaEmbedUrl(pathname = '/web/studio/yonetim/panel') {
  const dest = STUDIO_CRM_TO_DROPELYA[pathname] || '/yonetim'
  const url = new URL(dest, `${DROPELYA_YONETIM_ORIGIN}/`)
  url.searchParams.set('from', 'bachmain')
  url.searchParams.set('embed', '1')
  url.searchParams.set('shell', 'crm')
  if (typeof window !== 'undefined') {
    url.searchParams.set('back', `${window.location.origin}/`)
  }
  return url.toString()
}

export function dispatchStudioCommand(action) {
  window.dispatchEvent(new CustomEvent(STUDIO_HOST_EVENT, { detail: { action } }))
}
