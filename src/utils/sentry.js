/**
 * Optional Sentry bootstrap.
 * Set VITE_SENTRY_DSN to enable. Uses @sentry/react when installed.
 */

let sentrySdk = null

export async function initSentry(appLabel = 'bachmain') {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || typeof window === 'undefined') return

  window.__BACHMAIN_SENTRY__ = { dsn, appLabel, enabled: true }

  try {
    const mod = await import('@sentry/react')
    sentrySdk = mod
    mod.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_APP_VERSION || undefined,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES || 0.05),
      integrations:
        typeof mod.browserTracingIntegration === 'function'
          ? [mod.browserTracingIntegration()]
          : [],
    })
    console.info(`[${appLabel}] Sentry SDK initialized`)
  } catch (err) {
    console.warn(`[${appLabel}] Sentry init failed`, err?.message || err)
  }
}

export function captureException(error, context = {}) {
  try {
    if (sentrySdk?.captureException) {
      sentrySdk.captureException(error, { extra: context })
      return
    }
  } catch {
    /* ignore */
  }
  if (import.meta.env.DEV) {
    console.error('[sentry]', error, context)
  } else {
    console.error('[error]', error?.message || error)
  }
}
