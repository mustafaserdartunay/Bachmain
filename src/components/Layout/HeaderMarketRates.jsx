import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CandlestickChart, Loader2, X } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import { YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import { getMarketSeries, mergeMarketSeries, pushMarketSeriesPoint } from '../../markets/localStore'
import { loadFxDailyHistory } from '../../markets/dailyHistory'

function formatPrice(value, digits = 2) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0)
}

function parseAmount(raw) {
  const normalized = String(raw || '')
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}

function requestRatesRefresh() {
  try {
    window.dispatchEvent(new Event('bach:exchange-rates-refresh'))
  } catch {
    /* ignore */
  }
}

function hashSeed(text) {
  let h = 2166136261
  const s = String(text || '')
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Instrument-specific path from previous close → live price (gold / missing history). */
function seriesFromMove(id, price, changePct) {
  const end = Number(price)
  if (!Number.isFinite(end) || end <= 0) return []
  const pct = Number(changePct) || 0
  const start = pct === 0 ? end : end / (1 + pct / 100)
  const rng = mulberry32(hashSeed(`${id}:${end.toFixed(4)}:${pct.toFixed(3)}`))
  const steps = 12
  const out = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const trend = start + (end - start) * t
    const swing = (end - start || end * 0.004) * (rng() - 0.5) * 0.55 * Math.sin(Math.PI * t)
    const value = i === 0 ? start : i === steps ? end : trend + swing
    out.push({ t: i, value: Number(value.toFixed(4)) })
  }
  return out
}

function seriesHasShape(rows) {
  if (!Array.isArray(rows) || rows.length < 4) return false
  const values = rows.map((row) => Number(row.value)).filter((n) => Number.isFinite(n) && n > 0)
  if (values.length < 4) return false
  const min = Math.min(...values)
  const max = Math.max(...values)
  return max - min > max * 0.0008
}

function toChartSeries(id, price, changePct, history) {
  const live = Array.isArray(history)
    ? history.filter((row) => Number.isFinite(Number(row.value)) && Number(row.value) > 0)
    : []
  const source = seriesHasShape(live) ? live : seriesFromMove(id, price, changePct)
  return source.map((row, index) => ({
    i: index,
    value: Number(row.value),
  }))
}

function MiniSpark({ id, series, up }) {
  const stroke = up ? '#10b981' : '#e11d48'
  const fillId = `mkt-sp-${id}`
  const values = series.map((row) => row.value).filter((n) => Number.isFinite(n))
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const pad = Math.max((max - min) * 0.18, Math.abs(max) * 0.0004, 0.0001)
  const floor = min - pad

  return (
    <div className="h-9 w-[4.5rem] shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[floor, max + pad]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            baseValue={floor}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function AmountField({ value, onChange, unit, ariaLabel }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-[rgba(70,78,102,0.28)] bg-[rgba(255,255,255,0.5)] px-2 py-1">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold tabular-nums text-[var(--ink)] outline-none"
        aria-label={ariaLabel}
      />
      <span className={`${YF_TEXT_CLASS} shrink-0 text-[12px]`}>{unit}</span>
    </div>
  )
}

function TryConverter({ rate, foreignUnit }) {
  const [foreign, setForeign] = useState('1')
  const [tryAmount, setTryAmount] = useState('')
  const [lastEdited, setLastEdited] = useState('foreign')

  useEffect(() => {
    if (!Number.isFinite(rate) || rate <= 0) return
    if (lastEdited === 'foreign') {
      const f = parseAmount(foreign)
      if (!Number.isFinite(f)) return
      setTryAmount(formatPrice(f * rate, 2))
      return
    }
    const t = parseAmount(tryAmount)
    if (!Number.isFinite(t)) return
    setForeign(formatPrice(t / rate, foreignUnit === 'gr' ? 4 : 2))
  }, [rate]) // foreign/try/lastEdited intentionally omitted — only reprice on live rate tick

  function onForeignChange(value) {
    setLastEdited('foreign')
    setForeign(value)
    const f = parseAmount(value)
    if (!Number.isFinite(f) || !rate) {
      setTryAmount('')
      return
    }
    setTryAmount(formatPrice(f * rate, 2))
  }

  function onTryChange(value) {
    setLastEdited('try')
    setTryAmount(value)
    const t = parseAmount(value)
    if (!Number.isFinite(t) || !rate) {
      setForeign('')
      return
    }
    setForeign(formatPrice(t / rate, foreignUnit === 'gr' ? 4 : 2))
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <AmountField
        value={foreign}
        onChange={onForeignChange}
        unit={foreignUnit}
        ariaLabel="Döviz veya gram tutarı"
      />
      <span className={`${YF_TEXT_CLASS} shrink-0 opacity-50`}>→</span>
      <AmountField
        value={tryAmount}
        onChange={onTryChange}
        unit="₺"
        ariaLabel="Türk lirası tutarı"
      />
    </div>
  )
}

