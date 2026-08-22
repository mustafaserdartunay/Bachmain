import { getStoredSession } from './platformAuth'
import { readUserProfile } from './userProfile'

/** Giriş yapan hesabın adı — önce auth oturumu, sonra profil yedek. */
export function getActiveUserLabel() {
  const sessionUser = getStoredSession()?.user
  const fromAuth = String(sessionUser?.fullName || '').trim()
  if (fromAuth) return fromAuth

  const profile = readUserProfile()
  return String(profile?.displayName || profile?.email || '').trim()
}

export function getQuotePreparedByLabel(quote = {}) {
  return quote.preparedByName || quote.preparedBy || '—'
}

export function getQuoteDeletedByLabel(entryMeta = {}) {
  return entryMeta.deletedBy || '—'
}

export function withQuotePreparedBy(quote = {}) {
  const label = getActiveUserLabel()
  if (!label) return quote
  if (quote.preparedByName) return quote
  return {
    ...quote,
    preparedByName: label,
    preparedBy: label,
  }
}
