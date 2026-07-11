import { useEffect, useState, useCallback } from 'react'
import type { PageStatus } from '@/types'

interface UsePageStateOptions<T> {
  fetcher: () => Promise<T>
  delay?: number
  simulateEmpty?: boolean
}

export function usePageState<T>({ fetcher, delay = 400, simulateEmpty = false }: UsePageStateOptions<T>) {
  const [status, setStatus] = useState<PageStatus>('loading')
  const [data, setData] = useState<T | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      await new Promise((r) => setTimeout(r, delay))
      const result = await fetcher()
      if (simulateEmpty && Array.isArray(result) && result.length === 0) {
        setStatus('empty')
      } else {
        setData(result)
        setStatus('success')
      }
    } catch {
      setStatus('error')
    }
  }, [fetcher, delay, simulateEmpty])

  useEffect(() => {
    load()
  }, [load])

  return { status, data, reload: load }
}
