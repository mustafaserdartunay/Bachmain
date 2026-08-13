export const SUPPORT_ALERT_EVENT = 'bach:support-updated'

export function dispatchSupportUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SUPPORT_ALERT_EVENT))
}
