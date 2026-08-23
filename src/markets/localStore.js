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
  void fallbackPrice
  const all = readAll()
  return Array.isArray(all[id]) ? all[id] : []
}

export function mergeMarketSeries(daily, live, currentPrice) {
  const byTime = new Map()
  for (const row of daily || []) {
    const value = Number(row?.value)
    const t = Number(row?.t)
    if (Number.isFinite(t) && Number.isFinite(value) && value > 0) byTime.set(t, value)
  }
  for (const row of live || []) {
    const value = Number(row?.value)
    const t = Number(row?.t)
    if (Number.isFinite(t) && Number.isFinite(value) && value > 0) byTime.set(t, value)
  }
  const rows = [...byTime.entries()].sort((a, b) => a[0] - b[0]).map(([t, value]) => ({ t, value }))
  const price = Number(currentPrice)
  if (Number.isFinite(price) && price > 0) {
    if (!rows.length) return [{ t: Date.now(), value: Number(price.toFixed(4)) }]
    const last = rows[rows.length - 1]
    if (Math.abs(last.value - price) < price * 0.00005) {
      rows[rows.length - 1] = { ...last, value: Number(price.toFixed(4)) }
    } else {
      rows.push({ t: Date.now(), value: Number(price.toFixed(4)) })
    }
  }
  return rows.slice(-MAX_POINTS)
}

export { DISCLAIMER as MARKET_RATES_DISCLAIMER }
