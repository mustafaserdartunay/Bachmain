import {
  acceptInviteWithToken,
  fetchCompanyUsers,
  fetchInvitePreview,
  inviteCompanyUser,
  removeCompanyTeamUser,
  resendCompanyInvite,
  updateCompanyTeamUser,
} from './platformAuth'
import {
  acceptLocalInvite,
  inviteLocalTeamUser,
  listLocalTeamUsers,
  previewLocalInvite,
  removeLocalTeamUser,
  resendLocalTeamInvite,
  updateLocalTeamUser,
} from './localTeamAuth'

function isLocalHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

async function withLocalFallback(remote, local) {
  try {
    return await remote()
  } catch (error) {
    if (!isLocalHost()) throw error
    return local()
  }
}

export async function listTeamUsers() {
  return withLocalFallback(
    async () => fetchCompanyUsers(),
    () => listLocalTeamUsers(),
  )
}

export async function inviteTeamUser(payload) {
  return withLocalFallback(
    () => inviteCompanyUser(payload),
    () => inviteLocalTeamUser(payload),
  )
}

export async function updateTeamUser(payload) {
  return withLocalFallback(
    async () => {
      const data = await updateCompanyTeamUser(payload)
      return Array.isArray(data.users) ? data.users : []
    },
    () => updateLocalTeamUser(payload),
  )
}

export async function resendTeamInvite(accountId) {
  return withLocalFallback(
    () => resendCompanyInvite(accountId),
    () => resendLocalTeamInvite(accountId),
  )
}

export async function removeTeamUser(accountId) {
  return withLocalFallback(
    async () => {
      const data = await removeCompanyTeamUser(accountId)
      return Array.isArray(data.users) ? data.users : []
    },
    () => removeLocalTeamUser(accountId),
  )
}

export async function loadInvitePreview(token) {
  return withLocalFallback(
    async () => {
      const data = await fetchInvitePreview(token)
      return data.invite || data
    },
    () => previewLocalInvite(token),
  )
}

export async function acceptTeamInvite(payload) {
  return withLocalFallback(
    () => acceptInviteWithToken(payload),
    () => acceptLocalInvite(payload),
  )
}
