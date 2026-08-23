import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGroup,
  deleteMessage,
  dmConversationId,
  emptyUccState,
  ensureTeamGroup,
  markRead,
  openDm,
  postMessage,
  unreadCount,
} from './uccEngine.js'

test('tenant conversations stay member-scoped', () => {
  const a = { id: 'u1', name: 'Ada' }
  const b = { id: 'u2', name: 'Bora' }
  const c = { id: 'u3', name: 'Cem' }
  let state = ensureTeamGroup(emptyUccState(), a).state
  state = openDm(state, a, b).state
  const dm = postMessage(state, a, {
    conversationId: dmConversationId('u1', 'u2'),
    body: 'gizli',
  })
  assert.equal(unreadCount(dm.state, 'u2', dmConversationId('u1', 'u2')), 1)
  assert.equal(unreadCount(dm.state, 'u3', dmConversationId('u1', 'u2')), 0)
  assert.throws(
    () => postMessage(dm.state, c, { conversationId: dmConversationId('u1', 'u2'), body: 'hack' }),
    /CONVERSATION_FORBIDDEN/,
  )
})

test('group admin, receipts and delete', () => {
  const a = { id: 'u1', name: 'Ada' }
  const b = { id: 'u2', name: 'Bora' }
  let state = createGroup(emptyUccState(), a, { title: 'Satış', memberIds: ['u2'] }).state
  const conv = state.conversations[0]
  const posted = postMessage(state, a, { conversationId: conv.id, body: 'merhaba' })
  const read = markRead(posted.state, b, conv.id)
  assert.equal(read.state.messages[0].status, 'read')
  const gone = deleteMessage(read.state, a, posted.message.id)
  assert.ok(gone.message.deletedAt)
})
