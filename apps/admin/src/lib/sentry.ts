/** Optional Sentry bootstrap for admin. Set VITE_SENTRY_DSN to enable. */
export function initSentry(appLabel = 'bachmain-admin') {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || typeof window === 'undefined') return
  ;(window as unknown as { __BACHMAIN_SENTRY__?: unknown }).__BACHMAIN_SENTRY__ = {
    dsn,
    appLabel,
    enabled: true,
  }
  console.info(`[${appLabel}] Sentry DSN configured — add @sentry/react for full SDK`)
}
