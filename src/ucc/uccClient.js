import { getPlatformApiBase, getStoredSession } from '../utils/platformAuth'
import {
  addGroupMembers,
  conversationsForUser,
  createGroup,
  deleteMessage,
  editMessage,
  emptyUccState,
  ensureTeamGroup,
  importLegacyTeamMessages,
  markRead,
  messagesForConversation,
  normalizeUccState,
  openDm,
  pinMessage,
  postMessage,
  publicConversation,
  publicMessage,
  starMessage,
  UCC_TEAM_GROUP_ID,
} from './uccEngine'
import { loadTeamHubState } from '../utils/teamHubStore'

const LOCAL_KEY = 'bach-ucc-state-v1'
export const UCC_EVENT = 'bach:ucc-updated'
export const UCC_OPEN_EVENT = 'bach:ucc-open'

function actorFromSession() {
  const user = getStoredSession()?.user
  if (!user) return { id: 'local-user', name: 'Ben' }
  return {
    id: String(user.accountId || user.id || user.email || 'local-user'),
    name: user.fullName || user.email || 'Ben',
  }
}

function readLocal() {
  try {
    return normalizeUccState(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'))
  } catch {
    return emptyUccState()
  }
}

function writeLocal(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(normalizeUccState(state)))
  window.dispatchEvent(new CustomEvent(UCC_EVENT))
  try {
    const channel = new BroadcastChannel('bach-ucc')
    channel.postMessage({ type: 'sync' })
    channel.close()
  } catch {
    /* ignore */
  }
}

async function serverRequest(path, { method = 'GET', body } = {}) {
  const base = getPlatformApiBase()
  const { token } = getStoredSession()
  if (!token) {
    const err = new Error('NO_SESSION')
    err.code = 'NO_SESSION'
    throw err
  }
  const res = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    err.code = data.error
    err.status = res.status
    throw err
  }
  return data
}

function migrateLegacy(state, actor) {
  try {
    const hub = loadTeamHubState()
    if (!Array.isArray(hub.messages) || !hub.messages.length) return state
    return importLegacyTeamMessages(state, actor, hub.messages).state
  } catch {
    return state
  }
}

export async function syncUcc({ conversationId } = {}) {
  const actor = actorFromSession()
  try {
    return await serverRequest(
      `channels/ucc/sync${conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : ''}`,
    )
  } catch {
    const state = migrateLegacy(ensureTeamGroup(readLocal(), actor).state, actor)
    writeLocal(state)
    return {
      ok: true,
      local: true,
      me: actor,
      roster: [{ id: actor.id, name: actor.name, email: '' }],
      conversations: conversationsForUser(state, actor.id).map((item) =>
        publicConversation(item, actor.id, state),
      ),
      messages: conversationId
        ? messagesForConversation(state, actor.id, conversationId).map((item) =>
            publicMessage(item, actor.id),
          )
        : [],
      conversationId: conversationId || UCC_TEAM_GROUP_ID,
    }
  }
}

async function mutate(path, body) {
  const actor = actorFromSession()
  try {
    return await serverRequest(path, { method: 'POST', body })
  } catch (error) {
    if (error.status && error.status !== 401) throw error
    const state = ensureTeamGroup(readLocal(), actor).state
    let result
    if (path.endsWith('/send')) result = postMessage(state, actor, body)
    else if (path.endsWith('/edit')) result = editMessage(state, actor, body.messageId, body.body)
    else if (path.endsWith('/delete')) result = deleteMessage(state, actor, body.messageId)
    else if (path.endsWith('/star')) result = starMessage(state, actor, body.messageId)
    else if (path.endsWith('/pin'))
      result = pinMessage(state, actor, body.conversationId, body.messageId)
    else if (path.endsWith('/read')) result = markRead(state, actor, body.conversationId)
    else if (path.endsWith('/dm'))
      result = openDm(state, actor, { id: body.peerId, name: body.peerName })
    else if (path.endsWith('/group')) result = createGroup(state, actor, body)
    else if (path.endsWith('/members'))
      result = addGroupMembers(state, actor, body.conversationId, body.memberIds)
    else throw error
    writeLocal(result.state)
    return {
      ok: true,
      local: true,
      message: result.message ? publicMessage(result.message, actor.id) : undefined,
      conversation: result.conversation
        ? publicConversation(result.conversation, actor.id, result.state)
        : undefined,
    }
  }
}

export const sendUccMessage = (body) => mutate('channels/ucc/send', body)
export const editUccMessage = (body) => mutate('channels/ucc/edit', body)
export const deleteUccMessage = (body) => mutate('channels/ucc/delete', body)
export const starUccMessage = (body) => mutate('channels/ucc/star', body)
export const pinUccMessage = (body) => mutate('channels/ucc/pin', body)
export const readUccConversation = (body) => mutate('channels/ucc/read', body)
export const openUccDm = (body) => mutate('channels/ucc/dm', body)
export const createUccGroup = (body) => mutate('channels/ucc/group', body)

export function openCommunicationCenter(detail = {}) {
  window.dispatchEvent(new CustomEvent(UCC_OPEN_EVENT, { detail }))
}
