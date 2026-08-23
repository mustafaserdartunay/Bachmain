/** Pure UCC chat engine — tenant state in, tenant state out. No I/O. */

export const UCC_TEAM_GROUP_ID = 'group:team'
export const MAX_MESSAGE_CHARS = 8000
export const MAX_FILE_BYTES = 4 * 1024 * 1024
export const RATE_WINDOW_MS = 60_000
export const RATE_MAX = 40

export function emptyUccState() {
  return { version: 1, conversations: [], messages: [] }
}

export function normalizeUccState(raw) {
  const state = raw && typeof raw === 'object' ? raw : {}
  return {
    version: 1,
    conversations: Array.isArray(state.conversations) ? state.conversations : [],
    messages: Array.isArray(state.messages) ? state.messages : [],
  }
}

export function dmConversationId(a, b) {
  const ids = [String(a || ''), String(b || '')].sort()
  return `dm:${ids[0]}:${ids[1]}`
}

export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function canSee(conversation, userId) {
  return Boolean(conversation?.memberIds?.includes(userId))
}

export function conversationsForUser(state, userId) {
  return normalizeUccState(state)
    .conversations.filter((item) => canSee(item, userId) && !item.deletedAt)
    .sort((a, b) => String(b.lastMessageAt || '').localeCompare(String(a.lastMessageAt || '')))
}

export function messagesForConversation(
  state,
  userId,
  conversationId,
  { limit = 80, before } = {},
) {
  const conv = normalizeUccState(state).conversations.find((item) => item.id === conversationId)
  if (!canSee(conv, userId)) return []
  let rows = normalizeUccState(state).messages.filter(
    (item) => item.conversationId === conversationId && !item.hidden,
  )
  rows.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
  if (before) rows = rows.filter((item) => item.createdAt < before)
  return rows.slice(-Math.max(1, Math.min(200, Number(limit) || 80)))
}

export function ensureTeamGroup(state, actor) {
  const next = normalizeUccState(state)
  let group = next.conversations.find((item) => item.id === UCC_TEAM_GROUP_ID)
  if (!group) {
    group = {
      id: UCC_TEAM_GROUP_ID,
      type: 'group',
      title: 'Ekip sohbeti',
      memberIds: [actor.id],
      adminIds: [actor.id],
      createdAt: new Date().toISOString(),
      createdBy: actor.id,
      lastMessageAt: '',
      lastMessagePreview: '',
      lastReadAt: {},
    }
    next.conversations.push(group)
  } else if (!group.memberIds.includes(actor.id)) {
    group.memberIds = [...group.memberIds, actor.id]
  }
  return { state: next, conversation: group }
}

export function openDm(state, actor, peer) {
  if (!peer?.id || peer.id === actor.id) {
    const err = new Error('INVALID_PEER')
    err.code = 'INVALID_PEER'
    throw err
  }
  const next = normalizeUccState(state)
  const id = dmConversationId(actor.id, peer.id)
  let conv = next.conversations.find((item) => item.id === id)
  if (!conv) {
    conv = {
      id,
      type: 'dm',
      title: peer.name || peer.fullName || peer.email || 'Sohbet',
      peerId: peer.id,
      memberIds: [actor.id, peer.id],
      adminIds: [actor.id, peer.id],
      createdAt: new Date().toISOString(),
      createdBy: actor.id,
      lastMessageAt: '',
      lastMessagePreview: '',
      lastReadAt: {},
    }
    next.conversations.push(conv)
  }
  return { state: next, conversation: conv }
}

export function createGroup(state, actor, { title, memberIds = [] } = {}) {
  const name = String(title || '').trim()
  if (!name) {
    const err = new Error('GROUP_TITLE_REQUIRED')
    err.code = 'GROUP_TITLE_REQUIRED'
    throw err
  }
  const next = normalizeUccState(state)
  const members = [...new Set([actor.id, ...memberIds.map(String)])]
  const conv = {
    id: newId('group'),
    type: 'group',
    title: name.slice(0, 80),
    memberIds: members,
    adminIds: [actor.id],
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
    lastMessageAt: '',
    lastMessagePreview: '',
    lastReadAt: {},
  }
  next.conversations.push(conv)
  return { state: next, conversation: conv }
}

function previewOf(message) {
  if (message.deletedAt) return 'Mesaj silindi'
  if (message.file?.name) return message.file.name
  return String(message.body || '').slice(0, 120)
}

