/** Gündüz / gece görünüm modu — ana CRM arayüzü */

export const APPEARANCE_STORAGE_KEY = 'bach-appearance'
export const APPEARANCE_EVENT = 'bach:appearance-updated'

export const APPEARANCE_MODES = {
  day: { id: 'day', label: 'Gündüz' },
  night: { id: 'night', label: 'Gece' },
}

export const DEFAULT_APPEARANCE = 'day'

const LEGACY_THEME_CLASSES = ['light', 'morning', 'evening', 'space', 'special', 'night']

export function getStoredAppearance() {
  try {
    const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY)
    if (saved === 'night' || saved === 'day') return saved
  } catch {
    // localStorage kapalı
  }
  return DEFAULT_APPEARANCE
}

export function applyAppearance(modeId) {
  const mode = APPEARANCE_MODES[modeId] ? modeId : DEFAULT_APPEARANCE
  const root = document.documentElement

  LEGACY_THEME_CLASSES.forEach((className) => root.classList.remove(className))

  if (mode === 'night') {
    root.classList.add('night')
  }

  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, mode)
  } catch {
    // gizli sekme
  }

  window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: mode }))
  return mode
}

export function initAppearanceOnBoot() {
  return applyAppearance(getStoredAppearance())
}

export function toggleAppearance(currentMode) {
  const next = currentMode === 'night' ? 'day' : 'night'
  return applyAppearance(next)
}

/** index.html flash önleme — React yüklenmeden önce */
export function applyAppearanceClassesOnly(modeId) {
  const mode = APPEARANCE_MODES[modeId] ? modeId : DEFAULT_APPEARANCE
  const root = document.documentElement

  LEGACY_THEME_CLASSES.forEach((className) => root.classList.remove(className))

  if (mode === 'night') {
    root.classList.add('night')
  }
}
