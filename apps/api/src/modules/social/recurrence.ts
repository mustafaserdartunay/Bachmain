/** Compute next run for SMC schedules (SC-0). */

export type RecurrenceKind =
  | 'once'
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'every_2_days'
  | 'every_3_days'
  | 'every_7_days'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'
  | 'first_monday'
  | 'last_friday'
  | 'cron'
  | 'custom'

const WEEKDAY: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export function accountStatusFromExpiry(expiresAt: Date | null | undefined, now = new Date()) {
  if (!expiresAt) return 'connected' as const
  const ms = expiresAt.getTime() - now.getTime()
  if (ms <= 0) return 'error' as const
  if (ms < 7 * 24 * 60 * 60 * 1000) return 'expiring' as const
  return 'live' as const
}

export function computeNextRunAt(
  recurrence: string,
  from: Date,
  config: Record<string, unknown> = {},
): Date | null {
  const d = new Date(from)
  switch (recurrence) {
    case 'once':
      return null
    case 'daily':
    case 'every_day':
      d.setDate(d.getDate() + 1)
      return d
    case 'every_2_days':
      d.setDate(d.getDate() + 2)
      return d
    case 'every_3_days':
      d.setDate(d.getDate() + 3)
      return d
    case 'every_7_days':
    case 'weekly':
      d.setDate(d.getDate() + 7)
      return d
    case 'weekdays': {
      do {
        d.setDate(d.getDate() + 1)
      } while (d.getDay() === 0 || d.getDay() === 6)
      return d
    }
    case 'weekends': {
      do {
        d.setDate(d.getDate() + 1)
      } while (d.getDay() !== 0 && d.getDay() !== 6)
      return d
    }
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      return d
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      return d
    case 'monday':
    case 'tuesday':
    case 'wednesday':
    case 'thursday':
    case 'friday':
    case 'saturday':
    case 'sunday': {
      const target = WEEKDAY[recurrence]
      do {
        d.setDate(d.getDate() + 1)
      } while (d.getDay() !== target)
      return d
    }
    case 'first_monday': {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      while (next.getDay() !== 1) next.setDate(next.getDate() + 1)
      return next
    }
    case 'last_friday': {
      const next = new Date(d.getFullYear(), d.getMonth() + 2, 0)
      while (next.getDay() !== 5) next.setDate(next.getDate() - 1)
      return next
    }
    case 'cron':
    case 'custom': {
      const days = Number(config.everyDays || config.intervalDays || 1)
      d.setDate(d.getDate() + (Number.isFinite(days) && days > 0 ? days : 1))
      return d
    }
    default:
      d.setDate(d.getDate() + 1)
      return d
  }
}
