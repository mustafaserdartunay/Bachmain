/** Dev/mock FX + gold series — production must use backend MarketDataProvider. */

const DISCLAIMER = 'Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.'

const SEED = {
  USDTRY: { label: 'Dolar', unit: '₺', base: 34.12, changePct: -0.18 },
  EURTRY: { label: 'Euro', unit: '₺', base: 37.05, changePct: 0.11 },
  XAUTRY: { label: 'Gram Altın', unit: '₺', base: 2845.6, changePct: 0.42 },
}

function jitter(n, amp = 0.002) {
  return n * (1 + (Math.random() - 0.5) * amp)
}

function buildSeries(base, points = 24) {
  const series = []
  let value = base * (1 - 0.012)
  for (let i = 0; i < points; i += 1) {
    value = jitter(value, 0.006)
    series.push({
      t: i,
      value: Number(value.toFixed(2)),
    })
  }
  series[series.length - 1].value = Number(jitter(base, 0.0015).toFixed(2))
  return series
}

export function marketRatesLocal() {
  const instruments = Object.entries(SEED).map(([id, meta]) => {
    const series = buildSeries(meta.base)
    const price = series[series.length - 1].value
    const prev = series[0].value
    const changePct = Number((((price - prev) / prev) * 100).toFixed(2))
    return {
      id,
      label: meta.label,
      unit: meta.unit,
      price,
      changePct: Number((meta.changePct + (Math.random() - 0.5) * 0.06).toFixed(2)) || changePct,
      series,
    }
  })

  return {
    updatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    instruments,
  }
}
