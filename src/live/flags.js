import { readCompanySettings, updateCompanySettings } from '../utils/companySettings'
import { DEFAULT_FLAGS, FEATURE_FLAGS, RETENTION_DAYS } from './constants.js'

export function readLiveFlags() {
  const settings = readCompanySettings()
  const stored =
    settings.liveFlags && typeof settings.liveFlags === 'object' ? settings.liveFlags : {}
  return { ...DEFAULT_FLAGS, ...stored }
}

export function isLiveFlagOn(code) {
  const flags = readLiveFlags()
  if (
    !Object.prototype.hasOwnProperty.call(FEATURE_FLAGS, code) &&
    !Object.prototype.hasOwnProperty.call(flags, code)
  ) {
    return true
  }
  return flags[code] !== false
}

export function saveLiveFlags(partial) {
  const next = { ...readLiveFlags(), ...partial }
  updateCompanySettings({ liveFlags: next })
  return next
}

export function readLiveRetentionDays() {
  const settings = readCompanySettings()
  const days = Number(settings.liveRetentionDays)
  return RETENTION_DAYS.includes(days) ? days : 90
}

export function saveLiveRetentionDays(days) {
  const next = RETENTION_DAYS.includes(Number(days)) ? Number(days) : 90
  updateCompanySettings({ liveRetentionDays: next })
  return next
}

export function readMapboxPublicToken() {
  const fromEnv = String(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '').trim()
  if (fromEnv) return fromEnv
  const settings = readCompanySettings()
  return String(settings.mapboxPublicToken || '').trim()
}

export function saveMapboxPublicToken(token) {
  updateCompanySettings({ mapboxPublicToken: String(token || '').trim() })
}

export function maskSecret(value) {
  const text = String(value || '')
  if (!text) return ''
  if (text.length <= 8) return '••••'
  return `${text.slice(0, 4)}••••${text.slice(-4)}`
}
