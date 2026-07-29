/**
 * Optional Sentry for BachMain API.
 * Set SENTRY_DSN. Soft-loads @sentry/node.
 */
export async function initApiSentry(
  appLabel = 'bachmain-api',
): Promise<{ captureException: (error: unknown) => void } | null> {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return null
  try {
    const Sentry = await import('@sentry/node')
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    })
    console.info(`[${appLabel}] Sentry enabled`)
    return { captureException: (error) => Sentry.captureException(error) }
  } catch {
    console.info(`[${appLabel}] SENTRY_DSN set — install @sentry/node for full SDK`)
    return null
  }
}

export async function captureApiException(error: unknown): Promise<void> {
  try {
    const Sentry = await import('@sentry/node')
    Sentry.captureException(error)
  } catch {
    /* optional */
  }
}
