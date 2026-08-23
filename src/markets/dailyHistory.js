/** Daily FX / gold closes for header sparklines (no secrets). */

const CACHE_KEY = 'bach:fx-daily-history-v2'
const OUNCE_TO_GRAM = 31.1034768

function isoDay(date) {
  return date.toISOString().slice(0, 10)
}

function recentWeekdays(count) {
  const out = []
  const cursor = new Date()
  while (out.length < count) {
    const day = cursor.getUTCDay()
    if (day !== 0 && day !== 6) out.unshift(isoDay(cursor))
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return out
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

async function goldGramSeries() {
  const days = recentWeekdays(12)
  const rows = await Promise.all(
    days.map(async (day) => {
      try {
        const res = await fetch(
          `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${day}/v1/currencies/xau.min.json`,
          { cache: 'force-cache' },
        )
        if (!res.ok) return null
        const data = await res.json()
        const ounceTry = Number(data?.xau?.try)
        if (!Number.isFinite(ounceTry) || ounceTry <= 0) return null
        return {
          t: new Date(`${day}T12:00:00.000Z`).getTime(),
          value: Number((ounceTry / OUNCE_TO_GRAM).toFixed(4)),
        }
      } catch {
        return null
      }
    }),
  )
  return rows.filter(Boolean)
}

export async function loadFxDailyHistory() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (
      cached?.day === isoDay(new Date()) &&
      Array.isArray(cached.USD) &&
      cached.USD.length >= 5 &&
      Array.isArray(cached.EUR) &&
      cached.EUR.length >= 5 &&
      Array.isArray(cached.GOLD) &&
      cached.GOLD.length >= 5
    ) {
      return cached
    }
  } catch {
    /* ignore */
  }

  const [USD, EUR, GOLD] = await Promise.all([
    frankfurterSeries('USD'),
    frankfurterSeries('EUR'),
    goldGramSeries(),
  ])
  const payload = { day: isoDay(new Date()), USD, EUR, GOLD }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
  return payload
}