export function postMessage(state, actor, payload) {
  const conversationId = String(payload.conversationId || '')
  const next = normalizeUccState(state)
  const conv = next.conversations.find((item) => item.id === conversationId)
  if (!canSee(conv, actor.id)) {
    const err = new Error('CONVERSATION_FORBIDDEN')
    err.code = 'CONVERSATION_FORBIDDEN'
    throw err
  }
  const body = String(payload.body || '').trim()
  const file = payload.file && payload.file.dataUrl ? payload.file : null
  if (!body && !file) {
    const err = new Error('EMPTY_MESSAGE')
    err.code = 'EMPTY_MESSAGE'
    throw err
  }
  if (body.length > MAX_MESSAGE_CHARS) {
    const err = new Error('MESSAGE_TOO_LONG')
    err.code = 'MESSAGE_TOO_LONG'
    throw err
  }
  if (file) {
    const bytes = Math.ceil((String(file.dataUrl).length * 3) / 4)
    if (bytes > MAX_FILE_BYTES) {
      const err = new Error('FILE_TOO_LARGE')
      err.code = 'FILE_TOO_LARGE'
      throw err
    }
  }
  const now = new Date().toISOString()
  const message = {
    id: payload.id || newId('msg'),
    conversationId,
    authorId: actor.id,
    authorName: actor.name || actor.fullName || 'Kullanıcı',
    body: body.slice(0, MAX_MESSAGE_CHARS),
    file: file
      ? {
          name: String(file.name || 'dosya').slice(0, 120),
          mime: String(file.mime || 'application/octet-stream').slice(0, 120),
          size: Number(file.size) || 0,
          dataUrl: String(file.dataUrl),
        }
      : null,
    replyToId: payload.replyToId || null,
    starredBy: [],
    status: 'sent',
    readBy: [{ userId: actor.id, at: now }],
    createdAt: now,
    editedAt: null,
    deletedAt: null,
  }
  next.messages.push(message)
  conv.lastMessageAt = now
  conv.lastMessagePreview = previewOf(message)
  return { state: next, message, conversation: conv }
}

export function editMessage(state, actor, messageId, body) {
  const next = normalizeUccState(state)
  const message = next.messages.find((item) => item.id === messageId)
  if (!message || message.authorId !== actor.id || message.deletedAt) {
    const err = new Error('MESSAGE_EDIT_FORBIDDEN')
    err.code = 'MESSAGE_EDIT_FORBIDDEN'
    throw err
  }
  const text = String(body || '').trim()
  if (!text) {
    const err = new Error('EMPTY_MESSAGE')
    err.code = 'EMPTY_MESSAGE'
    throw err
  }
  message.body = text.slice(0, MAX_MESSAGE_CHARS)
  message.editedAt = new Date().toISOString()
  const conv = next.conversations.find((item) => item.id === message.conversationId)
  if (conv) conv.lastMessagePreview = previewOf(message)
  return { state: next, message }
}

export function deleteMessage(state, actor, messageId) {
  const next = normalizeUccState(state)
  const message = next.messages.find((item) => item.id === messageId)
  const conv = next.conversations.find((item) => item.id === message?.conversationId)
  const isAdmin = conv?.adminIds?.includes(actor.id)
  if (!message || (message.authorId !== actor.id && !isAdmin)) {
    const err = new Error('MESSAGE_DELETE_FORBIDDEN')
    err.code = 'MESSAGE_DELETE_FORBIDDEN'
    throw err
  }
  message.deletedAt = new Date().toISOString()
  message.body = ''
  message.file = null
  if (conv) conv.lastMessagePreview = previewOf(message)
  return { state: next, message }
}

export function starMessage(state, actor, messageId) {
  const next = normalizeUccState(state)
  const message = next.messages.find((item) => item.id === messageId)
  const conv = next.conversations.find((item) => item.id === message?.conversationId)
  if (!message || !canSee(conv, actor.id)) {
    const err = new Error('MESSAGE_FORBIDDEN')
    err.code = 'MESSAGE_FORBIDDEN'
    throw err
  }
  const starred = new Set(message.starredBy || [])
  if (starred.has(actor.id)) starred.delete(actor.id)
  else starred.add(actor.id)
  message.starredBy = [...starred]
  return { state: next, message }
}

export function pinMessage(state, actor, conversationId, messageId) {
  const next = normalizeUccState(state)
  const conv = next.conversations.find((item) => item.id === conversationId)
  if (!canSee(conv, actor.id)) {
    const err = new Error('CONVERSATION_FORBIDDEN')
    err.code = 'CONVERSATION_FORBIDDEN'
    throw err
  }
  conv.pinnedMessageId = messageId || null
  return { state: next, conversation: conv }
}

