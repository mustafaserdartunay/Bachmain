import { useEffect, useState } from 'react'

const FALLBACK = { USD: 39.45, EUR: 42.85, updatedAt: null, source: 'Yedek kur' }
const CACHE_KEY = 'erlenbox-live-exchange-rates'
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

function getUpdatedAt(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString('tr-TR')
  return date.toLocaleString('tr-TR')
}

function isValidRate(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0
}

function readCachedRates() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const parsed = JSON.parse(cached)
    if (!isValidRate(parsed.USD) || !isValidRate(parsed.EUR)) return null
    return parsed
  } catch {
    return null
  }
}

function writeCachedRates(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates))
  } catch {
    // Cache is a convenience only; ignore storage failures.
  }
}

async function fetchOpenExchangeRates() {
  const [usdRes, eurRes] = await Promise.all([
    fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' }),
    fetch('https://open.er-api.com/v6/latest/EUR', { cache: 'no-store' }),
  ])

  if (!usdRes.ok || !eurRes.ok) throw new Error('Kur alınamadı')

  const usdData = await usdRes.json()
  const eurData = await eurRes.json()
  const USD = usdData?.rates?.TRY
  const EUR = eurData?.rates?.TRY

  if (!isValidRate(USD) || !isValidRate(EUR)) throw new Error('Kur verisi geçersiz')

  return {
    USD,
    EUR,
    updatedAt: getUpdatedAt(usdData.time_last_update_utc),
    source: 'Open Exchange Rates',
  }
}

async function fetchFrankfurterRates() {
  const [usdRes, eurRes] = await Promise.all([
    fetch('https://api.frankfurter.app/latest?from=USD&to=TRY', { cache: 'no-store' }),
    fetch('https://api.frankfurter.app/latest?from=EUR&to=TRY', { cache: 'no-store' }),
  ])

  if (!usdRes.ok || !eurRes.ok) throw new Error('Kur alınamadı')

  const usdData = await usdRes.json()
  const eurData = await eurRes.json()
  const USD = usdData?.rates?.TRY
  const EUR = eurData?.rates?.TRY

  if (!isValidRate(USD) || !isValidRate(EUR)) throw new Error('Kur verisi geçersiz')

  return {
    USD,
    EUR,
    updatedAt: getUpdatedAt(usdData.date),
    source: 'Frankfurter',
  }
}

async function fetchLiveRates() {
  try {
    return await fetchOpenExchangeRates()
  } catch {
    return fetchFrankfurterRates()
  }
}

export function useExchangeRates() {
  const [rates, setRates] = useState(() => readCachedRates() || FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchRates({ showLoading = false } = {}) {
      if (showLoading && !cancelled) setLoading(true)
      try {
        const liveRates = await fetchLiveRates()
        if (!cancelled) {
          setRates(liveRates)
          writeCachedRates(liveRates)
        }
      } catch {
        if (!cancelled) {
          setRates((current) => (current?.updatedAt ? current : readCachedRates() || FALLBACK))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRates({ showLoading: true })
    const interval = setInterval(fetchRates, REFRESH_INTERVAL_MS)

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') fetchRates()
    }

    window.addEventListener('focus', fetchRates)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('focus', fetchRates)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  return { rates, loading }
}