function RateCard({ instrument }) {
  const up = instrument.changePct >= 0
  return (
    <div className="rounded-2xl bg-[rgba(255,255,255,0.28)] p-3 ring-1 ring-[rgba(255,255,255,0.5)]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`${YF_TEXT_CLASS}`}>{instrument.label}</p>
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                up ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {up ? '+' : ''}
              {Number(instrument.changePct || 0).toFixed(2)}%
            </span>
          </div>
          <p className={`${YFB_TEXT_CLASS} mt-0.5 text-[15px] tabular-nums text-[var(--ink)]`}>
            {formatPrice(instrument.price, instrument.id === 'GOLD' ? 2 : 4)}
            <span className={`${YF_TEXT_CLASS} ml-1`}>₺</span>
          </p>
        </div>
        <MiniSpark id={instrument.id} series={instrument.series} up={up} />
      </div>
      <TryConverter rate={instrument.price} foreignUnit={instrument.foreignUnit} />
    </div>
  )
}

export default function HeaderMarketRates() {
  const { open, setOpen, toggle } = useHeaderPopover('market-rates')
  const { rates, loading } = useExchangeRates()
  const [seriesTick, setSeriesTick] = useState(0)
  const [dailyHistory, setDailyHistory] = useState({ USD: [], EUR: [], GOLD: [] })
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'end',
    matchWidth: false,
    width: 300,
    offset: 8,
  })

  useEffect(() => {
    if (!open) return undefined
    requestRatesRefresh()
    const id = window.setInterval(requestRatesRefresh, 30_000)
    return () => window.clearInterval(id)
  }, [open])

  useEffect(() => {
    let cancelled = false
    loadFxDailyHistory()
      .then((data) => {
        if (!cancelled)
          setDailyHistory({ USD: data.USD || [], EUR: data.EUR || [], GOLD: data.GOLD || [] })
      })
      .catch(() => {
        if (!cancelled) setDailyHistory({ USD: [], EUR: [], GOLD: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    ;[
      ['USD', rates.USD],
      ['EUR', rates.EUR],
      ['GOLD', rates.GOLD],
    ].forEach(([id, price]) => {
      if (Number.isFinite(price) && price > 0) pushMarketSeriesPoint(id, price)
    })
    setSeriesTick((n) => n + 1)
  }, [rates.USD, rates.EUR, rates.GOLD, rates.updatedAt])

  const instruments = useMemo(() => {
    void seriesTick
    const build = (id, label, foreignUnit, price, changePct) => {
      const history = mergeMarketSeries(dailyHistory[id] || [], getMarketSeries(id, price), price)
      return {
        id,
        label,
        foreignUnit,
        price,
        changePct,
        series: toChartSeries(id, price, changePct, history),
      }
    }
    return [
      build('USD', 'Dolar', '$', rates.USD, rates.change?.USD ?? 0),
      build('EUR', 'Euro', '€', rates.EUR, rates.change?.EUR ?? 0),
      build('GOLD', 'Gram Altın', 'gr', rates.GOLD, rates.change?.GOLD ?? 0),
    ]
  }, [rates, seriesTick, dailyHistory])

  return (
    <div
      className="relative flex items-center"
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        data-header-popover-trigger="market-rates"
        onClick={() => toggle()}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label="Döviz ve altın"
        title="Döviz ve Altın"
        aria-expanded={open}
      >
        <span className="icon-wrap">
          <CandlestickChart className="h-4 w-4 shrink-0" />
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={
                menuStyle ?? {
                  position: 'fixed',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                  zIndex: 10000,
                }
              }
              className="app-header-dropdown header-popover-panel w-[min(18.75rem,calc(100vw-1rem))] overflow-hidden"
              data-header-popover="market-rates"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="header-popover-head !px-3 !py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Kurlar
                  </p>
                  <p className={`${YF_TEXT_CLASS} mt-0.5 flex items-center gap-1.5`}>
                    {loading ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : null}
                    <span className="truncate">{rates.updatedAt || '—'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[min(72vh,34rem)] space-y-2 overflow-y-auto p-2.5">
                {instruments.map((instrument) => (
                  <RateCard key={instrument.id} instrument={instrument} />
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
