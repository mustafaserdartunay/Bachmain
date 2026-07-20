/** Local orchestrator event log — agents never peer-chat. */

const KEY = 'bach_aios_org_events_v1'
const EVT = 'bach:aios-org-updated'

export const AIOS_ORG_UPDATED_EVENT = EVT

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { events: [] }
    return JSON.parse(raw)
  } catch {
    return { events: [] }
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT))
  return state
}

export function listOrgEventsLocal() {
  return read().events || []
}

export function dispatchOrgEventLocal({
  fromOrgId,
  toOrgId,
  fromTitle,
  toTitle,
  intent,
  explainWhy,
  critical,
}) {
  const s = read()
  const event = {
    id: `oe_${Date.now()}`,
    type: 'aios.org.dispatch',
    fromOrgId,
    toOrgId,
    fromTitle,
    toTitle,
    intent,
    explainWhy,
    criticalApprovalRequired: Boolean(critical),
    peerChat: false,
    at: new Date().toISOString(),
  }
  s.events = [event, ...(s.events || [])].slice(0, 80)
  write(s)
  return event
}
