import { appendLocalEvent, matchPublishedWorkflows, simulateLocalWorkflow } from './localStore'

export const DOMAIN_EVENT = 'bach:domain-event'
export const WORKFLOW_MATCHED = 'bach:workflow-matched'

/**
 * Central browser event bus (WF-0).
 * Modules publish here instead of calling each other.
 * Later: also POST /v1/workflows/events when API session exists.
 */
export function publishDomainEvent(eventType, payload = {}, options = {}) {
  const detail = {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    eventType,
    payload,
    at: new Date().toISOString(),
    source: options.source || 'crm',
  }

  appendLocalEvent(eventType, payload)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DOMAIN_EVENT, { detail }))
  }

  const matched = matchPublishedWorkflows(eventType)
  for (const wf of matched) {
    if (options.autoSimulate !== false) {
      simulateLocalWorkflow(wf.id, { payload: { ...payload, _event: detail } })
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(WORKFLOW_MATCHED, {
          detail: { workflowId: wf.id, event: detail },
        }),
      )
    }
  }

  return { event: detail, matchedWorkflowIds: matched.map((m) => m.id) }
}

export function subscribeDomainEvents(handler) {
  if (typeof window === 'undefined') return () => {}
  const fn = (e) => handler(e.detail)
  window.addEventListener(DOMAIN_EVENT, fn)
  return () => window.removeEventListener(DOMAIN_EVENT, fn)
}
