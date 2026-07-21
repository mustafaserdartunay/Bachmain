function accountStatusFromExpiry(expiresAt, now = new Date()) {
  if (!expiresAt) return 'connected'
  const ms = expiresAt.getTime() - now.getTime()
  if (ms <= 0) return 'error'
  if (ms < 7 * 24 * 60 * 60 * 1000) return 'expiring'
  return 'live'
}
function computeNextRunAt(recurrence, from) {
  const d = new Date(from)
  if (recurrence === 'daily') {
    d.setDate(d.getDate() + 1)
    return d
  }
  if (recurrence === 'every_2_days') {
    d.setDate(d.getDate() + 2)
    return d
  }
  return null
}
const from = new Date('2026-07-21T10:00:00Z')
if (!(computeNextRunAt('daily', from) > from)) throw new Error('daily fail')
if (accountStatusFromExpiry(new Date(Date.now() + 10 * 864e5)) !== 'live')
  throw new Error('live fail')
if (accountStatusFromExpiry(new Date(Date.now() + 2 * 864e5)) !== 'expiring')
  throw new Error('expiring fail')
console.log('smc recurrence tests ok')
