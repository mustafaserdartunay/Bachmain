import { BACHY_SETTINGS_KEY, BACHY_UPDATED_EVENT, DEFAULT_SETTINGS } from './constants'

function readRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BACHY_SETTINGS_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getBachySettings() {
  return { ...DEFAULT_SETTINGS, ...readRaw() }
}

export function saveBachySettings(patch) {
  const next = { ...getBachySettings(), ...patch, updatedAt: new Date().toISOString() }
  localStorage.setItem(BACHY_SETTINGS_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(BACHY_UPDATED_EVENT, { detail: next }))
  return next
}

export function subscribeBachySettings(handler) {
  const fn = () => handler(getBachySettings())
  window.addEventListener(BACHY_UPDATED_EVENT, fn)
  window.addEventListener('storage', fn)
  return () => {
    window.removeEventListener(BACHY_UPDATED_EVENT, fn)
    window.removeEventListener('storage', fn)
  }
}
