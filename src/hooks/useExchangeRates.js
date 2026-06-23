import { useEffect, useState } from 'react'

const FALLBACK = {
  USD: 39.45,
  EUR: 42.85,
  GOLD: 4300,
  updatedAt: null,
  source: 'Yedek kur',
  market: {
    USD: { buy: 39.35, sell: 39.55 },
    EUR: { buy: 42.75, sell: 42.95 },
    GOLD: { buy: 4280, sell: 4320 },
  },
}
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

function toNumber(value) {
  if (typeof value === 'number') return value
  if (!value) return NaN
  return Number(String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
}

function buildMarketFromMid({ USD, EUR, GOLD }) {
  const withSpread = (value, spread = 0.0025) => ({
    buy: Number(value) * (1 - spread),
    sell: Number(value) * (1 + spread),
  })
  return {
    USD: withSpread(USD),
    EUR: withSpread(EUR),
    GOLD: withSpread(GOLD || FALLBACK.GOLD, 0.004),
  }
}

function readCachedRates() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const parsed = JSON.parse(cached)
    if (!isValidRate(parsed.USD) || !isValidRate(parsed.EUR)) return null
    return {
      ...parsed,
      GOLD: isValidRate(parsed.GOLD) ? parsed.GOLD : FALLBACK.GOLD,
      market: parsed.market || buildMarketFromMid({
        USD: parsed.USD,
        EUR: parsed.EUR,
        GOLD: parsed.GOLD || FALLBACK.GOLD,
      }),
    }
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
    GOLD: FALLBACK.GOLD,
    updatedAt: getUpdatedAt(usdData.time_last_update_utc),
    source: 'Open Exchange Rates',
    market: buildMarketFromMid({ USD, EUR, GOLD: FALLBACK.GOLD }),
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
    GOLD: FALLBACK.GOLD,
    updatedAt: getUpdatedAt(usdData.date),
    source: 'Frankfurter',
    market: buildMarketFromMid({ USD, EUR, GOLD: FALLBACK.GOLD }),
  }
}

async function fetchTruncgilRates() {
  const res = await fetch('https://finans.truncgil.com/v4/today.json', { cache: 'no-store' })
  if (!res.ok) throw new Error('Piyasa verisi alınamadı')
  const data = await res.json()
  const usdBuy = toNumber(data?.USD?.Buying)
  const usdSell = toNumber(data?.USD?.Selling)
  const eurBuy = toNumber(data?.EUR?.Buying)
  const eurSell = toNumber(data?.EUR?.Selling)
  const goldData = data?.['gram-altin'] || data?.GRA || data?.['Gram Altın']
  const goldBuy = toNumber(goldData?.Buying)
  const goldSell = toNumber(goldData?.Selling)

  if (![usdBuy, usdSell, eurBuy, eurSell, goldBuy, goldSell].every(isValidRate)) {
    throw new Error('Piyasa verisi geçersiz')
  }

  return {
    USD: (usdBuy + usdSell) / 2,
    EUR: (eurBuy + eurSell) / 2,
    GOLD: (goldBuy + goldSell) / 2,
    updatedAt: getUpdatedAt(data?.Update_Date),
    source: 'Truncgil Finans',
    market: {
      USD: { buy: usdBuy, sell: usdSell },
      EUR: { buy: eurBuy, sell: eurSell },
      GOLD: { buy: goldBuy, sell: goldSell },
    },
  }
}

async function fetchLiveRates() {
  try {
    return await fetchTruncgilRates()
  } catch {
    // Fall back to central parity APIs and derive a small buy/sell spread.
  }
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
