/** Local sparkline history fed by live mid prices (no secrets). */

const SERIES_KEY = 'bach:market-rate-series-v1'
const MAX_POINTS = 28
const DISCLAIMER = 'Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.'

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(SERIES_KEY) || '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(SERIES_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

export function pushMarketSeriesPoint(id, price) {
  const value = Number(price)
  if (!id || !Number.isFinite(value) || value <= 0) return []
  const all = readAll()
  const prev = Array.isArray(all[id]) ? all[id] : []
  const last = prev[prev.length - 1]
  if (last && Math.abs(last.value - value) < value * 0.00005) {
    return prev
  }
  const next = [...prev, { t: Date.now(), value: Number(value.toFixed(4)) }].slice(-MAX_POINTS)
  all[id] = next
  writeAll(all)
  return next
}

export function getMarketSeries(id, fallbackPrice) {
  const all = readAll()
  const series = Array.isArray(all[id]) ? all[id] : []
  if (series.length >= 2) return series
  const base = Number(fallbackPrice)
  if (!Number.isFinite(base) || base <= 0) return series
  const seed = []
  let value = base * 0.992
  for (let i = 0; i < 12; i += 1) {
    value *= 1 + (Math.sin(i / 2) * 0.0012 + (i / 12) * 0.0008)
    seed.push({ t: i, value: Number(value.toFixed(4)) })
  }
  seed.push({ t: 12, value: Number(base.toFixed(4)) })
  return seed
}

export { DISCLAIMER as MARKET_RATES_DISCLAIMER }
