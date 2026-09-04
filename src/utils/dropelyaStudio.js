export const STUDIO_ADMIN_PAGES = [
  { path: '/web/studio/yonetim/tasarim', label: 'Tasarım', icon: 'palette' },
  { path: '/web/studio/yonetim/panel', label: 'Güncel Durum', exact: true, icon: 'dashboard' },
  { path: '/web/studio/yonetim/kategoriler', label: 'Kategoriler', icon: 'folder' },
  { path: '/web/studio/yonetim/urunler', label: 'Ürünler', icon: 'bag' },
  { path: '/web/studio/yonetim/profil', label: 'Mağaza profili', icon: 'store' },
  { path: '/web/studio/yonetim/odeme', label: 'Ödeme ayarları', icon: 'card' },
]

/** @deprecated — Studio artık BachMain içinde native sayfa */
export function dropelyaPathForStudio() {
  return '/web/studio/yonetim/tasarim'
}

export function getDropelyaAdminBase() {
  return ''
}

export function getDropelyaPageUrl() {
  return '/web/studio/yonetim/tasarim'
}

export function getDropelyaYonetimUrl() {
  return '/web/studio/yonetim/tasarim'
}

export function startStudioJump() {}
