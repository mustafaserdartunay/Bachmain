/**
 * Görünüm modu (tema) yönetimi.
 *
 * Seçilen mod `localStorage` içinde `erlenbox-theme` anahtarıyla saklanır.
 * Kullanıcı en son hangi modda bıraktıysa (Gece / Uzay / Akşam / Sabah / Gündüz),
 * tarayıcı veya bilgisayar yeniden açılsa bile aynı mod otomatik yüklenir.
 *
 * Mod döngüsü: Gece → Uzay → Akşam → Sabah → Gündüz → Özel → Gece
 *
 * @see initThemeOnBoot — uygulama açılışında tema geri yükleme (main.jsx)
 * @see index.html — ilk boyamadan önce flash önleme script'i
 */

/** localStorage anahtarı — tüm uygulama ve B2B portal bu anahtarı paylaşır */
export const THEME_STORAGE_KEY = 'erlenbox-theme'

export const DEFAULT_THEME = 'dark'

/** Gece modu varsayılan :root CSS değişkenlerini kullanır; ek sınıf gerekmez */
export const THEME_CLASS_MAP = {
  space: 'space',
  evening: 'evening',
  morning: 'morning',
  light: 'light',
  special: 'special',
}

export const THEME_MODES = {
  dark: { id: 'dark', label: 'Gece', next: 'space' },
  space: { id: 'space', label: 'Uzay', next: 'evening' },
  evening: { id: 'evening', label: 'Akşam', next: 'morning' },
  morning: { id: 'morning', label: 'Sabah', next: 'light' },
  light: { id: 'light', label: 'Gündüz', next: 'special' },
  special: { id: 'special', label: 'Özel', next: 'dark' },
}

/** Standart cam pill arama alanı */
export const SEARCH_INPUT_MD_CLASS =
  'search-pill h-10 w-full py-0 pl-10 pr-4 text-sm'

/** Kompakt cam pill arama alanı */
export const SEARCH_INPUT_SM_CLASS =
  'search-pill h-9 w-full py-0 pl-9 pr-3 text-xs'

export const SEARCH_INPUT_ICON_MD_CLASS =
  'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]'

export const SEARCH_INPUT_ICON_SM_CLASS =
  'pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]'

/** Üst panel arama alanı — şeffaf varsayılan, sidebar hover */
export const HEADER_SEARCH_INPUT_CLASS =
  'header-search-input search-pill h-10 w-full py-0 pl-10 pr-4 text-sm transition-all focus:outline-none'

/** Ekip paneli form alanları — üst arama ile aynı cam pill */
export const TEAM_HUB_FIELD_CLASS =
  'search-pill h-9 w-full py-0 px-3 text-[12px] transition-all focus:outline-none'

export const TEAM_HUB_TEXTAREA_CLASS =
  'search-pill min-h-[72px] w-full resize-none rounded-[18px] px-3 py-2 text-[12px] transition-all focus:outline-none'

/** Üst panel kontrol butonları — şeffaf varsayılan, sidebar hover */
export const HEADER_CONTROL_BUTTON_CLASS =
  'header-control-btn icon-btn shrink-0 text-xs font-semibold'

/** Tüm tema modlarında aynı boyut — Gece / Uzay / Akşam / Sabah / Gündüz / Özel */
export const THEME_TOGGLE_BUTTON_CLASS = `${HEADER_CONTROL_BUTTON_CLASS} !w-auto gap-1.5 px-3`

const THEME_CLASS_NAMES = Object.values(THEME_CLASS_MAP)

/**
 * Kayıtlı temayı okur; geçersiz veya eksik değerde varsayılan (Gece) döner.
 */
export function getStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_MODES[saved] ? saved : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/**
 * Temayı DOM'a uygular ve localStorage'a yazar.
 * PC yeniden açıldığında getStoredTheme + initThemeOnBoot aynı modu geri yükler.
 */
export function applyTheme(themeId) {
  const theme = THEME_MODES[themeId] ? themeId : DEFAULT_THEME
  const root = document.documentElement

  THEME_CLASS_NAMES.forEach((className) => root.classList.remove(className))

  const themeClass = THEME_CLASS_MAP[theme]
  if (themeClass) {
    root.classList.add(themeClass)
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // gizli sekme / depolama kapalı
  }

  return theme
}

/** Uygulama başlangıcında son kullanılan modu geri yükler */
export function initThemeOnBoot() {
  return applyTheme(getStoredTheme())
}

/** Sıradaki moda geçer; yeni mod kimliğini döner */
export function cycleTheme(currentThemeId) {
  const current = THEME_MODES[currentThemeId] || THEME_MODES[DEFAULT_THEME]
  return applyTheme(current.next)
}

/** index.html inline script ile aynı mantık — modül yüklenmeden önce flash önleme */
export function applyThemeClassesOnly(themeId) {
  const theme = THEME_MODES[themeId] ? themeId : DEFAULT_THEME
  const root = document.documentElement

  THEME_CLASS_NAMES.forEach((className) => root.classList.remove(className))

  const themeClass = THEME_CLASS_MAP[theme]
  if (themeClass) {
    root.classList.add(themeClass)
  }
}