export function markRead(state, actor, conversationId) {
  const next = normalizeUccState(state)
  const conv = next.conversations.find((item) => item.id === conversationId)
  if (!canSee(conv, actor.id)) {
    const err = new Error('CONVERSATION_FORBIDDEN')
    err.code = 'CONVERSATION_FORBIDDEN'
    throw err
  }
  const now = new Date().toISOString()
  next.messages.forEach((message) => {
    if (message.conversationId !== conversationId) return
    if (message.authorId === actor.id) return
    const readBy = Array.isArray(message.readBy) ? message.readBy : []
    if (!readBy.some((row) => row.userId === actor.id)) {
      message.readBy = [...readBy, { userId: actor.id, at: now }]
    }
    if (message.status === 'sent') message.status = 'delivered'
    const others = (conv.memberIds || []).filter((id) => id !== message.authorId)
    if (others.length && others.every((id) => message.readBy.some((row) => row.userId === id))) {
      message.status = 'read'
    }
  })
  conv.lastReadAt = { ...(conv.lastReadAt || {}), [actor.id]: now }
  return { state: next, conversation: conv }
}

export function unreadCount(state, userId, conversationId) {
  const conv = normalizeUccState(state).conversations.find((item) => item.id === conversationId)
  if (!canSee(conv, userId)) return 0
  const lastRead = conv.lastReadAt?.[userId] || ''
  return normalizeUccState(state).messages.filter(
    (item) =>
      item.conversationId === conversationId &&
      item.authorId !== userId &&
      !item.deletedAt &&
      item.createdAt > lastRead,
  ).length
}

export function importLegacyTeamMessages(state, actor, legacyMessages = []) {
  const seeded = ensureTeamGroup(state, actor)
  if (seeded.conversation.lastMessageAt || !legacyMessages.length) return seeded
  let next = seeded.state
  ;[...legacyMessages]
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .forEach((row) => {
      const posted = postMessage(
        next,
        { id: row.authorId || actor.id, name: row.authorName },
        { conversationId: UCC_TEAM_GROUP_ID, body: row.text || row.body, id: row.id },
      )
      next = posted.state
      if (row.createdAt) posted.message.createdAt = row.createdAt
    })
  return {
    state: next,
    conversation: next.conversations.find((item) => item.id === UCC_TEAM_GROUP_ID),
  }
}

const rateBuckets = new Map()

export function assertRateLimit(key) {
  const now = Date.now()
  const hits = (rateBuckets.get(key) || []).filter((ts) => now - ts < RATE_WINDOW_MS)
  if (hits.length >= RATE_MAX) {
    const err = new Error('RATE_LIMIT')
    err.code = 'RATE_LIMIT'
    throw err
  }
  hits.push(now)
  rateBuckets.set(key, hits)
}

export function publicConversation(conv, userId, state) {
  if (!conv) return null
  return {
    id: conv.id,
    type: conv.type,
    title: conv.title,
    memberIds: conv.memberIds,
    adminIds: conv.adminIds,
    pinnedMessageId: conv.pinnedMessageId || null,
    lastMessageAt: conv.lastMessageAt || '',
    lastMessagePreview: conv.lastMessagePreview || '',
    unread: unreadCount(state, userId, conv.id),
  }
}

export function publicMessage(message, userId) {
  if (!message) return null
  if (message.deletedAt) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      authorId: message.authorId,
      authorName: message.authorName,
      body: '',
      file: null,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      status: message.status,
      starred: false,
      mine: message.authorId === userId,
    }
  }
  return {
    id: message.id,
    conversationId: message.conversationId,
    authorId: message.authorId,
    authorName: message.authorName,
    body: message.body,
    file: message.file
      ? {
          name: message.file.name,
          mime: message.file.mime,
          size: message.file.size,
          dataUrl: message.file.dataUrl,
        }
      : null,
    replyToId: message.replyToId || null,
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    status: message.status,
    starred: (message.starredBy || []).includes(userId),
    mine: message.authorId === userId,
  }
}

export function addGroupMembers(state, actor, conversationId, memberIds) {
  const next = normalizeUccState(state)
  const conv = next.conversations.find((item) => item.id === conversationId)
  if (!conv || conv.type !== 'group') {
    const err = new Error('GROUP_NOT_FOUND')
    err.code = 'GROUP_NOT_FOUND'
    throw err
  }
  if (!conv.adminIds?.includes(actor.id)) {
    const err = new Error('NOT_GROUP_ADMIN')
    err.code = 'NOT_GROUP_ADMIN'
    throw err
  }
  conv.memberIds = [...new Set([...conv.memberIds, ...memberIds.map(String)])]
  return { state: next, conversation: conv }
}
