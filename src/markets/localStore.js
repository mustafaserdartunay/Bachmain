/** Dev/mock market quotes — production must use backend MarketDataProvider. */

const DISCLAIMER = 'Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.'

const SEED = [
  { symbol: 'XU100', name: 'BIST 100', type: 'index', price: 9842.35, changePct: 0.84, currency: 'TRY' },
  { symbol: 'XU030', name: 'BIST 30', type: 'index', price: 10812.1, changePct: 0.62, currency: 'TRY' },
  { symbol: 'USDTRY', name: 'Dolar', type: 'fx', price: 34.12, changePct: -0.18, currency: 'TRY' },
  { symbol: 'EURTRY', name: 'Euro', type: 'fx', price: 37.05, changePct: 0.11, currency: 'TRY' },
  { symbol: 'XAUUSD', name: 'Altın (ons)', type: 'commodity', price: 2485.4, changePct: 0.42, currency: 'USD' },
  { symbol: 'BTCUSD', name: 'Bitcoin', type: 'crypto', price: 118420, changePct: 1.35, currency: 'USD' },
  { symbol: 'THYAO', name: 'Türk Hava Yolları', type: 'equity', price: 421.5, changePct: 1.42, currency: 'TRY' },
  { symbol: 'ASELS', name: 'Aselsan', type: 'equity', price: 182.3, changePct: 2.15, currency: 'TRY' },
  { symbol: 'TUPRS', name: 'Tüpraş', type: 'equity', price: 215.4, changePct: -0.84, currency: 'TRY' },
]

function jitter(n) {
  return n * (1 + (Math.random() - 0.5) * 0.002)
}

export function marketsOverviewLocal() {
  const quotes = SEED.map((row) => ({
    ...row,
    price: Number(jitter(row.price).toFixed(row.price >= 1000 ? 1 : 2)),
    changePct: Number((row.changePct + (Math.random() - 0.5) * 0.08).toFixed(2)),
  }))
  const gainers = [...quotes].sort((a, b) => b.changePct - a.changePct).slice(0, 3)
  const losers = [...quotes].sort((a, b) => a.changePct - b.changePct).slice(0, 3)
  return {
    marketOpen: true,
    sessionLabel: 'BIST · örnek seans',
    updatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    quotes,
    gainers,
    losers,
    favorites: quotes.filter((q) => ['THYAO', 'ASELS', 'USDTRY', 'BTCUSD'].includes(q.symbol)),
  }
}
