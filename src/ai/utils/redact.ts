const SECRET_PATTERN =
  /(api[_-]?key|authorization|bearer|secret|token)\s*[:=]\s*["']?([^\s"'\\]+)/gi

const LONG_TOKEN_PATTERN = /\b(?:sk-|sk-ant-|AIza|or-)[A-Za-z0-9_\-]{12,}\b/g

/** Never log raw secrets — always pass log payloads through this. */
export function redactSecrets(input: string): string {
  return input
    .replace(SECRET_PATTERN, '$1=[REDACTED]')
    .replace(LONG_TOKEN_PATTERN, '[REDACTED]')
}

export function redactUnknown(value: unknown): unknown {
  if (typeof value === 'string') return redactSecrets(value)
  if (Array.isArray(value)) return value.map(redactUnknown)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (/key|token|secret|authorization|password/i.test(key)) {
        out[key] = '[REDACTED]'
      } else {
        out[key] = redactUnknown(nested)
      }
    }
    return out
  }
  return value
}
