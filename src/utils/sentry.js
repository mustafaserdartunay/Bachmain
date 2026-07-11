/**
 * Optional Sentry bootstrap. Set VITE_SENTRY_DSN to enable.
 */
export function initSentry(appLabel = 'bachmain') {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || typeof window === 'undefined') return
  // Lightweight loader without hard dependency until package is added
  window.__BACHMAIN_SENTRY__ = { dsn, appLabel, enabled: true }
  console.info(`[${appLabel}] Sentry DSN configured — add @sentry/react for full SDK`)
}
