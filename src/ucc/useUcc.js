import { useCallback, useEffect, useState } from 'react'
import {
  createUccGroup,
  deleteUccMessage,
  editUccMessage,
  openUccDm,
  pinUccMessage,
  readUccConversation,
  sendUccMessage,
  starUccMessage,
  syncUcc,
  UCC_EVENT,
} from './uccClient'
import { UCC_TEAM_GROUP_ID } from './uccEngine'

export function useUcc() {
  const [snapshot, setSnapshot] = useState({
    me: null,
    roster: [],
    conversations: [],
    messages: [],
    conversationId: UCC_TEAM_GROUP_ID,
    local: true,
  })
  const [conversationId, setConversationId] = useState(UCC_TEAM_GROUP_ID)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(
    async (id = conversationId) => {
      const data = await syncUcc({ conversationId: id })
      setSnapshot({
        me: data.me,
        roster: data.roster || [],
        conversations: data.conversations || [],
        messages: data.messages || [],
        conversationId: data.conversationId || id,
        local: Boolean(data.local),
      })
      setLoading(false)
      return data
    },
    [conversationId],
  )

  useEffect(() => {
    refresh(conversationId)
    const timer = window.setInterval(() => refresh(conversationId), 2500)
    function onChange() {
      refresh(conversationId)
    }
    window.addEventListener(UCC_EVENT, onChange)
    let channel
    try {
      channel = new BroadcastChannel('bach-ucc')
      channel.onmessage = onChange
    } catch {
      channel = null
    }
    return () => {
      window.clearInterval(timer)
      window.removeEventListener(UCC_EVENT, onChange)
      channel?.close()
    }
  }, [conversationId, refresh])

  async function selectConversation(id) {
    setConversationId(id)
    await readUccConversation({ conversationId: id })
    await refresh(id)
  }

  return {
    ...snapshot,
    loading,
    conversationId,
    selectConversation,
    refresh,
    send: async (payload) => {
      const result = await sendUccMessage({ conversationId, ...payload })
      await refresh(conversationId)
      return result
    },
    edit: async (messageId, body) => {
      await editUccMessage({ messageId, body })
      await refresh(conversationId)
    },
    remove: async (messageId) => {
      await deleteUccMessage({ messageId })
      await refresh(conversationId)
    },
    star: async (messageId) => {
      await starUccMessage({ messageId })
      await refresh(conversationId)
    },
    pin: async (messageId) => {
      await pinUccMessage({ conversationId, messageId })
      await refresh(conversationId)
    },
    openDm: async (peer) => {
      const result = await openUccDm({ peerId: peer.id, peerName: peer.name })
      const id = result.conversation?.id
      if (id) await selectConversation(id)
    },
    createGroup: async (payload) => {
      const result = await createUccGroup(payload)
      const id = result.conversation?.id
      if (id) await selectConversation(id)
    },
  }
}
