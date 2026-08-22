import { readUserProfile } from './userProfile'

export function getActiveUserLabel() {
  const profile = readUserProfile()
  return profile?.displayName || profile?.email || ''
}

export function getQuotePreparedByLabel(quote = {}) {
  return quote.preparedByName || quote.preparedBy || quote.owner || '—'
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
