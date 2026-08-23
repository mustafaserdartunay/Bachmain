/** Daily FX closes for header sparklines (Frankfurter, no secrets). */

const CACHE_KEY = 'bach:fx-daily-history-v1'

function isoDay(date) {
  return date.toISOString().slice(0, 10)
}

async function frankfurterSeries(base) {
  const end = new Date()
  const start = new Date()
  start.setUTCDate(start.getUTCDate() - 18)
  const url = `https://api.frankfurter.dev/v1/${isoDay(start)}..${isoDay(end)}?base=${base}&symbols=TRY`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('history')
  const data = await res.json()
  const rates = data?.rates && typeof data.rates === 'object' ? data.rates : {}
  return Object.keys(rates)
    .sort()
    .map((day) => ({
      t: new Date(`${day}T12:00:00.000Z`).getTime(),
      value: Number(rates[day]?.TRY),
    }))
    .filter((row) => Number.isFinite(row.value) && row.value > 0)
}

export async function loadFxDailyHistory() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (
      cached?.day === isoDay(new Date()) &&
      Array.isArray(cached.USD) &&
      cached.USD.length >= 5 &&
      Array.isArray(cached.EUR) &&
      cached.EUR.length >= 5
    ) {
      return cached
    }
  } catch {
    /* ignore */
  }

  const [USD, EUR] = await Promise.all([frankfurterSeries('USD'), frankfurterSeries('EUR')])
  const payload = { day: isoDay(new Date()), USD, EUR }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
  return payload
}
