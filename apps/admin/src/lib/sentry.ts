/** Optional Sentry bootstrap for admin. Set VITE_SENTRY_DSN to enable. */
export async function initSentry(appLabel = 'bachmain-admin') {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || typeof window === 'undefined') return null

  const release = import.meta.env.VITE_SENTRY_RELEASE
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
    ;(window as unknown as { __BACHMAIN_SENTRY__?: unknown }).__BACHMAIN_SENTRY__ = {
      dsn,
      appLabel,
      enabled: true,
      sdk: true,
      release,
    }
    return Sentry
  } catch {
    ;(window as unknown as { __BACHMAIN_SENTRY__?: unknown }).__BACHMAIN_SENTRY__ = {
      dsn,
      appLabel,
      enabled: true,
      sdk: false,
      release,
    }
    console.info(`[${appLabel}] Sentry DSN set — install @sentry/react for full SDK`)
    return null
  }
}
