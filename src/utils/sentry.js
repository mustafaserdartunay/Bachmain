/**
 * Optional Sentry bootstrap for CRM.
 * Set VITE_SENTRY_DSN to enable. Uses @sentry/react when installed.
 */
export async function initSentry(appLabel = 'bachmain') {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || typeof window === 'undefined') return null

  const release =
    import.meta.env.VITE_SENTRY_RELEASE ||
    (typeof __BACH_APP_VERSION__ !== 'undefined' ? String(__BACH_APP_VERSION__) : undefined)
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE

  try {
    const Sentry = await import('@sentry/react')
    Sentry.init({
      dsn,
      environment,
      release,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
      sendDefaultPii: false,
    })
    window.__BACHMAIN_SENTRY__ = { dsn, appLabel, enabled: true, sdk: true, release }
    return Sentry
  } catch {
    window.__BACHMAIN_SENTRY__ = { dsn, appLabel, enabled: true, sdk: false, release }
    console.info(`[${appLabel}] Sentry DSN set — install @sentry/react for full SDK`)
    return null
  }
}

export function captureException(error, context) {
  const bridge = typeof window !== 'undefined' ? window.__BACHMAIN_SENTRY__ : null
  if (!bridge?.enabled) return
  import('@sentry/react')
    .then((Sentry) => {
      if (context)
        Sentry.withScope((scope) => {
          scope.setExtras(context)
          Sentry.captureException(error)
        })
      else Sentry.captureException(error)
    })
    .catch(() => {})
}
