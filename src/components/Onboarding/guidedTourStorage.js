export const GUIDED_TOUR_VERSION = 2
export const GUIDED_TOUR_STORAGE_KEY = 'bach-guided-tour-v1'
export const GUIDED_TOUR_START_EVENT = 'bach:start-guided-tour'
export const GUIDED_TOUR_FORCE_KEY = 'bach-guided-tour-force'
export const GUIDED_TOUR_SIDEBAR_EVENT = 'bach:tour-sidebar'

function readStore() {
  try {
    const raw = localStorage.getItem(GUIDED_TOUR_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { version: GUIDED_TOUR_VERSION, users: {} }
    return {
      version: GUIDED_TOUR_VERSION,
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
    }
  } catch {
    return { version: GUIDED_TOUR_VERSION, users: {} }
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(GUIDED_TOUR_STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore quota */
  }
}

export function userTourKey(user) {
  return String(user?.id || user?.customerId || user?.email || 'anon')
}

export function readTourProgress(user) {
  const key = userTourKey(user)
  return readStore().users[key] || null
}

export function isTourCompleted(user) {
  return Boolean(readTourProgress(user)?.completed)
}

export function markTourFinished(user, { skipped = false } = {}) {
  const store = readStore()
  const key = userTourKey(user)
  store.users[key] = {
    completed: true,
    skipped: Boolean(skipped),
    version: GUIDED_TOUR_VERSION,
    at: new Date().toISOString(),
  }
  writeStore(store)
  try {
    sessionStorage.removeItem(GUIDED_TOUR_FORCE_KEY)
  } catch {
    /* ignore */
  }
}

export function isTourForceRequested() {
  try {
    if (sessionStorage.getItem(GUIDED_TOUR_FORCE_KEY) === '1') return true
  } catch {
    /* ignore */
  }
  try {
    return new URLSearchParams(window.location.search).get('egitim') === '1'
  } catch {
    return false
  }
}

export function requestGuidedTourStart() {
  try {
    sessionStorage.setItem(GUIDED_TOUR_FORCE_KEY, '1')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(GUIDED_TOUR_START_EVENT))
}

export function consumeTourForceFlag() {
  try {
    sessionStorage.removeItem(GUIDED_TOUR_FORCE_KEY)
  } catch {
    /* ignore */
  }
}

export function isLikelyFirstRunMember(user) {
  if (!user) return false
  if (user.id === 'local-dev') return true
  if (user.role === 'demo_lead') return true
  if (user.status === 'trial' || user.subscriptionStatus === 'trialing') return true
  if (user.onboardingCompleted === false) return true
  return false
}

export function shouldAutoStartTour(user) {
  if (isTourForceRequested()) return true
  if (isTourCompleted(user)) return false
  return isLikelyFirstRunMember(user)
}

const BLOCKED_PREFIXES = ['/paketler', '/hesap/', '/profil/paket', '/web/studio']
const BLOCKED_PATHS = new Set([
  '/kurulum',
  '/giris',
  '/kayit',
  '/deneme-bitti',
  '/hesap/lisans',
])

export function isTourBlockedPath(pathname) {
  if (!pathname) return true
  if (BLOCKED_PATHS.has(pathname)) return true
  return BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
}

export const TOUR_STEPS = [
  {
    id: 'welcome',
    kind: 'welcome',
    title: 'Uygulamayı gerçek ekranlarda öğrenin',
    body: 'Her adım sizi canlı sayfaya götürür. Vurgulanan yere tıklayabilir, sonra Devam et ile bir sonraki gerçek ekrana geçersiniz.',
  },
  {
    id: 'profile-open',
    kind: 'spotlight',
    path: '/',
    target: '[data-tour="header-account"]',
    chapter: 'Profil',
    title: 'Yönetim paneli burada',
    body: 'Sağ üstteki hesabınız yönetim paneline açılır. Firma profili ve logo buradan tamamlanır.',
    action: 'Bu menüye bakın, sonra devam edin.',
  },
  {
    id: 'nav-settings',
    kind: 'spotlight',
    path: '/ayarlar',
    target: '[data-tour="nav-settings"]',
    openMenu: 'settings',
    expandSidebar: true,
    chapter: 'Profil',
    title: 'Sol menüden Yönetici Ayarları',
    body: 'Ayarlar > Yönetici Ayarları bu gerçek profil sayfasını açtı. Firma ünvanı, iletişim ve logo burada.',
    action: 'Menüdeki Yönetici Ayarları satırını görün.',
  },
  {
    id: 'company-fields',
    kind: 'spotlight',
    path: '/ayarlar',
    target: '[data-tour="company-fields"]',
    chapter: 'Profil',
    title: 'Firma bilgilerini doldurun',
    body: 'Bu gerçek Ayarlar sayfası. Ünvan, telefon, e-posta, vergi ve adres teklif çıktılarında kullanılır.',
    action: 'Alanları şimdi doldurabilirsiniz.',
    allowInteract: true,
  },
  {
    id: 'company-logo',
    kind: 'spotlight',
    path: '/ayarlar',
    target: '[data-tour="company-logo"]',
    chapter: 'Profil',
    title: 'Logoyu buradan yükleyin',
    body: 'Logo Yükle gerçek dosya seçicidir. Yüklediğiniz görsel menüde ve teklifte görünür.',
    action: 'İsterseniz şimdi logo seçin.',
    allowInteract: true,
  },
  {
    id: 'company-save',
    kind: 'spotlight',
    path: '/ayarlar',
    target: '[data-tour="company-save"]',
    chapter: 'Profil',
    title: 'Kaydet ile kilitleyin',
    body: 'Sağ alttaki Kaydet gerçek kayıttır. Sonra müşteri kartına geçeceğiz.',
    action: 'Kaydet’e basabilirsiniz.',
    allowInteract: true,
  },
  {
    id: 'nav-customers',
    kind: 'spotlight',
    path: '/musteriler',
    target: '[data-tour="nav-customers"]',
    openMenu: 'customer',
    expandSidebar: true,
    chapter: 'Müşteri',
    title: 'Müşteri menüsü sol tarafta',
    body: 'Bu gerçek Müşteriler listesidir. Satışlar > Müşteriler’den yeni kart açılır. Teklif için önce müşteri gerekir.',
    action: 'Sol menüdeki Müşteriler satırını görün.',
  },
  {
    id: 'customer-form',
    kind: 'spotlight',
    path: '/musteriler/yeni',
    target: '[data-tour="customer-form"]',
    chapter: 'Müşteri',
    title: 'Yeni müşteri formu bu sayfa',
    body: 'Tip, unvan ve iletişim alanları canlı formdur. Doldurup kaydedebilir, sonra ürüne geçebilirsiniz.',
    action: 'Müşteri bilgilerini girebilirsiniz.',
    allowInteract: true,
  },
  {
    id: 'nav-products',
    kind: 'spotlight',
    path: '/stok/urunler',
    target: '[data-tour="nav-products"]',
    openMenu: 'stock',
    expandSidebar: true,
    chapter: 'Ürün',
    title: 'Ürünler Stok menüsünde',
    body: 'Bu gerçek Hizmet ve Ürünler sayfasıdır. Teklif satırlarına düşecek kalemler burada tutulur.',
    action: 'Sol menüdeki Hizmet ve Ürünler satırını görün.',
  },
  {
    id: 'product-create',
    kind: 'spotlight',
    path: '/stok/urunler',
    target: '[data-tour="product-create"]',
    chapter: 'Ürün',
    title: 'Yeni ürün buradan açılır',
    body: 'Sağ üstteki Yeni Ürün Oluştur gerçek oluşturma butonudur. Tıklayıp ilk kaleminizi ekleyebilirsiniz.',
    action: 'Butona basabilirsiniz.',
    allowInteract: true,
  },
  {
    id: 'nav-quotes',
    kind: 'spotlight',
    path: '/teklifler',
    target: '[data-tour="nav-quotes"]',
    openMenu: 'process',
    expandSidebar: true,
    chapter: 'Teklif',
    title: 'Teklif Süreç Yönetimi’nde',
    body: 'Bu gerçek Teklifler listesidir. Müşteri ve ürünü burada bir araya getirirsiniz.',
    action: 'Sol menüdeki Teklifler satırını görün.',
  },
  {
    id: 'quote-create',
    kind: 'spotlight',
    path: '/teklifler',
    target: '[data-tour="quote-create"]',
    chapter: 'Teklif',
    title: 'Yeni teklif bu butonla başlar',
    body: 'Yeni Teklif Oluştur canlı teklif editörünü açar. Müşteri seçin, ürün ekleyin, gönderin.',
    action: 'Butona basabilirsiniz.',
    allowInteract: true,
  },
  {
    id: 'complete',
    kind: 'complete',
    title: 'Gerçek akışı gördünüz',
    body: 'Profil, müşteri, ürün, teklif. Turu Eğitim sayfasından istediğiniz zaman yeniden başlatabilirsiniz.',
  },
]
