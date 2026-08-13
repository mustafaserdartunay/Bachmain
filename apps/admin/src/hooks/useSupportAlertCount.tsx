import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supportApi } from '@/services/api'
import { SUPPORT_ALERT_EVENT } from '@/lib/supportAlertEvents'

const ACTIONABLE = new Set(['open', 'in_progress', 'waiting'])
const POLL_MS = 15_000

function countActionable(rows: unknown): number {
  const list = Array.isArray(rows)
    ? rows
    : rows && typeof rows === 'object' && Array.isArray((rows as { tickets?: unknown[] }).tickets)
      ? (rows as { tickets: unknown[] }).tickets
      : []
  return list.filter((row) => {
    const status = String(
      (row as { status?: string; statusId?: string }).statusId ||
        (row as { status?: string }).status ||
        '',
    ).toLowerCase()
    return ACTIONABLE.has(status)
  }).length
}

export function useSupportAlertCount() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const rows = await supportApi.list()
      setCount(countActionable(rows))
    } catch {
      /* keep last known count */
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), POLL_MS)
    const onFocus = () => void refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener(SUPPORT_ALERT_EVENT, onFocus)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener(SUPPORT_ALERT_EVENT, onFocus)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return count
}

const SupportAlertContext = createContext(0)

export function SupportAlertProvider({ children }: { children: ReactNode }) {
  const count = useSupportAlertCount()
  return <SupportAlertContext.Provider value={count}>{children}</SupportAlertContext.Provider>
}

export function useSupportAlert() {
  return useContext(SupportAlertContext)
}
