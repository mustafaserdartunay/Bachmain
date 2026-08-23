/**
 * Tenant-isolated Bachmain chat. Stored in tenant_data.ucc (or JSON store fallback).
 */
import { getBearerOrCookieToken, getAccountFromToken } from './auth.mjs'
import { loadStore, withStore } from './store.mjs'
import { getTenantCollection, setTenantCollection, hasDatabase } from './db.mjs'
import { sendJson, applyCors } from './authRoutes.mjs'
import {
  addGroupMembers,
  assertRateLimit,
  conversationsForUser,
  createGroup,
  deleteMessage,
  editMessage,
  ensureTeamGroup,
  markRead,
  messagesForConversation,
  normalizeUccState,
  openDm,
  pinMessage,
  postMessage,
  publicConversation,
  publicMessage,
  starMessage,
} from '../../../src/ucc/uccEngine.js'

const COLLECTION = 'ucc'

function actorFromSession(session) {
  return {
    id: String(session.account.id),
    name: session.user?.fullName || session.account.fullName || session.account.email,
  }
}

function chatRoster(store, tenantCode) {
  const primary = (store.accounts || []).filter((row) => row.tenantCode === tenantCode)
  const granted = (store.companyAccess || [])
    .filter((row) => row.tenantCode === tenantCode && row.accessLevel !== 'none')
    .map((row) => (store.accounts || []).find((account) => account.id === row.accountId))
    .filter(Boolean)
  return [...primary, ...granted]
    .filter((row, index, rows) => rows.findIndex((item) => item.id === row.id) === index)
    .map((row) => ({
      id: row.id,
      name: row.fullName || row.email,
      email: row.email,
    }))
}

async function requireSession(req, res) {
  const token = getBearerOrCookieToken(req)
  const store = await loadStore()
  const session = getAccountFromToken(store, token)
  if (!session?.user?.tenantCode) {
    sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Üye oturumu gerekli' })
    return null
  }
  return {
    store,
    session,
    tenantCode: session.user.tenantCode,
    actor: actorFromSession(session),
  }
}

async function readState(tenantCode, store) {
  if (hasDatabase()) {
    return normalizeUccState(await getTenantCollection(tenantCode, COLLECTION))
  }
  return normalizeUccState(store.uccByTenant?.[tenantCode])
}

async function writeState(tenantCode, state) {
  const payload = normalizeUccState(state)
  if (hasDatabase()) {
    await setTenantCollection(tenantCode, COLLECTION, payload)
    return payload
  }
  await withStore((store) => {
    store.uccByTenant = store.uccByTenant || {}
    store.uccByTenant[tenantCode] = payload
  })
  return payload
}

function queryOf(req) {
  try {
    return new URL(req.url, 'http://localhost').searchParams
  } catch {
    return new URLSearchParams()
  }
}

function fail(req, res, error, fallback = 400) {
  const code = error?.code || 'UCC_ERROR'
  const status =
    code === 'CONVERSATION_FORBIDDEN' ||
    code === 'MESSAGE_EDIT_FORBIDDEN' ||
    code === 'MESSAGE_DELETE_FORBIDDEN' ||
    code === 'MESSAGE_FORBIDDEN' ||
    code === 'NOT_GROUP_ADMIN'
      ? 403
      : code === 'RATE_LIMIT'
        ? 429
        : fallback
  sendJson(req, res, status, { error: code, message: error.message || code })
}

export async function handleUccApi(req, res, path, body = {}) {
  if (!path.startsWith('channels/ucc')) return false
  applyCors(req, res)
  const ctx = await requireSession(req, res)
  if (!ctx) return true
  const { store, tenantCode, actor } = ctx

  try {
    if (req.method === 'GET' && path === 'channels/ucc/sync') {
      const q = queryOf(req)
      let state = await readState(tenantCode, store)
      state = ensureTeamGroup(state, actor).state
      await writeState(tenantCode, state)
      const conversationId = q.get('conversationId') || ''
      sendJson(req, res, 200, {
        ok: true,
        me: actor,
        roster: chatRoster(store, tenantCode),
        conversations: conversationsForUser(state, actor.id).map((item) =>
          publicConversation(item, actor.id, state),
        ),
        messages: conversationId
          ? messagesForConversation(state, actor.id, conversationId, {
              limit: Number(q.get('limit')) || 80,
              before: q.get('before') || undefined,
            }).map((item) => publicMessage(item, actor.id))
          : [],
        conversationId: conversationId || null,
      })
      return true
    }

    if (req.method !== 'POST') {
      sendJson(req, res, 405, { error: 'METHOD_NOT_ALLOWED' })
      return true
    }

    assertRateLimit(`${tenantCode}:${actor.id}:${path}`)
    const state = await readState(tenantCode, store)

    const table = {
      'channels/ucc/dm': () => {
        const peer = chatRoster(store, tenantCode).find((row) => row.id === body.peerId)
        if (!peer) {
          sendJson(req, res, 404, { error: 'PEER_NOT_FOUND' })
          return true
        }
        return openDm(state, actor, peer)
      },
      'channels/ucc/group': () =>
        createGroup(state, actor, {
          title: body.title,
          memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
        }),
      'channels/ucc/members': () =>
        addGroupMembers(state, actor, body.conversationId, body.memberIds || []),
      'channels/ucc/send': () => postMessage(state, actor, body),
      'channels/ucc/edit': () => editMessage(state, actor, body.messageId, body.body),
      'channels/ucc/delete': () => deleteMessage(state, actor, body.messageId),
      'channels/ucc/star': () => starMessage(state, actor, body.messageId),
      'channels/ucc/pin': () => pinMessage(state, actor, body.conversationId, body.messageId),
      'channels/ucc/read': () => markRead(state, actor, body.conversationId),
    }

    const run = table[path]
    if (!run) {
      sendJson(req, res, 404, { error: 'NOT_FOUND' })
      return true
    }
    const result = run()
    if (result === true) return true
    await writeState(tenantCode, result.state)
    sendJson(req, res, 200, {
      ok: true,
      message: result.message ? publicMessage(result.message, actor.id) : undefined,
      conversation: result.conversation
        ? publicConversation(result.conversation, actor.id, result.state)
        : undefined,
    })
    return true
  } catch (error) {
    fail(req, res, error)
    return true
  }
}
