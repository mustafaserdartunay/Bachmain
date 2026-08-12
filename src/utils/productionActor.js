import { getStoredSession } from './platformAuth'
import { getLoggedInUserDisplayName } from './userProfile'

/** Aktif oturum kullanıcı adı — süreç adımı damgası için. */
export function getProductionActorName() {
  const profileName = getLoggedInUserDisplayName()
  if (profileName && profileName !== 'Kullanıcı') return profileName

  const { user } = getStoredSession()
  if (user && typeof user === 'object') {
    const combined = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    const name =
      user.displayName ||
      user.fullName ||
      user.name ||
      combined ||
      (user.email ? String(user.email).split('@')[0] : '')
    if (name) return name
  }

  return profileName || 'Sistem'
}
