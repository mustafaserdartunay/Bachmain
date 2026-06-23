const STORAGE_KEY = 'erlenbox-sales-rep'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { messages: [], monthlyWinners: {} }
    const parsed = JSON.parse(raw)
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      monthlyWinners: parsed.monthlyWinners || {},
    }
  } catch {
    return { messages: [], monthlyWinners: {} }
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('bach:sales-rep-updated'))
  return state
}

export function loadRepMessages() {
  return readState().messages
}

export function sendRepMessage({ fromRepId, fromRepLabel, toRepId, toRepLabel, text }) {
  const body = String(text || '').trim()
  if (!body || !fromRepLabel || !toRepLabel) return null
  const state = readState()
  const message = {
    id: createId('msg'),
    fromRepId: fromRepId || '',
    fromRepLabel,
    toRepId: toRepId || '',
    toRepLabel,
    text: body,
    createdAt: new Date().toISOString(),
    read: false,
  }
  writeState({ ...state, messages: [message, ...state.messages] })
  return message
}

export function markRepMessagesRead(repLabel, peerLabel) {
  const state = readState()
  const messages = state.messages.map((item) => {
    if (item.toRepLabel === repLabel && item.fromRepLabel === peerLabel) {
      return { ...item, read: true }
    }
    return item
  })
  writeState({ ...state, messages })
}

export function getMonthlyWinner(monthKey) {
  return readState().monthlyWinners[monthKey] || null
}

export function setMonthlyWinner(monthKey, rep) {
  const state = readState()
  writeState({
    ...state,
    monthlyWinners: {
      ...state.monthlyWinners,
      [monthKey]: {
        repId: rep.repId || rep.id || '',
        repLabel: rep.repLabel || rep.label || '',
        salesTotal: Number(rep.salesTotal) || 0,
        setAt: new Date().toISOString(),
      },
    },
  })
}

export function getConversation(reps, repLabel, peerLabel) {
  return loadRepMessages()
    .filter((item) => (
      (item.fromRepLabel === repLabel && item.toRepLabel === peerLabel)
      || (item.fromRepLabel === peerLabel && item.toRepLabel === repLabel)
    ))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function countUnreadMessages(repLabel) {
  return loadRepMessages().filter((item) => item.toRepLabel === repLabel && !item.read).length
}
