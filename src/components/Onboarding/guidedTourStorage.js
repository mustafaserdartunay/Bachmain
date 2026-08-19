export const GUIDED_TOUR_VERSION = 1
export const GUIDED_TOUR_STORAGE_KEY = 'bach-guided-tour-v1'
export const GUIDED_TOUR_START_EVENT = 'bach:start-guided-tour'
export const GUIDED_TOUR_FORCE_KEY = 'bach-guided-tour-force'

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
    title: 'İlk gününüze hoş geldiniz',
    body: 'Birkaç dakikada profilinizi tamamlayıp müşteri, ürün ve teklif akışını canlı ekranlarda göreceksiniz.',
    dwellMs: 0,
  },
  {
    id: 'profile-open',
    kind: 'spotlight',
    path: '/',
    target: '[data-tour="header-account"]',
    chapter: 'Profil',
    title: 'Yönetim paneli burada',
    body: 'Sağ üstteki hesabınız yönetim paneline açılır. Firma profilini ve logoyu oradan tamamlayacağız.',
    hint: 'Profil menüsü',
    dwellMs: 3200,
  },
  {
    id: 'company-fields',
    kind: 'spotlight',
    path: '/ayarlar',
    target: '[data-tour="company-fields"]',
    chapter: 'Profil',
    title: 'Firma bilgilerini kontrol edin',
    body: 'Ünvan, telefon, e-posta, vergi ve adres alanlarını doldurun. Teklif ve evraklarda bu bilgiler kullanılır.',
    hint: 'Firma kartı',
    allowInteract: true,
    dwellMs: 7000,
  },
  {
    id: 'company-logo',
    kind: 'spotlight',
    path: '/ayarlar',
    target: '[data-tour="company-logo"]',
    chapter: 'Profil',
    title: 'Logonuzu yükleyin',
    body: 'Logo, teklif çıktılarında ve uygulama menüsünde görünür. Şimdi dosya seçerek yükleyebilirsiniz.',
    hint: 'Logo yükle',
    allowInteract: true,
    dwellMs: 6500,
  },
  {
    id: 'company-save',
    kind: 'spotlight',
    path: '/ayarlar',
    target: '[data-tour="company-save"]',
    chapter: 'Profil',
    title: 'Profili kaydedin',
    body: 'Bilgiler hazırsa Kaydet’e basın. Sonra ilk müşterinizi gireceğiz.',
    hint: 'Kaydet',
    allowInteract: true,
    dwellMs: 4500,
  },
  {
    id: 'customer-form',
    kind: 'spotlight',
    path: '/musteriler/yeni',
    target: '[data-tour="customer-form"]',
    chapter: 'Müşteri',
    title: 'İlk müşterinizi girin',
    body: 'Tip, unvan ve iletişim bilgilerini doldurun. Teklif ancak bir müşteri kaydıyla başlar.',
    hint: 'Yeni müşteri',
    allowInteract: true,
    dwellMs: 7000,
  },
  {
    id: 'product-create',
    kind: 'spotlight',
    path: '/stok/urunler',
    target: '[data-tour="product-create"]',
    chapter: 'Ürün',
    title: 'Hizmet veya ürün ekleyin',
    body: 'Teklif satırlarına düşecek kalemler burada oluşur. Yeni Ürün Oluştur ile ilk kaydınızı açın.',
    hint: 'Yeni ürün',
    allowInteract: true,
    dwellMs: 5500,
  },
  {
    id: 'quote-create',
    kind: 'spotlight',
    path: '/teklifler',
    target: '[data-tour="quote-create"]',
    chapter: 'Teklif',
    title: 'Teklif sürecine geçin',
    body: 'Müşteri ve ürün hazır. Yeni Teklif Oluştur ile fiyatlandırma ve gönderim adımına başlayın.',
    hint: 'Yeni teklif',
    allowInteract: true,
    dwellMs: 5500,
  },
  {
    id: 'complete',
    kind: 'complete',
    title: 'Temel akış bu kadar',
    body: 'Profil, müşteri, ürün ve teklif. İstediğiniz zaman Eğitim menüsünden turu yeniden başlatabilirsiniz.',
    dwellMs: 0,
  },
]
